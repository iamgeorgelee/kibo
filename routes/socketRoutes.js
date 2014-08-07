module.exports = function(server) {
	var io = require('socket.io')(server);
	var user = require('../models/user.js');
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
		socket.on('addFriendReq', function (userId, toFriendId, userName) {
			for (var prop in clients) {
				if (prop === toFriendId) {
					io.sockets.connected[clients[prop].socketId].emit("youGotFriendReq", "Hey! " + userName + " wants to be your friend!");
				}
			}

			user.addFriendReq(userId, toFriendId, function(data){
				console.log("Add friend Request " + data.success );
			});
		});

		socket.on('reviewFriendReq', function (userId, approve, reviewId, userName) {
			for (var prop in clients) {
				if (prop === reviewId) {
					io.sockets.connected[clients[prop].socketId].emit("youGotReview", "Hey! " + userName + " " + ((approve)? "accept": "reject") + " your friend request!");
				}
			}

			user.reviewFriendReq(userId, approve, reviewId, function(data){
				console.log("Review friend Request " + data.success );
			});
		});
	});
};