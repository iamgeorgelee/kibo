// Passport is a node module doing local and facebook authentication

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/user.js');
var db = require('../routes/dbRoutes.js');
var Users; // store current user list

//Get initial list of user
db.getCollection('User', function (data) {
    Users = data;
});

module.exports = function (passport, config) {
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        // get specific user by id
        db.getDocument('User', id.$oid, function (data) {
            done(null, data);
        });
    });

    // =====================
    // ==== LOCAL AUTH  ====
    // =====================

    // do local sign-up
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    }, function (req, username, password, done) { // callback with username and password from our form or from API
        var user;

        // asynchronous, wont fire unless data is sent back
        process.nextTick(function () {

            if (!req.user) {
                // find a user whose username is the same as the forms username
                // we are checking to see if the user trying to login already exists
                user = Users.filter(function (iterateUser) {
                    return iterateUser.username === username;
                })[0];

                // check to see if theres already a user with that username
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    // if there is no user with that username create the user
                    db.createUser({
                        username: username,
                        name: username, //Account display name
                        password: User.generateHash(password) // hash the password before store to db
                    }, function (data) {
                        //refresh user list
                        db.getCollection('User', function (data) {
                            Users = data;
                        });

                        return done(null, data);
                    });
                }
            } else {
                // user already exists and is logged in, we have to link accounts
                user = req.user; // pull the user out of the session

                // update user with his local login credential
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

    // do local login
    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    }, function (req, username, password, done) { // callback with username and password from our form or from API
        // we are checking to see if the user trying to login already exists
        var user = Users.filter(function (iterateUser) {
            return iterateUser.username === username;
        })[0];

        // if no user is found, return the message
        if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));

        // if the user is found but the password is wrong
        if (!User.validPassword(password, user.password)) return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

        return done(null, user);
    }));

    // ========================
    // ==== FACEBOOK AUTH  ====
    // ========================

    // pull in our app id and secret from our env config file
    var fbStrategyAuthConfig = {
        clientID: config.facebookAuth.clientID,
        clientSecret: config.facebookAuth.clientSecret,
        callbackURL: config.facebookAuth.callbackURL,
        profileFields: ['email', 'picture', 'name'], // specify what kind of fields to return
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    };

    // do authentication and facebook will send back the token and profile
    passport.use(new FacebookStrategy(fbStrategyAuthConfig, function (req, token, refreshToken, profile, done) {
        process.nextTick(function () {
            var user;

            // check if the user is already logged in
            if (!req.user) {
                // find the user based on their facebook id
                user = Users.filter(function (iterateUser) {
                    if (iterateUser.hasOwnProperty('facebook')) {
                        return iterateUser.facebook.id === profile.id;
                    }
                })[0];

                // if the user is found, then log them in
                if (user) {
                    return done(null, user);
                } else {
                    // if there is no user found with that facebook id, create them
                    db.createUser({
                        facebook: {
                            id: profile.id,
                            token: token,
                            profilePic: profile.photos[0].value // profile picture link
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
            } else {
                // user already exists and is logged in, we have to link accounts
                user = req.user; // pull the user out of the session

                // update the current users facebook credentials
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

    // =================
    // ==== UNLINK  ====
    // =================

    // if both accounts unlink (delete user), user will stay active in case they want to reconnect in the future
    // data other than login credentials will remain in db, not doing DELETE
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