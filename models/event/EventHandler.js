
var db = require('../../routes/dbRoutes.js');
var restaurant = require('../../models/restaurant.js');
var Event = require('./Event.js');
var async = require('async');
var Vote = require('./Vote.js');
var apn = require('../../routes/apnRoutes.js');

var Scheduler = require('../../util/scheduler.js');
var scheduler = Scheduler.getScheduler();

//var t = new event("53a513629df6cb8b503b753e");
var ONE_HOUR = 60 * 60 * 1000; /* ms */

exports.getEventById = function(id, callback){

		db.getDocument('Event', id, function(data){
	     //  console.log(data.creater);
	       callback(data);

	    });

};

exports.getEventObjectById = function(id){

		db.getDocument('Event', id, function(data){

	       return new Event(data);

	    });

};

exports.getEvent = function(type, keyword, callback){

		db.getCollection('Event', '{"'+ type + '": "' + keyword + '"}', function(data){
	     //  console.log(data.creater);
	       callback(data);

	    });

};

exports.getEventByUserRange = function( userId, going, type, from, to, callback){

		db.getCollection('Event', '{"participants": { $elemMatch: { "id":"' + userId + '", "going": "' + going + '"} },"' + type +'": {$gte: "'+ from +'", $lt: "' + to +'"}}', function(data){
	     
	       callback(data);

	    });

};

exports.createEvent = function(payload, callback){

	var newEvent = new Event(payload);
 
	var creater = { 
	'id' : newEvent.creater,
	'going' : true,
	'stage' : 1
	};
	newEvent.participants.push(creater);

	newEvent.stage = 0;

	newEvent.participants.forEach( function(g) {
     	g.stage = 0;
	});

	 async.series([
        //stage 1 get restaurant list, create vote
        function(callback) {

        	if(newEvent.restaurant === undefined) { // get recommendation


        		//get users' location
        		//call restaurant method

        		newEvent.vote = new Vote();

				var temp = '{"id" : "53ca64aa9df6cb8b503b84bc","name" : "boiling crab"}';
				newEvent.vote.addOption(JSON.parse(temp));
				

        	} 

        	newEvent.stage = 1;


            callback();
        },
        //stage 2 create event in DB
        function(callback) {

        	newEvent.createTime = new Date();

        	newEvent.stage = 2;

			db.createDocument('Event', newEvent, function(data){

	       		newEvent = new Event(data);
	       		callback();
			});

        	
        },

    ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) {

        	callback(err);
        }
        else{ //send invite to friends including restaurant options

        	newEvent.sendMessage();

        	newEvent.stage = 3;

        	scheduler.enQueue({"outTime": new Date(newEvent.createTime).addHours(1) , "type": "event", "id" : newEvent._id});
        }

        callback(newEvent);

    });

};

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
};

exports.rsvp = function(payload, callback){

	db.getDocument('Event', payload.eventId, function(data){

			var temp = new Event(data);

			var result = temp.rsvp(payload.userId, payload.going);

			if(result === true){
				db.updateDocument('Event', payload.eventId,
	                {"$set": {
					             "participants" : temp.participants
					   }
	                }, function(data){

		    			callback(data);
				});
	    	} else {

	    		callback(data);
	    	}
	   });


};

exports.decided = function(payload, callback){

				db.updateDocument('Event', payload.eventId,
	                {"stage": 4 }, function(data){

		    			callback(data);
				});

};