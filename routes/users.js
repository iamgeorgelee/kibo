/**
 * User API
 *
 * @class UserRoutes
 * @constructor
 */

// User routes use users controller
var users = require('../controllers/users');

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
        .get(users.isLoggedIn, function(req, res) {
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
     * Perform sign up for local account
     *
     * @method localSignup
     * @param {String} username
     * @param {String} password
     * @return {JSON} user data
     */
    app.route('/api/localSignup')
        .post(function(req, res, next) {
            users.localSignup(passport, req, res, next);
        });

    /**
     * Perform login for local account
     *
     * @method localLogin
     * @param {String} username
     * @param {String} password
     * @return {JSON} user data
     */
    app.route('/api/localLogin')
        .post(function(req, res, next) {
            users.localLogin(passport, req, res, next);
        });

    /**
     * Perform facebook account authentication.
     * Scope defines what kind of data you want user to authorize you.
     * After perform facebook account authentication, facebook will render to callback location.
     *
     * @method fbAuth
     * @return {JSON} user data
     */
    app.route('/api/fbAuth')
        .get(function(req, res, next) {
            fromFBApi = true; // to check where the facebook auth request from

            users.fbAuth(passport, req, res, next);
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
                users.fbAuthCallback(passport, req, res, next);
            }
            else {
                passport.authenticate('facebook', {
                    successRedirect: '/profile',
                    failureRedirect: '/'
                })(req, res, next);
            }
        });

    /**
     * Get facebook friends who also authorize this app.
     *
     * @method getFbFriends
     * @param {String} userId
     * @return {JSON} facebook friends
     */
    app.route('/api/user/:userId/getFbFriends')
        .get(function(req, res) {
            users.getFbFriends(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * Get friend list
     *
     * @method getFriendList
     * @param {String} userId
     * @return {JSON} List of friends
     */
    app.route('/api/user/:userId/getFriendList')
        .get(function(req, res) {
            users.getFriendList(req.params.userId, function(data) {
                return res.send(data);
            });
        });

    /**
     * Add friend
     * (should add send friend request later on)
     *
     * @method addFriend
     * @param {String} userId
     * @param {String} friendId
     * @return {JSON} user data
     */
    app.route('/api/user/:userId/addFriend')
        .post(function(req, res) {
            users.addFriend(req.params.userId, req.param('friendId'), function(data) {
                return res.send(data);
            });
        });
};