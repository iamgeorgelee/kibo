var async = require('async');
// graph is a facebook SDK
var graph = require('fbgraph');
// options needed for SDK
var options = {
	timeout: 3000,
	pool: {
		maxSockets: Infinity
	},
	headers: {
		connection: "keep-alive"
	}
};
var db = require('./db.js');

// to make sure a user is logged in
exports.isLoggedIn = function (req, res, next) {
	// if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
};

// get facebook friend who aso authorize this app
exports.getFbFriends = function (userId, callback) {
    db.getDocument('User', userId, function(data){
        graph
    		.setOptions(options)
    		.setAccessToken(data.facebook.token)
    		.get("me?fields=friends", function (err, res) {
    			callback(res.friends);
    		});
    });
};

exports.localSignup = function (passport, req, res, next) {
    passport.authenticate('local-signup', {
        failureFlash: true
    }, function(err, user, info) { // optional 'info' argument, containing additional details provided by the strategy's verify callback.
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.send({
                success: false,
                message: req.flash('signupMessage')
            });
        }
        return res.send({
            success: true,
            message: 'authentication succeeded',
            user: user
        });
    })(req, res, next);
};

exports.localLogin = function (passport, req, res, next) {
    passport.authenticate('local-login', {
        failureFlash: true
    }, function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.send({
                success: false,
                message: req.flash('loginMessage')
            });
        }
        return res.send({
            success: true,
            message: 'login succeeded',
            user: user
        });
    })(req, res, next);
};

exports.fbAuth = function (passport, req, res, next) {
    passport.authenticate('facebook', {
        scope: 'email, user_likes, user_friends, read_friendlists'
    }, function(err, user, info) {
        if (err) {
            return next(err);
        }
    })(req, res, next);
};

exports.fbAuthCallback = function (passport, req, res, next) {
    passport.authenticate('facebook', function(err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }

        if (!user) {
            return res.send({
                success: false,
                message: 'login fail'
            });
        }
        return res.send({
            success: true,
            message: 'login succeeded',
            user: user
        });
    })(req, res, next);
};


//needs to rewrite with async
exports.getFriendList = function (userId, callback) {
    db.getDocument('User', userId, function(data){
        callback(data.friends);
    });
};
exports.addFriend = function (userId, friendId, callback) {
    //check is the friendId valid, is there really such user?
    db.getDocument('User', friendId, function (friendData) {
        if (friendData.message === 'Document not found') {
            callback({
                success: false,
                message: 'No such user'
            });
        } else {
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
                        throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
                    }
                    //Both are saved now
                    callback(newUserData);
                });
            });
        }
    });
};

