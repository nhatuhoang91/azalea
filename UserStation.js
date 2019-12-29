
function UserStation(key, redisClient){
    this.size = 0;
    this.key = key;
    this.redisClient = redisClient;
    this.timeout = 0;
}

UserStation.prototype.size = function(){
    return size;
};
UserStation.prototype.lAdd = function(data){
    this.size++;
    this.redisClient.lpush(this.key, data);
};
UserStation.prototype.lGet = function(callback){
    this.size--;
    this.redisClient.rpop(this.key, callback);
};
UserStation.prototype.lRemove = function(value, callback){
    this.size--;
    this.redisClient.lrem(this.key, 0, value);
};

UserStation.prototype.StrAdd = function(key, value, callback){
    this.redisClient.set(key, value,callback);
}
UserStation.prototype.StrGet = function(key, callback){
    this.redisClient.get(key,callback);
}

exports.UserStation = UserStation;