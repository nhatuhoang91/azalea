var start = function(){
    setTimeout(startTest(),3000);
}
var startTest = function(){
    console.log("start test");
    //for(var i=1;i<500;i++){
        
        //var socket = io('http://192.168.1.83:3000');
        var socket = io('159.203.101.219');
        console.log("connection : "+ i);
        
        socket.on('client-connected', function(data){
            console.log("connection succ : ");
        });
   // }
}
    

    

    
