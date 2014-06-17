// routes/routes.js
module.exports = function(app, passport) {
    /**
     * LOGIN
     */
	app.route('/login')
        .post(passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to home if there is an error
            failureFlash : true // allow flash messages
        }));

    /**
     * SIGNUP
     */
	app.route('/signup')
        .get(function(req, res) {
            // render the page and pass in any flash data if it exists
            res.render('signup', { message: req.flash('signupMessage'), user : req.user, isAuthenticated: req.isAuthenticated() });
        })
        .post(passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    /**
     * PROFILE SECTION
     */
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.route('/profile')
        .get(isLoggedIn, function(req, res) {
            res.render('profile', { user : req.user, isAuthenticated: req.isAuthenticated() });
	    });


	// =====================================
	// FACEBOOK ROUTES =====================
	// =====================================
	// =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================
    	// route for facebook authentication and login
    	app.route('/auth/facebook')
    	    .get(passport.authenticate('facebook', { scope : 'email' }));

    	// handle the callback after facebook has authenticated the user
    	app.route('/auth/facebook/callback')
        	.get(passport.authenticate('facebook', {
                successRedirect : '/profile',
        			failureRedirect : '/'
        	}));

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // ================================================================
    // locally --------------------------------
		app.route('/connect/local')
		    .get(function(req, res) {
			    res.render('connect-local.ejs', { message: req.flash('loginMessage'), user : req.user, isAuthenticated: req.isAuthenticated() });
            })
		    .post(passport.authenticate('local-signup', {
    			successRedirect : '/profile', // redirect to the secure profile section
    			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
    			failureFlash : true // allow flash messages
    		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.route('/connect/facebook')
		    .get(passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.route('/connect/facebook/callback')
		    .get(passport.authorize('facebook', {
                successRedirect : '/profile',
				failureRedirect : '/'
			})
		);

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

        // local -----------------------------------
        app.route('/unlink/local')
            .get(function(req, res) {
                passport.unlinkLocal(req, res);
            });

        // facebook -------------------------------
        app.route('/unlink/facebook')
            .get(function(req, res) {
                passport.unlinkFacebook(req, res);
            });





    /**
     * LOGOUT
     */
	app.route('/logout')
        .get(function(req, res) {
            //req.logout has problem, because of node version, use destry instead
            // req.logout();
            // res.redirect('/');

            req.session.destroy(function (err) {
                res.redirect('/');
            });
        });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
