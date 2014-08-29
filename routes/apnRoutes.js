/**
 * Apple Push Notification Service
 *
 * @class apnRoutes
 * @constructor
 */

var apn = require ('../apn/index.js');
var db = require ('./dbRoutes.js');
var user = require ('../models/user.js');
var options = {
    cert: __dirname + '/../config/cert.pem',
    key: __dirname + '/../config/key.pem'
};
var feedbackOptions = {
    cert: __dirname + '/../config/cert.pem',
    key: __dirname + '/../config/key.pem',
    interval: 10
};
var service = new apn.connection(options);
var feedback = new apn.feedback(feedbackOptions);
var tokens = ["2be4f2ab 586760da e548e43d 9c607530 0134fed0 afb8b03f 6f0a843c 7e3e892b"];
// Cynthia's Phone
// 65a62d82 0a0ac5f9 934c3a02 86093c3d 4bf1d667 a1cb3517 7b002a7c a622ba3c


// Create a connection to the service using mostly default parameters.
service.on('connected', function() {
    console.log("Connected");
});

service.on('transmitted', function(notification, device) {
    console.log("Notification transmitted to:" + device.token.toString('hex'));
});

service.on('transmissionError', function(errCode, notification, device) {
    console.error("Notification caused error: " + errCode + " for device ", device, notification);
    if (errCode === 8) {
        console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
    }
});

service.on('timeout', function () {
    console.log("Connection Timeout");
});

service.on('disconnected', function() {
    console.log("Disconnected from APNS");
});

service.on('socketError', console.error);


// // If you plan on sending identical paylods to many devices you can do something like this.
// function pushNotificationToMany() {
//     console.log("Sending the same notification each of the devices with one call to pushNotification.");
//     var note = new apn.notification();
//     note.setAlertText("Hello, from node-apn!");
//     note.badge = 1;

//     service.pushNotification(note, tokens);
// }

// pushNotificationToMany();


// If you have a list of devices for which you want to send a customised notification you can create one and send it to and individual device.
function pushSomeNotifications() {
    console.log("Sending a tailored notification to %d devices", tokens.length);
    for (var i in tokens) {
        var note = new apn.notification();
        note.setAlertText("Hello, from node-apn! You are number: " + i);
        note.badge = i;
        note.sound = "ping.aiff";

        // note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        // note.badge = 3;
        // note.sound = "ping.aiff";
        // note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
        // note.payload = {'messageFrom': 'Caroline'};

        service.pushNotification(note, tokens[i]);
    }
}

// pushSomeNotifications();

///////////////
//Receive feedback when a device is unreachable. Basically, the user delete the app.
////
function handleFeedback(feedbackData) {
	var time, device;
	for(var i in feedbackData) {
		time = feedbackData[i].time;
		device = feedbackData[i].device;

		console.log("Device: " + device.toString('hex') + " has been unreachable, since: " + time);
	}
}

feedback.on('feedback', handleFeedback);
feedback.on('feedbackError', console.error);


/**
 * Send notification to a single device
 *
 * @method pushSingleNotification
 * @param {String} userId
 * @param {JSON} payload
 */
exports.pushSingleNotification = function(userId, payload, callback) {
    var userName;
    var note = new apn.notification();
    // note.setAlertText(alertText);
    note.sound = "ping.aiff";
    note.payload = payload;
    // note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    // note.badge = 3;
    // note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    // note.payload = {'messageFrom': 'Caroline'};
    
    user.isUserIdValid(userId, function(data){
        userName = data.userData.name;
        if(!data.success){
            callback(data);
        } else{
            user.getDeviceToken(userId, function(deviceToken){
                service.pushNotification(note, deviceToken);
                callback({
                    success: true,
                    message: "message sent to" + userName
                });
            });
        }
    });
};





