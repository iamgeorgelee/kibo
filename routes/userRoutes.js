/**
 * User API
 *
 * @class UserRoutes
 * @constructor
 */

// User routes use users controller
var userController = require('../controllers/userController');

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
        .get(userController.isLoggedIn, function(req, res) {
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
            userController.localSignup(passport, req, res, next);
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
            userController.localLogin(passport, req, res, next);
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
     * @example /api/fbAuth
     */
    app.route('/api/fbAuth')
        .get(function(req, res, next) {
            fromFBApi = true; // to check where the facebook auth request from

            userController.fbAuth(passport, req, res, next);
        });

    /**
     * After perform facebook account authentication, facebook will render back to this location.
     * This is for facebook itself.
     *
     * @method fbAuth/Callback
     * @private
     * @return {JSON} user data
     */
    app.route('/api/fbAuth/callback')
        .get(function(req, res, next) {
            if (fromFBApi === true) {
                userController.fbAuthCallback(passport, req, res, next);
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
            userController.getUsers(function(data) {
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
        .get(function(req, res) {
            userController.getUserById(req.params.userId, function(data) {
                return res.send(data);
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
            userController.getFbFriends(req.params.userId, function(data) {
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
            userController.getFriendList(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Add friend
     * (should add send friend request later on)
     *
     * @method addFriend
     * @param {String} userId User who wants to add friend
     * @param {String} friendId Friend to add (in request content)
     * @return {JSON} user data
     * @example /api/user/:userId/addFriend
     */
    app.route('/api/user/:userId/addFriend')
        .post(function(req, res) {
            userController.addFriend(req.params.userId, req.param('friendId'), function(data) {
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
            userController.unfriend(req.params.userId, req.param('friendId'), function(data) {
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
            userController.getFriendCandidate(req.params.userId, function(data) {
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
            userController.getFbFriendCandidate(req.params.userId, function(data) {
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
     * @method addFriendReq
     * @param {String} userId
     * @param {String} toFriendId (in request content)
     * @return {JSON} Success
     * @example /api/user/:userId/addFriendReq
     */
    app.route('/api/user/:userId/addFriendReq')
        .post(function(req, res) {
            userController.addFriendReq(req.params.userId, req.param('toFriendId'), function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get friend requests
     *
     * @method getFriendReq
     * @param {String} userId
     * @return {JSON} List of friend requests
     * @example /api/user/:userId/getFriendReq
     */
    app.route('/api/user/:userId/getFriendReq')
        .get(function(req, res) {
            userController.getFriendReq(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
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
            userController.reviewFriendReq(req.params.userId, req.param('approve'), req.param('reviewId'), function(data) {
                return res.send(data);
            });
        });
};