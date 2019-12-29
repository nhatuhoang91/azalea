function Util(sessionStorage){
    this.sessionStorage = sessionStorage;
};
Util.prototype.escapeHtml = function(text){
    var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};
Util.prototype.genGUID = function(){
    var lut = [];
    for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
    
    var d0 = Math.random()*0xffffffff|0;
    var d1 = Math.random()*0xffffffff|0;
    var d2 = Math.random()*0xffffffff|0;
    var d3 = Math.random()*0xffffffff|0;
    return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
        lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
        lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
        lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
};
Util.prototype.storeSessionData = function(key,data){
    if(this.sessionStorage.getItem(key)=== undefined || this.sessionStorage.getItem(key) !== data){
       // console.log("sessionStorage get session data undefined or difference each other");
        this.sessionStorage.setItem(key,data);
    }else{
       // console.log("sessionStorage key : "+key+" existed");
    }   
};
Util.prototype.getSessionData = function(key){
    if(this.sessionStorage.getItem(key)!== undefined){
        return this.sessionStorage.getItem(key);
    }else{
      // console.log("sessionStorage get session data undefined");
        return undefined;
    }   
};
Util.prototype.deleteSessionData = function(key){
    if(this.sessionStorage.getItem(key)!== undefined){
        return this.sessionStorage.removeItem(key);
    }else{
        //console.log("sessionStorage delete session data undefined");
        return undefined;
    }
};