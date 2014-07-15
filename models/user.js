var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var db = require('../routes/dbRoutes.js');
var user = require('./user.js');
var graph = require('fbgraph'); // graph is a facebook SDK
var options = { // options needed for SDK
    timeout: 3000,
    pool: {
        maxSockets: Infinity
    },
    headers: {
        connection: "keep-alive"
    }
};

function isSuccess(data) {
    if (data.hasOwnProperty('success')) {
        if (data.success === false) {
            return false;
        }
    } else {
        return true;
    }
}

//Check is userId in DB, if yes, also return user data
function isUserIdValid(userId, callback) {
    var response;
    db.getDocument('User', userId, function (data) {
        if (data.message === 'Document not found') {
            response = {success:false, message: 'No such user'};
        } else {
            response = {success:true, userData:data};
        }
        callback(response);
    });
}

// generating a hash
exports.generateHash = function (userPassword) {
    return bcrypt.hashSync(userPassword, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
exports.validPassword = function (password, userPassword) {
    return bcrypt.compareSync(password, userPassword);
};

exports.getUsers = function (callback) {
    db.getCollection('User', function (data) {
        if (data.message === 'Collection not found') {
            callback({
                success: false,
                message: 'Cannot get User collection'
            });
        } else {
            callback(data);
        }
    });
};

exports.getUserById = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            callback(data.userData);
        }
    });
};

exports.getFbFriends = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            graph.setOptions(options).setAccessToken(data.userData.facebook.token).get("me?fields=friends", function (err, res) {
                callback(res.friends);
            });
        }
    });
};

exports.getFriendList = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            if (data.userData.hasOwnProperty('friends')) {
                callback(data.userData.friends);
            } else {
                callback({
                    success: false,
                    message: 'No friend'
                });
            }
        }
    });
};

exports.addFriend = function (userId, friendId, callback) {
    var newUserData, userData, friendData, userNewFriendList, friendNewFriendList;

    async.series([
        //check is the userId and friendId valid, is there really such user?
        function (callback) {
            async.parallel([
                function (callback) {
                   isUserIdValid(userId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            userData = data.userData;
                            callback();
                        }
                    });
                },
                function (callback) {
                    isUserIdValid(friendId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            friendData = data.userData;
                            callback();
                        }
                    });
                }
            ], callback);
        },
        function (callback) {
            async.parallel([
                function(callback){
                    //check does the user already has 'friends' property if no, create one
                    if (userData.hasOwnProperty('friends')) {
                        userNewFriendList = userData.friends;
                    } else {
                        userNewFriendList = [];
                    }
                    userNewFriendList.push({
                        "id": friendId,
                        "name": friendData.name
                    });

                    callback();
                },
                function(callback){
                    //check does the friend already has 'friends' property if no, create one
                    if (friendData.hasOwnProperty('friends')) {
                        friendNewFriendList = friendData.friends;
                    } else {
                        friendNewFriendList = [];
                    }
                    friendNewFriendList.push({
                        "id": userId,
                        "name": userData.name
                    });

                    callback();
                }
            ], callback);
        },
        function (callback) {
            async.parallel([
                function (callback) {
                    //update requester friendlist
                    db.updateUser(userId, {
                        "$set": {
                            friends: userNewFriendList
                        }
                    }, function (data) {
                        newUserData = data;
                        callback();
                    });
                },
                function (callback) {
                    //update requestee friendlist
                    db.updateUser(friendId, {
                        "$set": {
                            friends: friendNewFriendList
                        }
                    }, function (data) {
                        callback();
                    });
                }
            ], callback);
        }
    ], function (err) {
        if (err) {
            callback(err);
        } else{
            callback(newUserData);
        }
    });
};

exports.unfriend = function (userId, friendId, callback) {
    var newUserData, userData, friendData, userNewFriendList, friendNewFriendList;

    async.series([
        //check is the userId and friendId valid, is there really such user?
        function (callback) {
            async.parallel([
                function (callback) {
                   isUserIdValid(userId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            userData = data.userData;
                            callback();
                        }
                    });
                },
                function (callback) {
                    isUserIdValid(friendId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            friendData = data.userData;
                            callback();
                        }
                    });
                }
            ], callback);
        },
        function (callback) {
            async.parallel([
                function(callback){
                    //check does the user already has 'friends' property if no
                    if (!userData.hasOwnProperty('friends')) {
                        callback({
                            success: false,
                            message: 'No friend'
                        });
                    } else {
                        userNewFriendList = userData.friends;
                        for (var prop in userNewFriendList) {
                            if(userNewFriendList[prop].id === friendId){
                                // delete userNewFriendList[prop];
                                userNewFriendList.splice(prop, 1);
                            }
                        }
                    }

                    callback();
                },
                function(callback){
                    //check does the user already has 'friends' property if no, create one
                    if (!friendData.hasOwnProperty('friends')) {
                        callback({
                            success: false,
                            message: 'No friend'
                        });
                    } else {
                        friendNewFriendList = friendData.friends;
                        for (var prop in friendNewFriendList) {
                            if(friendNewFriendList[prop].id === userId){
                                // delete friendNewFriendList[prop];
                                friendNewFriendList.splice(prop, 1);
                            }
                        }
                    }

                    callback();
                }
            ], callback);
        },
        function (callback) {
            async.parallel([
                function (callback) {
                    //update requester friendlist
                    db.updateUser(userId, {
                        "$set": {
                            friends: userNewFriendList
                        }
                    }, function (data) {
                        newUserData = data;
                        callback();
                    });
                },
                function (callback) {
                    //update requestee friendlist
                    db.updateUser(friendId, {
                        "$set": {
                            friends: friendNewFriendList
                        }
                    }, function (data) {
                        callback();
                    });
                }
            ], callback);
        }
    ], function (err) {
        if (err) {
            callback(err);
        } else{
            callback(newUserData);
        }
    });
};

exports.getFriendCandidate = function (userId, callback) {
    var userFriendList, userList, friendCandidateList = [];

    async.series([
        function (callback) {
            async.parallel([
                function (callback) {
                    user.getFriendList(userId, function (data) {
                        if(!isSuccess(data)){
                            callback(data);
                        } else{
                            userFriendList = data;
                            callback();
                        }
                    });
                },
                function (callback) {
                    user.getUsers(function (data) {
                        if(!isSuccess(data)){
                            callback(data);
                        } else{
                            userList = data;
                            callback();
                        }
                    });
                }
            ], callback);
        },
        function (callback) {
            userList.forEach(function(oneUser) {
                for(var i=0; i<userFriendList.length; i++){
                    if(oneUser._id.$oid === userFriendList[i].id){
                        break;
                    }
                    if(oneUser._id.$oid === userId){ //myself? break
                        break;
                    }
                    if(i === userFriendList.length-1){
                        friendCandidateList.push(oneUser);
                    }
                }
            });
            callback();
        }
    ], function (err) {
        if (err) {
            callback(err);
        } else{
            callback(friendCandidateList);
        }
    });
};

exports.getFbFriendCandidate = function (userId, callback) {
    var friendCandidateList = [], fbFriends, appFriends;

    async.parallel([
        function (callback) {
            user.getFriendCandidate(userId, function (data) {
                if(!isSuccess(data)){
                    callback(data);
                } else{
                    appFriends = data;
                    callback();
                }
            });
        },
        function (callback) {
            user.getFbFriends(userId, function (data) {
                if(!isSuccess(data)){
                    callback(data);
                } else{
                    fbFriends = data;
                    callback();
                }
            });
        }
    ], function (err) {
        if (err) {
            callback(err);
        } else{
            for (var fbProp in fbFriends.data) {
                for (var prop in appFriends) {
                    if (fbFriends.data[fbProp].name === appFriends[prop].name) {
                        friendCandidateList.push(appFriends[prop]);
                    }
                }
            }
            callback(friendCandidateList);
        }
    });
};

exports.addFriendReq = function(userId, toFriendId, callback){
    var userData, toFriendData, newFriendReqList;

    async.series([
        function(callback){
            async.parallel([
                function (callback) {
                   isUserIdValid(userId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            userData = data.userData;
                            callback();
                        }
                    });
                },
                function (callback) {
                    isUserIdValid(toFriendId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            toFriendData = data.userData;
                            callback();
                        }
                    });
                }
            ], callback);
        },
        function(callback){
            if (toFriendData.hasOwnProperty('friendReq')) {
                newFriendReqList = toFriendData.friendReq;
            }else{
                newFriendReqList = [];
            }

            newFriendReqList.push({
                "id": userId,
                "name": userData.name
            });

            callback();
        },
        function(callback){
            //Add user info to friend data
            db.updateUser(toFriendId, {
                "$set": {
                    friendReq: newFriendReqList
                }
            }, function (data) {
                callback();
            });
        }
    ], function(err) {
        if (err) {
            callback(err);
        } else{
            callback({success:true});
        }
    });
};