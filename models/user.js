var async = require('async');
// var bcrypt = require('bcrypt-nodejs');
var db = require('../routes/dbRoutes.js');
var apn = require('../routes/apnRoutes.js');
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
var crypto = require('crypto');
// var salt = bcrypt.genSaltSync(8);

function encrypt(toEncrypt){
    var cipher = crypto.createCipher('aes-256-cbc', 'someSalt_ChangeThisLater');
    var crypted = cipher.update(toEncrypt, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(toDecrypt){
    try{
        var decipher = crypto.createDecipher('aes-256-cbc', 'someSalt_ChangeThisLater');
        var dec = decipher.update(toDecrypt, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    } catch (err){
        return err;
    }
}

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
var isUserIdValid = function (userId, callback) {
    var response;
    db.getDocument('User', userId, function (data) {
        if (data.message === 'Document not found') {
            response = {success:false, message: 'No such user'};
        } else {
            response = {success:true, userData:data};
        }
        callback(response);
    });
};
module.exports.isUserIdValid = isUserIdValid;

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

exports.getUserByFbProfileId = function (token, profileId, callback) {
    var queryString = "{\"facebook.id\": \"" + profileId + "\"}";

    async.waterfall([
        function (callback) {
            db.getCollection("User", queryString, function(data){
                if (data.length <= 0) {
                    callback({success:false, message: 'No such user'}, null);
                } else {
                    callback(null, data[0]);
                }
            });
        },
        function (userData, callback) {
            db.updateDocument('User', userData._id.$oid, {
                "$set": {
                    "facebook.token": encrypt(token)
                }
            }, function (data) {
                callback(null, {success:true, userId: data._id.$oid});
            });
        }
    ], function (err, result) {
        (err)? callback(err): callback(result);
    });
};

exports.getUserById = function (userId, callback) {
    isUserIdValid(userId, function(data){
        (!data.success)? callback(data): callback(data.userData);
    });
};

var createUser = function (token, profileId, email, name, profilePic, callback) {
    async.waterfall([
        //check is the user already exist
        function (callback) {
            var queryString = "{\"email\":\"" + email + "\"}";
            var userExist;

            db.getCollection("User", queryString, function(data){
                if (data.length <= 0) {
                    userExist = false;
                    callback(null, userExist);
                } else {
                    callback({success:false, message: 'User already exist'}, null);
                }
            });
        },
        function (userExist, callback) {
            if(!userExist){
                db.createDocument('User', {
                    facebook: {
                        id: profileId,
                        token: encrypt(token),
                        profilePic: profilePic // profile picture link
                    },
                    name: name,
                    email: email
                }, function (data) {
                    callback(null, {success:true, userId: data._id.$oid});
                });
            } else{
                callback({success:false, message: 'User already exist'}, null);
            }
        }
    ], function (err, result) {
        (err)? callback(err): callback(result);
    });
};
module.exports.createUser = createUser;

var getFbFriends = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            var decryptedToken = decrypt(data.userData.facebook.token);
            if(decryptedToken instanceof Error){
                callback(decryptedToken.message);
            }

            graph.setOptions(options).setAccessToken(decryptedToken).get("me?fields=friends", function (err, res) {
                callback(res.friends);
            });
        }
    });
};
module.exports.getFbFriends = getFbFriends;

exports.addDeviceToken = function(userId, deviceToken, callback){
    async.waterfall([
        function(callback){
           isUserIdValid(userId, function(data){
                if(!data.success){
                    callback(data, null);
                } else{
                    callback(null, data);
                }
            });
        },
        function(userData, callback){
            db.updateDocument('User', userId, {
                "$set": {
                    deviceToken: encrypt(deviceToken)
                }
            }, function (data) {
                callback(null, {success:true});
            });
        }
    ], function(err, result) {
        (err)? callback(err): callback(result);
    });
};

var getDeviceToken = function (userId, callback) {
    isUserIdValid(userId, function(data){
        if(!data.success){
            callback(data);
        } else{
            if (data.userData.hasOwnProperty('deviceToken')) {
                callback(decrypt(data.userData.deviceToken));
            } else {
                callback({
                    success: false,
                    message: 'No deviceToken'
                });
            }
        }
    });
};
module.exports.getDeviceToken = getDeviceToken;

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
            if(userId === friendId){
                callback("You should not add yourself as friend");
            }

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
                        "name": friendData.name,
                        "profilePic": friendData.facebook.profilePic
                    });

                    callback();
                },
                function(callback){
                    //check does the friend already has 'friends' property if no, create one
                    friendNewFriendList = (friendData.hasOwnProperty('friends'))? friendData.friends: [];

                    friendNewFriendList.push({
                        "id": userId,
                        "name": userData.name,
                        "profilePic": userData.facebook.profilePic
                    });

                    callback();
                }
            ], callback);
        },
        function (callback) {
            async.parallel([
                function (callback) {
                    //update requester friendlist
                    db.updateDocument('User', userId, {
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
                    db.updateDocument('User', friendId, {
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
                    db.updateDocument('User', userId, {
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
                    db.updateDocument('User', friendId, {
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
        (err)? callback(err): callback(newUserData);
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
            var requestExist = false;
            if (toFriendData.hasOwnProperty('friendReq')) {
                //check is the same friend request already exist
                for (var prop in toFriendData.friendReq) {
                    if(toFriendData.friendReq[prop].id === userId){
                        requestExist = true;
                        break;
                    }
                }
                newFriendReqList = toFriendData.friendReq;
            }else{
                newFriendReqList = [];
            }

            if(requestExist){
                callback({
                    success: false,
                    message: 'Such friend request already exist'
                });
            } else{
                newFriendReqList.push({
                "id": userId,
                "name": userData.name
                });

                callback();
            }
        },
        function(callback){
            //Add user info to friend data
            db.updateDocument('User', toFriendId, {
                "$set": {
                    friendReq: newFriendReqList
                }
            }, function (data) {
                callback();
            });
        },
        function(callback){
            //send notification to friendee
            apn.pushSingleNotification(toFriendId, {
                from: userId,
                to: toFriendId,
                subject: "User",
                content: {
                    method: "friendRequest"
                }
            }, function(data){
                (!data.success)? callback(data): callback();
            });
        }
    ], function(err) {
        (err)? callback(err): callback({success:true});
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
            db.updateDocument('User', userId, {
                "$set": {
                    friendReq: newFriendReqList
                }
            }, function (data) {
                callback();
            });
        },
        function(callback){
            if(approve === true || approve === "true"){
                addFriend(userId, reviewId, function(data){
                    (isSuccess(data))? callback(): callback(data);
                });
            }
            //if not approved do nothing
        }
    ], function(err) {
        (err)? callback(err): callback({success:true});
    });
};

var setUserPreference = function (userId, preference, callback) {
    async.waterfall([
        //check is the userId valid
        function (callback) {
            isUserIdValid(userId, function(data){
                (!data.success)? callback(data, null): callback(null, data.userData);
            });
        },
        function (userData, callback) {
            db.updateDocument('User', userId, {
                "$set": {
                    preference: preference
                }
            }, function (data) {
                callback(null, {success:true});
            });
        }
    ], function (err, result) {
        (err)? callback(err): callback(result);
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