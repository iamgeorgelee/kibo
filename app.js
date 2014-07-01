/**
 * @module Kibo
 */

//This is the application entry point
//Module dependencies.
var express = require('express');
var bodyParser = require('body-parser');
var connect = require('connect');
var flash = require('connect-flash');
var session = require('express-session');
var logger = require('morgan');
var passport = require('passport');
var port = process.env.PORT || 8080;
var app = express();

// =======================
// ==== CONFIGURATION ====
// =======================
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(logger('dev'));
app.use(connect.methodOverride());
app.use(connect.cookieParser());
app.use(bodyParser());
app.use(session({
	secret: 'kibokibokibo'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// pass passport for configuration
require('./config/passport')(passport);

// ================
// ==== ROUTES ====
// ================

// User Routes e.g. login, signup
require('./routes/users.js')(app, passport);

// ========================
// ==== MODE SELECTION ====
// ========================
var env = process.env.NODE_ENV || 'development';
if ('development' === env) {
	app.use(connect.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
}

if ('production' === env) {
	app.use(connect.errorHandler());
}

app.listen(port);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
console.log("Host IP is %s", process.env.IP);
console.log("Server Up!");