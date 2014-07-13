var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var db = require('./db.js');

// generating a hash
exports.generateHash = function (userPassword){
    return bcrypt.hashSync(userPassword, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
exports.validPassword = function (password, userPassword) {
    return bcrypt.compareSync(password, userPassword);
};

exports.addFriend = function (userId, friendId, friendData, callback){
    db.getDocument('User', userId, function (userData) {
        var userNewFriendList, friendNewFriendList, newUserData;
        //var newFriendData;

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
                // newFriendData = data;
                callback();
            });
        }
        ], function (err) {
            if (err) {
                callback(err);
            }
            //Both are saved now
            callback(newUserData);
        });
    });
};