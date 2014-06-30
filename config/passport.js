// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user.js');

var config;
if (process.env.NODE_ENV === undefined) { // if mode not set, give 'development'
    process.env.NODE_ENV = 'development';
}
if (process.env.NODE_ENV === 'development') { // determine which mode it is in now
    config = require('./env/development.js');
}
else {
    config = require('./env/production.js');
}

var users = require('../controllers/users.js');
var db = require('../controllers/db.js');
var Users;

db.getCollection('User', function (data) {
    Users = data;
});

module.exports = function (passport) {
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        db.getDocument('User', id.$oid, function (data) {
            done(null, data);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },

    function (req, username, password, done) {
        var user;
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function () {

            if (!req.user) {

                // find a user whose username is the same as the forms username
                // we are checking to see if the user trying to login already exists
                user = Users.filter(function (iterateUser) {
                    return iterateUser.username === username;
                })[0];

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                }
                else {
                    // if there is no user with that email
                    // create the user
                    db.createUser({
                        username: username,
                        password: User.generateHash(password)
                    }, function (data) {
                        //refresh user list
                        db.getCollection('User', function (data) {
                            Users = data;
                        });

                        return done(null, data);
                    });
                }
            }
            else {
                user = req.user;

                db.updateUser(user._id.$oid, {
                    "$set": {
                        username: username,
                        password: User.generateHash(password)
                    }
                }, function (data) {
                    //refresh user list
                    db.getCollection('User', function (data) {
                        Users = data;
                    });

                    return done(null, data);
                });
            }
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },

    function (req, username, password, done) { // callback with username and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists

        var user = Users.filter(function (iterateUser) {
            return iterateUser.username === username;
        })[0];

        // if no user is found, return the message
        if (!user) return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

        // if the user is found but the password is wrong
        if (!User.validPassword(password, user.password)) return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return done(null, user);
    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================

    var fbStrategyAuthConfig = {
        // pull in our app id and secret from our auth.js file
        clientID: config.facebookAuth.clientID,
        clientSecret: config.facebookAuth.clientSecret,
        callbackURL: config.facebookAuth.callbackURL,
        profileFields: ['email', 'picture', 'name'],
        // profileURL : 'https://graph.facebook.com/me?fields=id,name,email,friends,likes',
        // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        passReqToCallback: true
    };

    passport.use(new FacebookStrategy(fbStrategyAuthConfig,

    // facebook will send back the token and profile
    function (req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function () {
            var user;

            //set facebook token to graph
            users.setToken(token);

            // check if the user is already logged in
            if (!req.user) {
                // find the user in the database based on their facebook id
                // User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                user = Users.filter(function (iterateUser) {
                    //user dont have any facebook field yet
                    if (iterateUser.hasOwnProperty('facebook')) return iterateUser.facebook.id == profile.id;
                })[0];

                // if the user is found, then log them in
                if (user) {

                    return done(null, user); // user found, return that user
                }
                else {
                    //             // if there is no user found with that facebook id, create them
                    // set all of the facebook information in our user model
                    db.createUser({
                        facebook: {
                            id: profile.id,
                            token: token,
                            profilePic: profile.photos[0].value
                        },
                        name: profile.name.givenName + ' ' + profile.name.familyName,
                        email: profile.emails[0].value
                    }, function (data) {
                        //refresh user list
                        db.getCollection('User', function (data) {
                            Users = data;
                        });

                        return done(null, data);
                    });
                }
            }
            else {
                // user already exists and is logged in, we have to link accounts
                user = req.user; // pull the user out of the session

                // // update the current users facebook credentials
                db.updateUser(user._id.$oid, {
                    "$set": {
                        name: profile.name.givenName + ' ' + profile.name.familyName,
                        email: profile.emails[0].value,
                        facebook: {
                            id: profile.id,
                            token: token,
                            profilePic: profile.photos[0].value
                        }
                    }
                }, function (data) {
                    //refresh user list
                    db.getCollection('User', function (data) {
                        Users = data;
                    });

                    return done(null, data);
                });
            }
        });
    }));
    // for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future
    passport.unlinkLocal = function (req, res) {
        var user = req.user;

        db.updateUser(user._id.$oid, {
            "$unset": {
                username: "",
                password: ""
            }
        }, function (data) {
            //refresh user list
            db.getCollection('User', function (data) {
                Users = data;
            });

            res.redirect('/profile');
        });

    };

    passport.unlinkFacebook = function (req, res) {
        var user = req.user;

        db.updateUser(user._id.$oid, {
            "$unset": {
                "facebook": ""
            }
        }, function (data) {
            //refresh user list
            db.getCollection('User', function (data) {
                Users = data;
            });

            res.redirect('/profile');
        });
    };
};