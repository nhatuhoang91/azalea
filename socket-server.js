var socketIO = require('socket.io');
var redis = require('redis');
var userManager = require('./UserStation');

function Connection(){
    this.io = null;
    this.redisClient = redis.createClient();
    this.userStation = new userManager.UserStation('station1', this.redisClient);
};

Connection.prototype.initSocket = function(server){
    this.io = socketIO(server);
};
Connection.prototype.setUpEvent = function(){
    var that = this;
    
    this.io.on('connection', function(socket){
       // console.log("sockeysfas : " + socket.id);
        socket.on('find',function(client){
          //  console.log("Find event. Process pid : "+process.pid);
          //  console.log("find event");
          //  console.log("socket ID: "+client.id.socketId);
            //socket.broadcast.to("/#"+client.id.socketId).emit('found',{});
            //socket.emit('found',{});
            var oldSocketId = client.id.oldSocketId;
            if(oldSocketId !== undefined && oldSocketId!== null){
               // console.log("oldSocketId !== undefined : "+oldSocketId);
                that._removeClient(oldSocketId, function(){});
            }

            that._getClient(function(err, data){
                if(err){
                   // console.log("_getClient err : "+err);
                }else{
                    if(data){
                       // var guid = data.slice(0,data.indexOf('**'));
                        //console.log("guid : "+guid);
                        //var socketId = data.slice(data.indexOf('**')+2, data.length);
                       // console.log("socketId : "+data);
                       // console.log("client socketId : "+client.id.socketId);
                       // console.log("*******emit found******");
                        socket.broadcast.to("/#"+data).emit('found',
                        {
                            id: {
                                    peerGuid:client.id.guid,
                                    peerSocketId:client.id.socketId
                                },
                            signal: 'start'
                        });
                    }else{
                        /*
                        client.id : {guid : guid, socketId: socketId}
                        */
                        that._storeClient(client.id);
                    }
                }
            });    
                 //Object.keys(io.sockets.sockets).forEach(function(id){
                  //  console.log("ID : "+ id);
             // });        
        });
    
        socket.on('disconnect', function(){
           // console.log('socket disconnect : '+socket.id);
            that._removeClient(socket.id.slice(2, socket.id.length), function(){});
        });
        socket.on('exchange-sdp', function(data){
                socket.broadcast.to("/#"+data.id.toSocketId).emit('exchange-sdp',data);
        });
    });
};

Connection.prototype._storeClient = function(data){
    if(this.userStation === undefined){
      //  console.log("redisClient undefined");
    }else{
        /*
        data : {guid : guid, socketId:socketId}
        */
        this.userStation.lAdd(data.socketId);
    }
};
Connection.prototype._getClient = function(callback){
    if(this.userStation === undefined){
       // console.log("redisClient undefined");
    }else{
        this.userStation.lGet(callback);
    }
};
Connection.prototype._removeClient = function(socketId,callback){
    if(this.userStation === undefined){
       // console.log("redisClient undefined");
    }else{
       // console.log("_removeClient : "+socketId);
        this.userStation.lRemove(socketId, callback);
    }
};
exports.Connection = Connection;
