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
var db = require('../models/db.js');
var user = require('../models/user.js');

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

exports.getUserById = function (userId, callback) {
    db.getDocument('User', userId, function(data){
        if (data.message === 'Document not found') {
            callback({
                success: false,
                message: 'No such user'
            });
        } else{
            callback(data);
        }
    });
};

//needs to rewrite with async
exports.getFriendList = function (userId, callback) {
    db.getDocument('User', userId, function(data){
        if (data.message === 'Document not found') {
            callback({
                success: false,
                message: 'No such user'
            });
        } else{
            callback(data.friends);
        }
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
            user.addFriend(userId, friendId, friendData, function(data){
                callback(data);
            });
        }
    });
};

