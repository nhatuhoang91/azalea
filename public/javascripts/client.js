const CONNECTING_STATE=0;
const CONNECTING_IN_PROGRESS_STATE=1
const CONNECTTED_STATE=2;
const REST_STATE=3;
const READY_STATE=4;
var state;
var messageDiv, messageArea, status, mobileStatus,typingTextArea, sendButton, nextButton;
var myVideoStream, myVideo;
var peerVideoStream, peerVideo;
var divVideoControl, divWebcam;
var imgPaused, imgNext, imgResize;
var imgMyMute, imgMyPause, selectWebcam; 
var divPeerVideo, divMyvideo;
var isMobile;
var audioSender , videoSender;
var doNothing = function () { };
var guid, peerGuid;
var socketId, peerSocketId;
var blacklist=[];
var clientSocket;
var pc, dc;
var media, util;
var constrains;
/*var constraints = {
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }
};*/

$(document).ready(function(){
    //myVideo = $("my-video");
    myVideo = document.getElementById("my-video");
    peerVideo = document.getElementById("peer-video");
    //code control element
    imgNext = document.getElementById("img-next");
    imgMyMute = document.getElementById("img-my-mute");
    imgMyPause = document.getElementById("img-my-pause");
    selectWebcam = document.getElementById("select-webcam");
    isMobile = checkIsMobile();
    media = new Media(navigator);
    /*media.mediaInfo().then(function(devices){
        var i = 1;
        devices.forEach(function(device) {
            console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
            if(device.label === ""){
                if(device.kind ==="videoinput"){
                    var option = document.createElement("option");
                    option.text= "Camera "+i++;
                    selectWebcam.add(option);
                }
            }else{
                if(device.kind ==="videoinput"){
                    var option = document.createElement("option");
                    option.text= device.label;
                    selectWebcam.add(option);
                }
            }
        });
    })
    .catch(function(err){
        console.log("mediaInfo error : "+err);
    });*/
    if(isMobile){
        constrains = media.genConstrains(true, true, true, false); 
    }else{
        constrains = media.genConstrains(false,true,true,false);
    }
    media.getMedia(constrains)
    .then(function(stream){
        //console.log("success");
        myVideoStream = stream;
        myVideo.srcObject = stream;
        myVideo.muted=true;
        pc = new PeerConnection();
        util = new Util(sessionStorage);
        clientSocket = new ClientSocket(util);
        connectingServerState();
    }).catch(function(err) {
        alert("Please share your camera. Exit and try again!");
        //console.log(err.name + ": " + err.message);
    });
});
/*$(window).on("beforeunload", function(e){
    var message = "are you sure to exit?";
    e.returnValue = message;
    return message;
});*/
/*window.addEventListener("beforeunload", function (event) {
    var message = "are you sure to exit?";
    e.returnValue = message;
    return message;
});*/
$(window).unload(function(){
    onNextButtonClick();
});
function createPC(){
    pc.setMyMedia(myVideo,myVideoStream);
    pc.setPeerMedia(peerVideo, peerVideoStream);
    pc.setSender(audioSender, videoSender);
    pc.setClientSocket(clientSocket);
    pc.setHandlerChatMessage(handlerOnMessageDataChannel);
    pc.setUpdateConnectedState(connectedState);
    pc.createPC();
}

function handlerOnMessageDataChannel(data){
    //console.log("data: "+e.data.type);
    if(data.action === 'stop'){
        restState();
    }else{
       // console.log("data.message : "+data.data);
        var message = util.escapeHtml(data.data);
        $("#chat").append("<b>Stranger</b> : "+message+" </br>");
        $("#div-message")[0].scrollTop = $("#div-message")[0].scrollHeight;
    }
}
function sendMessageDataChannel(){
   // console.log("send message was click");
    var message = util.escapeHtml($("#typing-message").val());
    $("#chat").append("<b>You</b> : "+message+"</br>");
    $("#div-message")[0].scrollTop = $("#div-message")[0].scrollHeight;
    var package = {type:'ui', action:'message', data:message};
    //console.log("pc.getDC() : "+pc.getDC());
    pc.getDC().send(JSON.stringify(package));
}

/*function onNextButtonClick(){
    if(timeScheduleDisconnectSocket !== undefined){
        blacklist.push(peerGuid);
        if(blacklist.length === 6)
            blacklist.shift();
        findingPeerState();
    }
}*/
function onNextButtonClick(){
    switch(state){
        case CONNECTING_STATE:
        break;
        case CONNECTING_IN_PROGRESS_STATE:
            connectingState();
            findingPeerState();
        break;
        case CONNECTTED_STATE:
            var package = {type:'ui', action:'stop'};
            pc.getDC().send(JSON.stringify(package));
            stop();
            readyState();
        break;
        case REST_STATE:
            stop();
            connectingState();
            blacklist.push(peerGuid);
            if(blacklist.length === 6)
            blacklist.shift();
            findingPeerState();
        break;
        case READY_STATE:
            connectingState();
            blacklist.push(peerGuid);
            if(blacklist.length === 6)
                blacklist.shift();
            findingPeerState();
        break;
        default :
            //console.log("onNextButtonClick : state was not defined");
    }
}

function stop(){
    pc.stop();
}
function connectingServerState(){
    connectingState();
    clientSocket.connect(connectServerSuccessed, connectServerFailed, handlerData);
}
function connectServerSuccessed(id){
    //console.log("connectServerSuccessed");
    socketId = id;
    //console.log("storeSessionData : store socketId");
    util.storeSessionData("socketId",socketId);
    findingPeerState();
}
function connectServerFailed(error){
   // console.log("connect server error : "+error);
}
function findingPeerState(){
   // console.log("findingPeerState");
    createPC();
    guid = util.getSessionData("guid");
    if(guid === undefined || guid === null){
        guid = util.genGUID();
       // console.log("genGUID : "+guid);
        //console.log("storeSessionData: store guid");
        util.storeSessionData("guid",guid)
    }
    var oldSocketId = util.getSessionData("oldSocketId");
    if(oldSocketId === undefined){
        clientSocket.findingPeer({guid:guid,socketId:socketId}, blacklist, findingPeerError);
    }else{
        util.deleteSessionData("oldSocketId");
        clientSocket.findingPeer({guid:guid,socketId:socketId, oldSocketId:oldSocketId},
         blacklist, findingPeerError);
    }
}

function handlerData(data){
   switch(data.signal){
       case "start":
       //console.log("handler start");
       connectingInProgressState();
        peerGuid = data.id.peerGuid;
        peerSocketId = data.id.peerSocketId;
        pc.createDC("chat");
        pc.getDC().setHandlerChatMessage(handlerOnMessageDataChannel);
        pc.createOffer()
            .then(function(offer){
               // console.log("hander.start : createOffer success");
                //console.log("offer: "+ JSON.stringify(offer).replace(/\\r\\n/g,'\n'));
                //console.log("offer : "+JSON.stringify(offer));
                pc.setLD(offer);
                
                clientSocket.send({fromGuid: guid,
                    fromSocketId:socketId, 
                    toGuid: peerGuid,
                    toSocketId:peerSocketId}
                    , offer, "offer");
            })
            .catch(function(err){
                //console.log("Error : "+ err);
            });
            break;
        case "offer":
           // console.log("offer handler was called");
            connectingInProgressState();
            //console.log("data.data offer : "+ JSON.stringify(data.data));
            pc.setRD(data.data);
            if(peerSocketId === undefined || peerSocketId !== data.id.fromSocketId){
                peerGuid = data.id.fromGuid;
                peerSocketId = data.id.fromSocketId;          
            }
            //pc.setRemoteDescription(data.data); 
            pc.createAnswer()
                .then(function(answer){
                   // console.log("hander.hanldlerData : createAnswer()");
                    pc.setLD(answer);

                    clientSocket.send({fromGuid: guid,
                        fromSocketId:socketId, 
                        toGuid: peerGuid,
                        toSocketId:peerSocketId}, 
                    answer,"answer");
                })
                .catch(function(err){
                   // console.log("Error : "+ err);
                });
            break;
        case "answer":
                pc.setRD(data.data);
               // console.log("answer handler was called");
               // console.log("answer: "+JSON.stringify(data.data).replace(/\\r\\n/g,'\n'));
            break;
        case "candidate":
                //console.log("candidate : "+ JSON.stringify(data.data.candidate));
                 pc.addIC(data.data.candidate);
            break;
        default: //console.log("can not regconize signal");
   }
}

function findingPeerError(error){
   // console.log("finding Peere State Error : "+ error);
}
function connectingState(){
    state = CONNECTING_STATE;
    setupUI("connecting-state");
}
function connectedState(){
    state = CONNECTTED_STATE;
    setupUI("connected-state");
}
function connectingInProgressState(){
    state = CONNECTING_IN_PROGRESS_STATE;
    setupUI("connecting-in-progress-state");
}
function restState(){
    state = REST_STATE;
    setupUI("rest-state");
}
function readyState(){
    state = READY_STATE;
    setupUI("ready-state");
}
function setupUI(state){
    switch(state){
        case "connecting-state":
           // console.log("Connecting State");
            if(isMobile){
                $("#mobile-status").text("Finding stranger ...").fadeIn();
            }
            $("#status").text("Finding stranger ...");
            $("#chat").empty();
            $("#chat").prop('disabled',true);
            $("#typing-message").val("");
            $("#typing-message").prop('disabled',true);
            $("#next-button").prop('disabled',true);
            $("#send-button").prop('disabled',true);
            //$("#video-control").hide();
            break;
        case "connecting-in-progress-state":
           // console.log("Connecting In Progress");
            if(isMobile){
                $("#mobile-status").text("YAY! Connecting to stranger ...").fadeIn();
            }
            $("#status").text("YAY! Connecting to stranger ...");
            $("#next-button").prop('disabled',false);
            break; 
        case "connected-state":
           // console.log("Connected State");
            if(isMobile){
                $("#mobile-status").text("Connected").fadeIn(3000);
                $("#video-control").fadeIn(2000);
            }
            $("#mobile-status").fadeOut(3000);
            $("#status").text("Send Hi! to break ice");
            $("#chat").prop('disabled',false);
            $("#typing-message").prop('disabled',false);
            $("#send-button").prop('disabled',false);
            $("#next-button").prop('disabled',false);
            
            $("#img-paused").click(function(){
                if($("#peer-video").get(0).paused){
                    $("#peer-video").get(0).play();
                    $("#img-paused").attr("src","../images/pause50x50.png");
                }else{
                    $("#peer-video").get(0).pause();
                    $("#img-paused").attr("src","../images/play50x50.png");
                }
            });
          /*  $(divWebcam).click(function(){
                if($(divVideoControl).css("display")==="none"){
                    $(divVideoControl).fadeIn();
                }else{
                    $(divVideoControl).fadeOut();
                }
            });*/
            $("#img-resize").click(function(){
                var position = $("#div-peer-video").css("position");
                if(position === "absolute"){
                    $("#div-peer-video").css("position","relative");
                    $("#div-peer-video").css("height","50%");
                    $("#div-my-video").css("width","100%");
                    $("#div-my-video").css("height","50%");
                    $("#div-my-video").css("top","0%");
                }else{
                    $("#div-peer-video").css("position","absolute");
                    $("#div-peer-video").css("height","100%");
                    $("#div-my-video").css("width","30%");
                    $("#div-my-video").css("height","30%");
                    $("#div-my-video").css("top","70%");
                }
            });
           
            $("#div-webcam").hover(function(){
                $("#video-control").fadeIn();
            },
                function(){
                $("#video-control").fadeOut();
            });
            break;
            case "rest-state":
               // console.log("rest-state");
                if(isMobile){
                    $("#mobile-status").text("Stranger disconnected. CLick next to start").fadeIn();
                }
                $("#status").text("Stranger disconnected. CLick next to start");
                $("#next-button").prop('disabled',false);
                $("#chat").prop('disabled',true);
                $("#typing-message").val("");
                $("#typing-message").prop('disabled',true);
                $("#send-button").prop('disabled',true);
            break;
            case "ready-state":
                //console.log("rest-state");
                if(isMobile){
                    $("#mobile-status").text("CLick next to start").fadeIn();
                }
                $("#status").text("Click next to start");
                $("#next-button").prop('disabled',false);
                $("#chat").prop('disabled',true);
                $("#typing-message").val("");
                $("#typing-message").prop('disabled',true);
                $("#send-button").prop('disabled',true);
            break;
        default:// console.log("can not recognize state");
    }
}

function checkIsMobile(){
    if($(".mobile-control").css("display") === "none"){
       // console.log("mobile");
        return false;
    }else{
       // console.log("non mobile");
        return true;
    }
}

function onFlipCamButtonClick(){
     //NOTE: STOP TRACK BEFORE....
    myVideoStream.getTracks().forEach(function(track) {
      track.stop();
    });
    constrains = media.genConstrains(true, true,true,true);
    media.getMedia(constrains)
      .then(function(stream){
          pc.setState("renegotiate");
        pc.removeTrackOrStream();
        myVideoStream = stream;
        myVideo.srcObject = stream;
        myVideo.muted=true;
        pc.setMyMedia(myVideo,myVideoStream);
        pc.addTrackOrStream();
    }).catch(function(err) {
        alert("Please share your camera. Exit and try again!");
        $("#mobile-status").text("errorr: "+err).fadeIn(2000);
        //console.log(err.toString());
    });
}
function myPausedClicked(){
    constrains = media.genConstrains(false, true, false, false);
    media.getMedia(constrains)
    .then(function(stream){
        myVideoStream = stream;
        myVideo.srcObject = stream;
        pc.setMyMedia(myVideo,myVideoStream);
        pc.setState("renegotiate");
        pc.addTrackOrStream();
    }).catch(function(err) {
       // console.log(err.name + ": " + err.message);
    });
}