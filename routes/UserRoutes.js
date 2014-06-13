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
            res.render('signup', { message: req.flash('signupMessage')});
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
            res.render('profile', { user : req.session.user });
	    });


	// =====================================
	// FACEBOOK ROUTES =====================
	// =====================================
	// route for facebook authentication and login
	app.route('/auth/facebook')
	    .get(passport.authenticate('facebook', { scope : 'email' }));

	// handle the callback after facebook has authenticated the user
	app.route('/auth/facebook/callback')
    	.get(passport.authenticate('facebook', {
    			successRedirect : '/profile',
    			failureRedirect : '/'
    	}));

    /**
     * LOGOUT
     */
	app.route('/logout')
        .get(function(req, res) {
            req.session.user = null;
            req.logout();
            res.redirect('/');
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
