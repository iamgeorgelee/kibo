"use strict";

/**
 * User API
 *
 * @class UserController
 * @constructor
 */

var user = require('../models/user.js');
var validator = require('validator');

// to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

var localSignup = function (passport, req, res, next) {
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
// module.exports.localSignup = localSignup;

var localLogin = function (passport, req, res, next) {
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

var fbAuth = function (passport, req, res, next) {
    passport.authenticate('facebook', {
        scope: 'email, user_likes, user_friends, read_friendlists'
    }, function (err, user, info) {
        if (err) {
            return next(err);
        }
    })(req, res, next);
};

var fbAuthCallback = function (passport, req, res, next) {
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

module.exports = function(app, passport) {

    // =======================================
    // ==== Routes below is for web pages ====
    // =======================================

    // HOME PAGE
    app.route('/')
    	.get(function (req, res) {
    		res.render('index', {
    			message: req.flash('loginMessage'),
    			isAuthenticated: req.isAuthenticated(),
    			user: req.user
    		});
    	});
    // route for login
    app.route('/login')
        .post(passport.authenticate('local-login', {
            successRedirect: '/profile',
            failureRedirect: '/',
            failureFlash: true // allow flash messages
        }));

    // route for signup page
    app.route('/signup')
        .get(function(req, res) {
            res.render('signup', {
                message: req.flash('signupMessage'), // pass in any flash data if signup error exist
                user: req.user, // take user from session for view purpose
                isAuthenticated: req.isAuthenticated()
            });
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/profile',
            failureRedirect: '/signup',
            failureFlash: true // allow flash messages
        }));

    // route for profile page
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.route('/profile')
        .get(isLoggedIn, function(req, res) {
            res.render('profile', {
                user: req.user, // take user from session for view purpose
                isAuthenticated: req.isAuthenticated()
            });
        });

    // route for logout
    app.route('/logout')
        .get(function(req, res) {
            //destroy the session
            req.session.destroy(function(err) {
                if (err) {
                    console.error(err);
                    res.end();
                }
                res.redirect('/');
            });
        });

    // ====================================
    // ==== AUTHENTICATE (FIRST LOGIN) ====
    // ====================================

    /**
     * Clearly a stupid way and obviously there will be a problem when web page user and mobile user do facebook auth the same time.
     * Since we dont really need to care about web page right now, temporary ignore it. Need to fix later.
     * @attribute
     */
    var fromFBApi = false; // to check where the facebook auth request from

    // route for facebook authentication and login
    app.route('/auth/facebook')
        .get(passport.authenticate('facebook', {
            // scope defines what kind of data you want user to authorize you
            scope: 'email, user_likes, user_friends, read_friendlists'
        }));

    // ==================================================================
    // ==== AUTHORIZE (ALREADY LOGGED IN / LINKING TO OTHER ACCOUNT) ====
    // ==================================================================

    // route for connect local account
    // render to a signup page
    app.route('/connect/local')
        .get(function(req, res) {
            res.render('connect-local', {
                message: req.flash('loginMessage'),
                user: req.user, // take user from session for view purpose
                isAuthenticated: req.isAuthenticated()
            });
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/profile',
            failureRedirect: '/connect/local',
            failureFlash: true // allow flash messages
        }));

    // route for connect facebook account
    // send to facebook to do the authentication
    app.route('/connect/facebook')
        .get(passport.authorize('facebook', {
            // scope defines what kind of data you want user to authorize you
            scope: 'email, user_likes, user_friends, read_friendlists'
        }));

    /**
     * Needs to verify later, since the callback changed due to support API.
     * @attribute
     */
    // handle the callback after facebook has authorized the user
    app.route('/connect/facebook/callback')
        .get(passport.authorize('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // =========================
    // ==== UNLINK ACCOUNTS ====
    // =========================

    app.route('/unlink/local')
        .get(function(req, res) {
            passport.unlinkLocal(req, res);
        });

    app.route('/unlink/facebook')
        .get(function(req, res) {
            passport.unlinkFacebook(req, res);
        });

    // ====================================
    // ==== Start from here is the API ====
    // ====================================

    /**
     * [POST]
     *
     * Perform sign up for local account
     *
     * @method localSignup
     * @param {String} username (in request content)
     * @param {String} password (in request content)
     * @return {JSON} user data
     * @example /api/localSignup
     */
    app.route('/api/localSignup')
        .post(function(req, res, next) {
            localSignup(passport, req, res, next);
        });

    /**
     * [POST]
     *
     * Perform login for local account
     *
     * @method localLogin
     * @param {String} username (in request content)
     * @param {String} password (in request content)
     * @return {JSON} user data
     * @example /api/localLogin
     */
    app.route('/api/localLogin')
        .post(function(req, res, next) {
            localLogin(passport, req, res, next);
        });

    /**
     * [POST]
     *
     * Create new user via Facebook auth
     *
     * @method createUser
     * @param {String} token (in request content)
     * @param {String} profileId (in request content)
     * @param {String} email (in request content)
     * @param {String} name (in request content)
     * @param {String} profilePic (in request content)
     * @return {JSON} success, userId
     * @example /api/createUser
     */
    app.route('/api/createUser')
        .post(function(req, res) {
            if(validator.isEmail(req.param('email'))){
                user.createUser(req.param('token'), req.param('profileId'), req.param('email'), req.param('name'), req.param('profilePic'), function(data) {
                    return res.send(data);
                });
            } else{
                return res.send(400, "Not valid email");
            }
        });

    /**
     * [POST]
     *
     * Called after do FB authentication to get pesponsive user
     *
     * @method fbLogin
     * @param {String} token (in request content)
     * @param {String} profileId (in request content)
     * @return {JSON} success, userId
     * @example /api/fbLogin
     */
    app.route('/api/fbLogin')
        .post(function(req, res) {
            user.getUserByFbProfileId(req.param('token'), req.param('profileId'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Perform facebook account authentication.
     * Scope defines what kind of data you want user to authorize you.
     * After perform facebook account authentication, facebook will render to callback location.
     *
     * @method fbAuth
     * @return {JSON} user data
     * @deprecated Facebook auth now works in front end
     * @example /api/fbAuth
     */
    app.route('/api/fbAuth')
        .get(function(req, res, next) {
            fromFBApi = true; // to check where the facebook auth request from
            fbAuth(passport, req, res, next);
        });

    /**
     * After perform facebook account authentication, facebook will render back to this location.
     * This is for facebook itself.
     *
     * @method fbAuth/Callback
     * @deprecated Facebook auth now works in front end
     * @private
     * @return {JSON} user data
     */
    app.route('/api/fbAuth/callback')
        .get(function(req, res, next) {
            if (fromFBApi === true) {
                fbAuthCallback(passport, req, res, next);
            }
            else {
                passport.authenticate('facebook', {
                    successRedirect: '/profile',
                    failureRedirect: '/'
                })(req, res, next);
            }
        });

    /**
     * [GET]
     *
     * Get app user list
     *
     * @method getUsers
     * @return {JSON} app user list
     * @example /api/getUsers
     */
    app.route('/api/getUsers')
        .get(function(req, res) {
            user.getUsers(function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get user by id
     *
     * @method getUserById
     * @param {String} userId
     * @return {JSON} user data
     * @example /api/user/:userId
     */
    app.route('/api/user/:userId')
        .get(function(req, res, next) {
            user.getUserById(req.params.userId, function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        });

    /**
     * [GET]
     *
     * Get facebook friends who also authorize this app.
     *
     * @method getFbFriends
     * @param {String} userId
     * @return {JSON} facebook friends
     * @example /api/user/:userId/getFbFriends
     */
    app.route('/api/user/:userId/getFbFriends')
        .get(function(req, res) {
            user.getFbFriends(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get friend list
     *
     * @method getFriendList
     * @param {String} userId
     * @return {JSON} List of friends
     * @example /api/user/:userId/getFriendList
     */
    app.route('/api/user/:userId/getFriendList')
        .get(function(req, res) {
            user.getFriendList(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Add friend
     *
     * Avoid use this function directly, should do review friend request instead
     *
     * @method addFriend
     * @param {String} userId User who wants to add friend
     * @param {String} friendId Friend to add (in request content)
     * @return {JSON} user data
     * @example /api/user/:userId/addFriend
     */
    app.route('/api/user/:userId/addFriend')
        .post(function(req, res) {
            user.addFriend(req.params.userId, req.param('friendId'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Unfriend
     *
     * @method unfriend
     * @param {String} userId User who wants to unfriend
     * @param {String} friendId Friend to remove (in request content)
     * @return {JSON} user data
     * @example /api/user/:userId/unfriend
     */
    app.route('/api/user/:userId/unfriend')
        .post(function(req, res) {
            user.unfriend(req.params.userId, req.param('friendId'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get a list of app user you can add them as friend
     * When this is useful? User wants to add friend via 'Search by name'
     *
     * @method getFriendCandidate
     * @param {String} userId
     * @return {JSON} List of app user to add
     * @example /api/user/:userId/getFriendCandidate
     */
    app.route('/api/user/:userId/getFriendCandidate')
        .get(function(req, res) {
            user.getFriendCandidate(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get a list of app user who is your facebook friend but not your friend in this app
     * When this is useful? User wants to add friend via 'Find friends from facebook'
     *
     * @method getFbFriendCandidate
     * @param {String} userId
     * @return {JSON} List of app user to add
     * @example /api/user/:userId/getFbFriendCandidate
     */
    app.route('/api/user/:userId/getFbFriendCandidate')
        .get(function(req, res) {
            user.getFbFriendCandidate(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Send a friend request.
     *
     * userA send a friend request to userB, in user B's DB entry will record the request.
     *
     * @method friendReq
     * @param {String} userId
     * @param {String} toFriendId (in request content)
     * @return {JSON} Success
     * @example /api/user/:userId/friendReq
     */
    /**
     * [GET]
     *
     * Get friend requests
     *
     * @method friendReq
     * @param {String} userId
     * @return {JSON} List of friend requests
     * @example /api/user/:userId/friendReq
     */
    app.route('/api/user/:userId/friendReq')
        .post(function(req, res) {
            user.addFriendReq(req.params.userId, req.param('toFriendId'), function(data) {
                return res.send(data);
            });
        })
        .get(function(req, res) {
            user.getFriendReq(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Review friend request, also need to tell approve or deny
     * First will remove the entry in friendReq and if it's approved it will do add friend
     *
     * @method reviewFriendReq
     * @param {String} userId
     * @param {Boolean} approve (in request content)
     * @param {String} reviewId (in request content)
     * @return {JSON} Success
     * @example /api/user/:userId/reviewFriendReq
     */
    app.route('/api/user/:userId/reviewFriendReq')
        .post(function(req, res) {
            user.reviewFriendReq(req.params.userId, req.param('approve'), req.param('reviewId'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Set user preference
     *
     * weights = -1, 0, 1
     * 1 => Yes
     * 0 => No preference
     * -1 => No
     *
     * {
     *   "preference": {
     *     "pizza": 1,
     *     "salad": -1
     *   }
     * }
     *
     * @method userPreference
     * @param {String} userId
     * @param {Obj} preference
     * @return {Boolean} Success
     * @example /api/user/:userId/userPreference
     */
     /**
     * [GET]
     *
     * Get user preference
     *
     * @method userPreference
     * @param {String} userId
     * @return {Json} user preference
     * @example /api/user/:userId/userPreference
     */
    app.route('/api/user/:userId/userPreference')
        .post(function(req, res) {
            user.setUserPreference(req.params.userId, req.param('preference'), function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        })
        .get(function(req, res) {
            user.getUserPreference(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Add device token
     *
     * @method deviceToken
     * @param {String} userId
     * @param {String} deviceToken (in request content)
     * @return {JSON} Success
     * @example /api/user/:userId/deviceToken
     */
    app.route('/api/user/:userId/deviceToken')
        .post(function(req, res) {
            user.addDeviceToken(req.params.userId, req.param('deviceToken'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Set user's group. Set which group this user is in.
     *
     * @method userGrp
     * @param {String} userId
     * @param {String} grpId (Request Content)
     * @return {Boolean} Success
     * @example /api/user/:userId/userGrp
     */
     /**
     * [GET]
     *
     * Get user's group list
     *
     * @method userGrp
     * @param {String} userId
     * @return {Json} user group list
     * @example /api/user/:userId/userGrp
     */
    app.route('/api/user/:userId/userGrp')
        .post(function(req, res) {
            user.setUserGrp(req.params.userId, req.param('grpId'), function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        })
        .get(function(req, res) {
            user.getUserGrp(req.params.userId, function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        });

    /**
     * [POST]
     *
     * Add document in collection "group". New entry in "group".
     *
     * @method newGrp
     * @param {String} grpName
     * @param {Array} grpMembers
     * @return {Boolean} Success
     * @example /api/group/newGrp
     */
    app.route('/api/group/newGrp')
        .post(function(req, res) {
            user.newGrp(req.param('grpName'), req.param('grpMembers'), function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        });

    /**
     * [GET]
     *
     * Get group by id
     *
     * @method getGroupById
     * @param {String} grpId
     * @return {Json} group detail
     * @example /api/group/:grpId
     */
    app.route('/api/group/:grpId')
        .get(function(req, res) {
            user.getGrpById(req.params.grpId, function(data) {
                if(data instanceof Error){
                    return res.send(data.http_code, data.arguments);
                } else {
                    return res.send(data);
                }
            });
        });
};