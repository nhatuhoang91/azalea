"use strick";
function DataChannel(dc){
    this.dc = dc;
    this.dc.onmessage = this._handlerOnMessageDataChannel.bind(this);
    this.handlerChatMessage = null;
    this.handlerSignalingData = null;
};
DataChannel.prototype._handlerOnMessageDataChannel = function(e){
     var data = JSON.parse(e.data);
    //console.log("data : "+JSON.stringify(data)+" ; type:"+data.type);
    if(data.type === 'signal'){
        this.handlerSignalingData(data);
    }else{
        this.handlerChatMessage(data);
    }
    
};
DataChannel.prototype.send = function(data){
    this.dc.send(data);
};
DataChannel.prototype.setHandlerChatMessage = function(h){
    this.handlerChatMessage = h;
};
DataChannel.prototype.setHandlerSignalingData = function(h){
    this.handlerSignalingData = h;
};
DataChannel.prototype.close = function(){
    this.dc.close();
};