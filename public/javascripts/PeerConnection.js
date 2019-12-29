"use strick";
function PeerConnection(){
    this.state = "normal";
    this.stunuri = true;
    this.turnuri = true;
    this.config = this._genConfig(this.stunuri,this.turnuri);
    this.pc = null;
    this.dc = null;    
    this.clientSocket = null;
    this.peerVideo = null;
    this.peerVideoStream = null;
    this.myVideo = null;
    this.myVideoStream = null;
    this.audioSender = null;
    this.videoSender = null;
    this.handlerChatMessage;
    this.updateConnectedState;
};
PeerConnection.prototype.createDC = function(id){
    if(this.pc.createDataChannel !== undefined){
        this.dc = new DataChannel(this.pc.createDataChannel(id));
        this.dc.setHandlerSignalingData(this._handlerSignalingData.bind(this));
        this.dc.setHandlerChatMessage(this.handlerChatMessage);
    }else{
        //console.log("data channel was not supported");
    }
};
PeerConnection.prototype.setHandlerChatMessage = function(handler){
    this.handlerChatMessage = handler
};
PeerConnection.prototype.getDC = function(){
    return this.dc;
};
PeerConnection.prototype._handlerSignalingData = function(data){
    var that = this;
    switch(data.action){
        case 'offer':
            this.setRD(data.data);
            //console.log("offer received : "+ JSON.stringify(data.data));
            this.createAnswer()
                .then(function(answer){
                 //   console.log("renegotiate createAnswer()");
                    that.setLD(answer);
                    var package ={type:'signal', action:'answer', data:answer};
                    that.dc.send(JSON.stringify(package));
                })
                .catch(function(err){
                   // console.log("Error : "+ err);
                });
        break;
        case 'answer':
            this.setRD(data.data);
        break;
        case 'ice':
            this.addIC(data.data);
        break;
        default:
    }
};
PeerConnection.prototype.setUpdateConnectedState = function(h){
    this.updateConnectedState = h
};
PeerConnection.prototype.setPeerMedia = function(video, videoStream){
    this.peerVideo = video;
    this.peerVideoStream = videoStream;
};
PeerConnection.prototype.setMyMedia = function(video, videoStream){
    this.myVideo = video;
    this.myVideoStream = videoStream;
};
PeerConnection.prototype.setSender = function(audio, video){
    this.audioSender = audio;
    this.videoSender = video;
};
PeerConnection.prototype.setClientSocket = function(clientSocket){
    this.clientSocket = clientSocket;
};
PeerConnection.prototype.getClientSocket = function(){
    return this.clientSocket;
}
PeerConnection.prototype.createPC = function(){
    this.pc = new window.RTCPeerConnection({ iceServers: this.config });  
    this.addTrackOrStream();

    this.pc.onicecandidate = this._onIceCandidate.bind(this);

    if(this.pc.ontrack !== undefined){
        //ontrack
        this.pc.ontrack = this._onTrackAdded.bind(this);
        //console.log("ontracdadd")
    }else{
        this.pc.onaddstream = this._onRemoteStreamAdded.bind(this);
       // console.log("onaddstream");
    }
    this.pc.onremovestream = this._onRemoveStream.bind(this);

   // this.pc.ondatachannel = this._handlerOndataChannel;
    this.pc.onsignalingstatechange = this._onSignalingStateChange.bind(this);
    this.pc.oniceconnectionstatechange = this._onIceConnectionStateChange.bind(this);
    this.pc.onnegotiationneeded = this._onNegotiationNeeded.bind(this);
    this.pc.ondatachannel = this._onDataChannel.bind(this);
};
PeerConnection.prototype._onNegotiationNeeded = function(){
    //console.log("onNegotiationNeeded was called  : state :" +this.state);
    if(this.state !== "renegotiate")
        return;
    var that = this;
    this.createOffer()
            .then(function(offer){
              //  console.log("hander.start : createOffer renegotiate success");
            //console.log("offer : "+ JSON.stringify(offer));
                //console.log("offer: "+ JSON.stringify(offer).replace(/\\r\\n/g,'\n'));
                that.setLD(offer);
                var package = {type:'signal', action:'offer', data:offer};
                that.dc.send(JSON.stringify(package));
            })
            .catch(function(err){
              //  console.log("Error : "+ err);
            });
}
PeerConnection.prototype._onIceConnectionStateChange = function(e){
   // console.log("ice connection state : "+ this.pc.iceConnectionState);
    if(this.state ==="renegotiate"){
        this.setState("normal");
    }
    if(this.pc.iceConnectionState === "connected"){
        this.updateConnectedState();
    }
    //if(pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed"){
      //  restState();
    //}
}
PeerConnection.prototype._onSignalingStateChange = function(e){
   // console.log("onSignalingStateChange was call: signalingState: "+this.pc.signalingState);
   // if(pc.signalingState === "closed"){
     //   findingPeerState();
      //  return;
    //}
  /*  if(pc.remoteDescription !== null && pc.localDescription !== null){
        if(pc.signalingState === "stable"){
            connectedState();
        }
    }*/
};
PeerConnection.prototype._onRemoveStream = function(e) { 
    //console.log("onRemovedStream was called");
    //this.pc.removeStream(this.myVideoStream);
};
PeerConnection.prototype._onRemoteStreamAdded = function(e){
   // console.log("onRemoteStreamAdded was called");
    this.peerVideoStream = e.stream;
    //peerVideoStream.onremovetrack = onRemoveTrack;
    this.peerVideo.srcObject = this.peerVideoStream;
    //peerVideo.play();
};
/*need */
PeerConnection.prototype._onTrackAdded = function(e){
    //  console.log("onTracksAdds e.getStreams[0] : "+e.streams[0]);
    //console.log("onTracksAdds e.getStreams[0].getTracks : "+e.streams[0].getTracks());
    this.peerVideoStream = e.streams[0];
    //peerVideoStream.onremovetrack = onRemoveTrack;
    this.peerVideo.srcObject = this.peerVideoStream;
};
/*need*/
PeerConnection.prototype._onIceCandidate = function(e){
    if(this.state ==='renegotiate'){
        if(e.candidate){
            var package = {type:'signal', action:'ice', data: e.candidate};
            this.dc.send(JSON.stringify(package));
        }
    }else if (e.candidate) {
        this.clientSocket.send({fromGuid: guid,
                    fromSocketId:socketId, 
                    toGuid: peerGuid,
                    toSocketId:peerSocketId}, {candidate:e.candidate
           // mlineindex: e.candidate.sdpMLineIndex,
           // candidate: e.candidate.candidate
        }, "candidate");
    }
};
PeerConnection.prototype._onRemoveTrack = function(e){
   // console.log("onRemoveTrack was called");
};
PeerConnection.prototype._onDataChannel = function(e){
   // console.log("ondatachannel was calle");
    this.dc = new DataChannel(e.channel);
    this.dc.setHandlerSignalingData(this._handlerSignalingData.bind(this));
    this.dc.setHandlerChatMessage(this.handlerChatMessage);
};
PeerConnection.prototype.stop = function(){
    try{
        if(this.pc.removeTrack === undefined){
           // console.log("removeStream was called");
            this.pc.removeStream(this.myVideoStream);
            //pc.removeStream(peerVideoStream);
        }else{
          //  console.log("removeTrack was called");
            this.pc.removeTrack(this.audioSender);
            this.pc.removeTrack(this.videoSender);
        }
        this.peerVideo.srcObject.getTracks().forEach(
            function(track){
              //  console.log("stop track");
                track.stop();
            });
        this.peerVideo.srcObject = null;
        this.dc.close();
        this.pc.close();
    }catch(e){
        alert("error : " +e);
    }
};

PeerConnection.prototype.removeTrackOrStream = function(){
   // console.log("removeTrackOrStream was called");
    if(this.pc.removeTrack === undefined){
       // console.log("pc.removeStream");
        this.pc.removeStream(this.myVideoStream);
    }else{
       // console.log("pc.removeTrack");
        this.pc.removeTrack(this.audioSender);
        this.pc.removeTrack(this.videoSender);
    }
};
PeerConnection.prototype.addTrackOrStream = function(){
    if(this.pc.addTrack === undefined){
       // console.log("myVideoStream tracks: "+this.myVideoStream.getTracks());
        this.pc.addStream(this.myVideoStream);
    }
    else{
       // console.log("myVideoStream.getTracks not null ");
       // console.log("myVideoStream.getTrack()[0] : "+ this.myVideoStream.getTracks()[0]);
        // console.log("myVideoStream.getTrack()[1] : "+ this.myVideoStream.getTracks()[1]);
        this.audioSender =  this.pc.addTrack(this.myVideoStream.getTracks()[0], this.myVideoStream);
        this.videoSender = this.pc.addTrack(this.myVideoStream.getTracks()[1], this.myVideoStream);
    }
};
PeerConnection.prototype.changeMedia = function(stream){
    this.myVideoStream = stream;
    this.myVideo.srcObject = stream;
    this.addTrackOrStream();
}
PeerConnection.prototype.createOffer = function(){
    var that = this;
    var promise = this.pc.createOffer();
        if(promise instanceof Promise){
           // console.log("this browser supported promise based createOffer()");
            return promise;
        }else{
           // console.log("this browser supported old createOffer()");
            return new Promise(function(resolve, reject){
                that.pc.createOffer(resolve,reject);
            });
    } 
};
PeerConnection.prototype.createAnswer = function(){
    var that = this;
    var promise = this.pc.createAnswer();
    if(promise instanceof Promise){
        //console.log("this browser supported promise based createAnswer()");
        return promise;
    }else{
        //console.log("this browser supported old createAnswer()");
        return new Promise(function(resolve, reject){
            that.pc.createAnswer(resolve,reject);
        });
    } 
};
PeerConnection.prototype.setState = function(state){
    this.state = state;
}
PeerConnection.prototype.getState = function(state){
    return this.state;
}
PeerConnection.prototype.setRD = function(d){
    //set remoteDescription
     this.pc.setRemoteDescription(new RTCSessionDescription(d));
}
PeerConnection.prototype.setLD = function(d){
    //set localDescription
     this.pc.setLocalDescription(new RTCSessionDescription(d));
}
PeerConnection.prototype.addIC = function(ic){
    //ice candidate
     this.pc.addIceCandidate(new RTCIceCandidate(ic));
}
PeerConnection.prototype._genConfig = function(isSturnUri, isTurnUri){
    var config = new Array();
    if (isSturnUri) {
        config.push({"urls":"stun:stun.l.google.com:19302"});
        config.push({"urls":"stun:stun1.l.google.com:19302"});
        config.push({"urls":"stun:stun2.l.google.com:19302"});
        config.push({"urls":"stun:stun3.l.google.com:19302"});
        config.push({"urls":"stun:stun4.l.google.com:19302"});
    
        if (isTurnUri) {
            if (isSturnUri) {
                config.push({
                    'urls': 'stun:turn.quickblox.com',
                    'username': 'quickblox',
                    'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
                });
            }else {
                config.push({
                    'urls': 'turn:turn.quickblox.com:3478?transport=udp',
                    'username': 'quickblox',
                    'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
                });

                config.push({
                    'urls': 'turn:turn.quickblox.com:3478?transport=tcp',
                    'username': 'quickblox',
                    'credential': 'baccb97ba2d92d71e26eb9886da5f1e0'
                });
            }//en else
        }//end if
    }//end if
    return config;
};

