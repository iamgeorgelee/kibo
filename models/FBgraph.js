var graph = require('fbgraph');
var async = require("async");
var options = {
	timeout: 3000,
	pool: {
		maxSockets: Infinity
	},
	headers: {
		connection: "keep-alive"
	}
};

exports.setToken = function (token) {
	graph.setAccessToken(token);
};

exports.getFriends = function (token, callback) {
	graph
		.setOptions(options)
		.setAccessToken(token)
		.get("me?fields=friends", function (err, res) {
			callback(res.friends);
		});
};