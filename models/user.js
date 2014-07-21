var async = require('async');
var db = require('../routes/dbRoutes.js');
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

var getUsers = function (callback) {
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
module.exports.getUsers = getUsers;

exports.getUserById = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            callback(data.userData);
        }
    });
};

var getFbFriends = function (userId, callback) {
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
module.exports.getFbFriends = getFbFriends;

var getFriendList = function (userId, callback) {
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
module.exports.getFriendList = getFriendList;

var addFriend = function (userId, friendId, callback) {
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
                        //check are they already friends, Only check user
                        var isfriends = false;
                        for (var prop in userData.friends) {
                            if(userData.friends[prop].id === friendId){
                                isfriends = true;
                                break;
                            }
                        }
                        if(isfriends){
                            callback({
                                success: false,
                                message: 'They are already friends'
                            });
                        }
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
module.exports.addFriend = addFriend;

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

var getFriendCandidate = function (userId, callback) {
    var userFriendList, userList, friendCandidateList = [];

    async.series([
        function (callback) {
            async.parallel([
                function (callback) {
                    getFriendList(userId, function (data) {
                        if(!isSuccess(data)){
                            callback(data);
                        } else{
                            userFriendList = data;
                            callback();
                        }
                    });
                },
                function (callback) {
                    getUsers(function (data) {
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
module.exports.getFriendCandidate = getFriendCandidate;


var getFbFriendCandidate = function (userId, callback) {
    var friendCandidateList = [], fbFriends, appFriends;

    async.parallel([
        function (callback) {
            getFriendCandidate(userId, function (data) {
                if(!isSuccess(data)){
                    callback(data);
                } else{
                    appFriends = data;
                    callback();
                }
            });
        },
        function (callback) {
            getFbFriends(userId, function (data) {
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
module.exports.getFbFriendCandidate = getFbFriendCandidate;

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
                //check is the same friend request already exist
                var requestExist = false;
                for (var prop in toFriendData.friendReq) {
                    if(toFriendData.friendReq[prop].id === userId){
                        requestExist = true;
                        break;
                    }
                }
                if(requestExist){
                    callback({
                        success: false,
                        message: 'Such friend request already exist'
                    });
                }
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

exports.getFriendReq = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            if (data.userData.hasOwnProperty('friendReq')) {
                callback(data.userData.friendReq);
            } else {
                callback({
                    success: false,
                    message: 'No friend Requests'
                });
            }
        }
    });
};

exports.reviewFriendReq = function (userId, approve, reviewId, callback) {
    var userData, reviewFriendData, newFriendReqList;

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
                    isUserIdValid(reviewId, function(data){
                        if(!data.success){
                            callback(data);
                        } else{
                            reviewFriendData = data.userData;
                            callback();
                        }
                    });
                }
            ], callback);
        },
        function(callback){
            newFriendReqList = userData.friendReq;
            var finishDelete = false;
            for (var prop in newFriendReqList) {
                if(newFriendReqList[prop].id === reviewId){
                    newFriendReqList.splice(prop, 1); //do delete
                    finishDelete = true;
                }
            }
            if(!finishDelete){
                callback({
                    success: false,
                    message: 'No such review ID in user friend requests'
                });
            }
            callback();
        },
        function(callback){
            db.updateUser(userId, {
                "$set": {
                    friendReq: newFriendReqList
                }
            }, function (data) {
                callback();
            });
        },
        function(callback){
            if(approve){
                addFriend(userId, reviewId, function(data){
                    if(isSuccess(data)){
                        callback();
                    }else{
                        callback(data);
                    }
                });
            }
            //if not approved do nothing
        }
    ], function(err) {
        if (err) {
            callback(err);
        } else{
            callback({success:true});
        }
    });
};

var setUserPreference = function (userId, preference, callback) {
    async.waterfall([
        //check is the userId valid
        function (callback) {
            isUserIdValid(userId, function(data){
                if(!data.success){
                    callback(data, null);
                } else{
                    // userData = data.userData;
                    callback(null, data.userData);
                }
            });
        },
        function (userData, callback) {
            db.updateUser(userId, {
                "$set": {
                    preference: preference
                }
            }, function (data) {
                callback(null, {success:true});
            });
        }
    ], function (err, result) {
        if (err) {
            callback(err);
        } else{
            callback(result);
        }
    });
};
module.exports.setUserPreference = setUserPreference;

var getUserPreference = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            if (data.userData.hasOwnProperty('preference')) {
                callback(data.userData.preference);
            } else {
                callback({
                    success: false,
                    message: 'No preference set'
                });
            }
        }
    });
};
module.exports.getUserPreference = getUserPreference;