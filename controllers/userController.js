var user = require('../models/user.js');

// to make sure a user is logged in
exports.isLoggedIn = function (req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
};

exports.localSignup = function (passport, req, res, next) {
    passport.authenticate('local-signup', {
        failureFlash: true
    }, function (err, user, info) { // optional 'info' argument, containing additional details provided by the strategy's verify callback.
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
    }, function (err, user, info) {
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
    }, function (err, user, info) {
        if (err) {
            return next(err);
        }
    })(req, res, next);
};

exports.fbAuthCallback = function (passport, req, res, next) {
    passport.authenticate('facebook', function (err, user, info) {
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

exports.getUsers = function (callback) {
    user.getUsers(function(data){
        callback(data);
    });
};

exports.getUserById = function (userId, callback) {
    user.getUserById(userId, function(data){
        callback(data);
    });
};

// get facebook friend who aso authorize this app
exports.getFbFriends = function (userId, callback) {
    user.getFbFriends(userId, function(data){
        callback(data);
    });
};

exports.getFriendList = function (userId, callback) {
    user.getFriendList(userId, function(data){
        callback(data);
    });
};

exports.addFriend = function (userId, friendId, callback) {
    user.addFriend(userId, friendId, function(data){
        callback(data);
    });
};

exports.unfriend = function (userId, friendId, callback) {
    user.unfriend(userId, friendId, function(data){
        callback(data);
    });
};

exports.getFriendCandidate = function (userId, callback) {
    user.getFriendCandidate(userId, function(data){
        callback(data);
    });
};

exports.getFbFriendCandidate = function (userId, callback) {
    user.getFbFriendCandidate(userId, function(data){
        callback(data);
    });
};

exports.addFriendReq = function (userId, toFriendId, callback) {
    user.addFriendReq(userId, toFriendId, function(data){
        callback(data);
    });
};
