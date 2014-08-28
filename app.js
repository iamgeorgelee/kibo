/**
 * @module Kibo
 */

//This is the application entry point
//Module dependencies.
var express = require('express');
var bodyParser = require('body-parser');
var connect = require('connect');
var flash = require('connect-flash');
var logger = require('morgan');
var passport = require('passport');
var port = process.env.PORT || 8080;
var app = express();
var server = require('http').Server(app);

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
app.use(connect.session({
	secret: 'kibokibokibo'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// ================
// ==== ROUTES ====
// ================

require('./controllers/userController.js')(app, passport);
require('./controllers/restController.js')(app);
require('./controllers/eventController.js')(app);

// ===================
// ==== SOCKET.IO ====
// ===================
require('./routes/socketRoutes.js')(server);

// ========================
// ==== MODE SELECTION ====
// ========================
var config;
var env = process.env.NODE_ENV || 'development';
if ('development' === env) {
	config = require('./config/env/development.js');
	// pass passport for configuration
	require('./config/passport')(passport, config);

	app.use(connect.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
} else { //production mode
	config = require('./config/env/production.js');
	require('./config/passport')(passport, config);

	app.use(connect.errorHandler());
}

// server.listen(port);
app.listen(port);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
console.log("Server Up!");