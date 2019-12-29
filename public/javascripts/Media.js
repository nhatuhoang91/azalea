"use strick";
function Media(navigator){
    this.navigator = navigator;
    this.isFront = true;
};
Media.prototype.genConstrains = function(isMobile, audio, video, isflip){
    if(isMobile){
        if(isflip){
            this.isFront= this.isFront?false:true;
            return {audio: true, video: { facingMode: (this.isfront? "user" : "environment") } };
        }else{
            return { audio: true, video: { facingMode: "user" } };
        }
    }else{
        return {audio:audio, video:video};
    }
};
Media.prototype._hasUserMedia = function(){
    return !!(this.navigator.getUserMedia || this.navigator.webkitGetUserMedia 
    || this.navigator.mozGetUserMedia || this.navigator.msGetUserMedia);
};
Media.prototype._getMediaOldAPI = function(constrain){
    var that = this;
    if(this._hasUserMedia()){
        this.navigator.getUserMedia = this.navigator.getUserMedia ||
        this.navigator.webkitGetUserMedia || this.navigator.mozGetUserMedia ||
        this.navigator.msGetUserMedia;

      //  console.log("this browser supports old api getUserMedia()");        
        return new Promise(function(resolve, reject){
            that.navigator.getUserMedia.call(that.navigator, constrain, resolve, reject);
        });
    }else{
        //console.log("this browser not supports old api getUserMedia(()");        
        return Promise.reject(new Error("getUserMedia was not implement in this browser"));
    }
};
Media.prototype.getMedia = function(constrains){
    if(this.navigator.mediaDevices === undefined){
        this.navigator.mediaDevices = {};
    }

    if(this.navigator.mediaDevices.getUserMedia === undefined){
        //console.log("this browser was not supported new api");
        this.navigator.mediaDevices.getUserMedia = this._getMediaOldAPI;
    }else{
        //console.log("this browser was supported new api");
    }

    return this.navigator.mediaDevices.getUserMedia(constrains);
};
Media.prototype.mediaInfo = function(){
    if (!this.navigator.mediaDevices || !this.navigator.mediaDevices.enumerateDevices) {
       // console.log("enumerateDevices() not supported.");
        return;
    }
// List cameras and microphones.
    return  this.navigator.mediaDevices.enumerateDevices();
    /*this.navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
        devices.forEach(function(device) {
        console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
        });
    })
    .catch(function(err) {
        console.log(err.name + ": " + err.message);
    });*/
};