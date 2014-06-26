// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var bcrypt = require('bcrypt-nodejs');
var apiKey = 'necMvEqo9wdApurqW9z5c-80Jz04T_uX';
var configAuth = require('../config/auth');
var os = require("os");


var performrequest = require('./performRequest');
var graph = require('./FBgraph');
var Users;

performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
    apiKey: apiKey
}, function(data) {
    Users = data;
});

// generating a hash
function generateHash(userPassword) {
    return bcrypt.hashSync(userPassword, bcrypt.genSaltSync(8), null);
}

// checking if password is valid
function validPassword(password, userPassword) {
    return bcrypt.compareSync(password, userPassword);
}

module.exports = function(passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        // var tmp = new BSON.ObjectID(id);

        performrequest.performRequest('/api/1/databases/kibo/collections/User/' + id.$oid, 'GET', {
            apiKey: apiKey
        }, function(data) {
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

    function(req, username, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

            if (!req.user) {

                // find a user whose username is the same as the forms username
                // we are checking to see if the user trying to login already exists
                var user = Users.filter(function(iterateUser) {
                    return iterateUser.username === username;
                })[0];

                // // if there are any errors, return the error
                // if (err)
                //     return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                }
                else {
                    // if there is no user with that email
                    // create the user
                    // var newUser = new User();

                    performrequest.performRequest('/api/1/databases/kibo/collections/User?apiKey=' + apiKey, 'POST', {
                        username: username,
                        password: generateHash(password)
                    }, function(data) {
                        // req.session.user = data;

                        performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                            apiKey: apiKey
                        }, function(data) {
                            Users = data;
                        });

                        return done(null, data);
                    });
                }
            }
            else {
                var user = req.user;

                // user.username = username;
                // user.password = generateHash(password);

                performrequest.performRequest('/api/1/databases/kibo/collections/User/' + user._id.$oid + '?apiKey=' + apiKey, 'PUT', {
                    "$set": {
                        username: username,
                        password: generateHash(password)
                    }
                }, function(data) {
                    // req.session.user = data;
                    performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                        apiKey: apiKey
                    }, function(data) {
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

    function(req, username, password, done) { // callback with username and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists

        var user = Users.filter(function(iterateUser) {
            return iterateUser.username === username;
        })[0];

        // if (err)
        //     return done(err);

        // if no user is found, return the message
        if (!user) return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

        // if the user is found but the password is wrong
        if (!validPassword(password, user.password)) return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata


        // app.locals.username = user.name;
        // req.session.user = user;

        // all is well, return successful user
        return done(null, user);
    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================

    //Detemine the app is deployed and running on c9 or heroku (develop/staging)
    // devlop host machine: ex-c9-node20.prod.rhcloud.com
    // staging host machine: us-east-1-a.route.herokuapp.com
    //Note, this is the place where the app runs and is not related to domain name
    var hostname = os.hostname();
    var fbStrategyAuthConfig;
    if (hostname.indexOf("c9") > -1) { //develop
        fbStrategyAuthConfig = {
            // pull in our app id and secret from our auth.js file
            clientID: configAuth.develop.facebookAuth.clientID,
            clientSecret: configAuth.develop.facebookAuth.clientSecret,
            callbackURL: configAuth.develop.facebookAuth.callbackURL,
            profileFields: ['email', 'picture', 'name'],
            // profileURL : 'https://graph.facebook.com/me?fields=id,name,email,friends,likes',
            // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            passReqToCallback: true

        }
    }
    else { //staging
        fbStrategyAuthConfig = {
            // pull in our app id and secret from our auth.js file
            clientID: configAuth.staging.facebookAuth.clientID,
            clientSecret: configAuth.staging.facebookAuth.clientSecret,
            callbackURL: configAuth.staging.facebookAuth.callbackURL,
            // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            passReqToCallback: true
        }
    }
    //Production needed (later)

    passport.use(new FacebookStrategy(fbStrategyAuthConfig,

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {
            //set facebook token to graph
            graph.setToken(token);

            // check if the user is already logged in
            if (!req.user) {
                // find the user in the database based on their facebook id
                // User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                var user = Users.filter(function(iterateUser) {
                    //user dont have any facebook field yet
                    if (iterateUser.hasOwnProperty('facebook')) return iterateUser.facebook.id == profile.id;
                })[0];
                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                // if (err)
                //     return done(err);

                // if the user is found, then log them in
                if (user) {

                    return done(null, user); // user found, return that user
                }
                else {
                    //             // if there is no user found with that facebook id, create them
                    // // set all of the facebook information in our user model
                    performrequest.performRequest('/api/1/databases/kibo/collections/User?apiKey=' + apiKey, 'POST', {
                        facebook: {
                            id: profile.id,
                            token: token,
                            profilePic: profile.photos[0].value
                        },
                        name: profile.name.givenName + ' ' + profile.name.familyName,
                        email: profile.emails[0].value
                    }, function(data) {
                        performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                            apiKey: apiKey
                        }, function(data) {
                            Users = data;
                        });


                        return done(null, data);
                    });
                }
            }
            else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session

                // // update the current users facebook credentials
                performrequest.performRequest('/api/1/databases/kibo/collections/User/' + user._id.$oid + '?apiKey=' + apiKey, 'PUT', {
                    "$set": {
                        name: profile.name.givenName + ' ' + profile.name.familyName,
                        email: profile.emails[0].value,
                        facebook: {
                            id: profile.id,
                            token: token,
                            profilePic: profile.photos[0].value
                        }
                    }
                }, function(data) {
                    // req.session.user = data;
                    performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                        apiKey: apiKey
                    }, function(data) {
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
    passport.unlinkLocal = function(req, res) {
        var user = req.user;

        performrequest.performRequest('/api/1/databases/kibo/collections/User/' + user._id.$oid + '?apiKey=' + apiKey, 'PUT', {
            "$unset": {
                username: "",
                password: ""
            }
        }, function(data) {
            performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                apiKey: apiKey
            }, function(data) {
                Users = data;
            });

            res.redirect('/profile');
        });
    }

    passport.unlinkFacebook = function(req, res) {
        var user = req.user;
        performrequest.performRequest('/api/1/databases/kibo/collections/User/' + user._id.$oid + '?apiKey=' + apiKey, 'PUT', {
            "$unset": {
                "facebook": ""
            }
        }, function(data) {
            performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
                apiKey: apiKey
            }, function(data) {
                Users = data;
            });

            res.redirect('/profile');
        });
    }
};