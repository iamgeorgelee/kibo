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
var io = require('socket.io')(server);

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
//TODO: Socket.io should move to a single js file
var clients = [];

io.sockets.on('connection', function (socket) {
	//call when a user connected
	socket.on('userConnect', function (userData) {
		var isExist = false;
		var userId = userData._id.$oid;

		//check does the user already has a socket
		for (var prop in clients) {
			if (prop === userId) {
				isExist = true;
			}
		}
		//record this user socket if socket not exist
		if (!isExist) {
			clients[userId] = {
				"socketId": socket.id,
				"userName": userData.name
			};
			console.log("User: " + userData.name + " Connected");
		}
	});

	//call when a user disconnected, remove his socket data from clients
	socket.on('disconnect', function () {
		for (var prop in clients) {
			if (clients[prop].socketId === socket.id) {
				console.log("user:" + clients[prop].userName + " disconnected");
				// clients.splice(prop);
				delete clients[prop];
			}
		}
	});

	//listen to add friend request
	socket.on('addFriendReq', function (toFriendId, userName) {
		for (var prop in clients) {
			if (prop === toFriendId) {
				io.sockets.connected[clients[prop].socketId].emit("youGotFriendReq", "Hey! " + userName + " wants to be your friend!");
			}
		}
	});

	socket.on('acceptFriendReq', function (reviewId, userName) {
		for (var prop in clients) {
			if (prop === reviewId) {
				io.sockets.connected[clients[prop].socketId].emit("youGotAccept", "Hey! " + userName + " accept your friend request!");
			}
		}
	});

	socket.on('rejectFriendReq', function (reviewId, userName) {
		for (var prop in clients) {
			if (prop === reviewId) {
				io.sockets.connected[clients[prop].socketId].emit("youGotReject", "Hey! " + userName + " reject your friend request!");
			}
		}
	});
});

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

server.listen(port);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
console.log("Server Up!");