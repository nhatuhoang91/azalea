"use strick";
function ClientSocket(util){
    this.socket = null;
    this.util=util;
};

ClientSocket.prototype.connect = function(onSuccessed,onFailed,handler){
    var that = this;
    this.socket = io('http://192.168.1.83:3000',{
         'reconnection':true,
         'reconnectionDelay':500,
         'reconnectionAttempts': 5
     });
    /*this.socket = io('https://vnchats.com',{
         'reconnection':true,
         'reconnectionDelay':500,
         'reconnectionAttempts': 5
     });*/
    //socket = io('http://159.203.101.219');
    this.socket.on('connect',function(){
       // console.log("socket.id : "+that.socket.id);
        onSuccessed(that.socket.id);
    });
    this.socket.on('disconnect', function(){
      //  console.log("socket disconnect");
    });
    this.socket.on('connect_failed', function(){
       // console.log("socket connect_failed");
    });
    this.socket.on('reconnect', function(number){
        //console.log("socket reconnect. Number : "+number);
        var oldSocketId = that.util.getSessionData("socketId");
        that.util.storeSessionData("oldSocketId", oldSocketId);
    });
    this.socket.on('reconnect_failed', function(){
       // console.log("socket reconnect_failed");
    });
    this.socket.on('reconnect_attempt', function(number){
       // console.log("socket reconnect_attempt. Number : "+number);
    });
    this.socket.on('error', function(error){
       // console.log("socket error");
        onFailed(error);
    });
    this.socket.on('found', function(data){
       // console.log("found event");
        handler(data);
    });
    this.socket.on('exchange-sdp', function(data){
        handler(data);
    });
};
ClientSocket.prototype.findingPeer = function(id, blacklist, onError){
   // console.log("findingPeer was called");
    if(this.socket === undefined || this.socket === null){
        onError("findingPeer : socket undefined")
        return;
    }
    this.socket.emit('find', {
        id: id,
        blacklist: blacklist
    });
};
ClientSocket.prototype.send = function(id, data, t){
    if(this.socket){
        this.socket.emit('exchange-sdp',{
            id:id,
            signal: t,
            data: data
        });
    }else{
       // console.log("socket is not define");
    }
};