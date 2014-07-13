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
        callback(data);
    });
};

exports.getUserById = function (userId, callback) {
    db.getDocument('User', userId, function (data) {
        if (data.message === 'Document not found') {
            callback({
                success: false,
                message: 'No such user'
            });
        } else {
            callback(data);
        }
    });
};

exports.getFbFriends = function (userId, callback) {
    db.getDocument('User', userId, function (data) {
        graph.setOptions(options).setAccessToken(data.facebook.token).get("me?fields=friends", function (err, res) {
            callback(res.friends);
        });
    });
};

exports.getFriendList = function (userId, callback) {
    db.getDocument('User', userId, function (data) {
        if (data.message === 'Document not found') {
            callback({
                success: false,
                message: 'No such user'
            });
        } else {
            if (data.hasOwnProperty('friends')) {
                callback(data.friends);
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
    var newUserData, friendData, userNewFriendList, friendNewFriendList;

    async.series([
        //check is the friendId valid, is there really such user?
        function (callback) {
            db.getDocument('User', friendId, function (data) {
                if (data.message === 'Document not found') {
                    callback({
                        success: false,
                        message: 'No such user'
                    });
                } else {
                    friendData = data;
                    callback();
                }
            });
        },
        function (callback) {
            db.getDocument('User', userId, function (userData) {
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
            });
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
    ], function (err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) {
            callback(err);
        }
        callback(newUserData);
    });
};

exports.unfriend = function (userId, friendId, callback) {
    var newUserData, friendData, userNewFriendList, friendNewFriendList;

    async.series([
        //check is the friendId valid, is there really such user?
        function (callback) {
            db.getDocument('User', friendId, function (data) {
                if (data.message === 'Document not found') {
                    callback({
                        success: false,
                        message: 'No such user'
                    });
                } else {
                    friendData = data;
                    callback();
                }
            });
        },
        function (callback) {
            db.getDocument('User', userId, function (userData) {
                async.parallel([
                    function(callback){
                        //check does the user already has 'friends' property if no, create one
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
            });
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
    ], function (err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) {
            callback(err);
        }
        callback(newUserData);
    });
};

exports.getFriendCandidate = function (userId, callback) {
    var userFriendList, userList, friendCandidateList = [];

    async.series([
        //check is the friendId valid, is there really such user?
        function (callback) {
            async.parallel([
                function (callback) {
                    user.getFriendList(userId, function (data) {
                        userFriendList = data;
                        callback();
                    });
                },
                function (callback) {
                    user.getUsers(function (data) {
                        userList = data;
                        callback();
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
    ], function (err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) {
            callback(err);
        }
        callback(friendCandidateList);
    });
};