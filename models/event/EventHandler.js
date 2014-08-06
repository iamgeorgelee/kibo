
var db = require('../../routes/dbRoutes.js');
var Event = require('./Event.js');
var async = require('async');
var Vote = require('./Vote.js');

//var t = new event("53a513629df6cb8b503b753e");



exports.getEventById = function(id, callback){

		db.getDocument('Event', id, function(data){
	     //  console.log(data.creater);
	       callback(data);

	    });

};

exports.createEvent = function(payload, callback){

	// console.log(newEvent);

	var newEvent = new Event(payload);

	newEvent.vote = new Vote();
	newEvent.stage = 0;

	newEvent.guest.forEach( function(g) {
     	g.stage = 0;
	});

	 async.series([
        //stage 1 get restaurant list, create vote
        function(callback) {


			var temp = '{"id" : "53ca64aa9df6cb8b503b84bc","name" : "boiling crab"}';
			newEvent.vote.addOption(JSON.parse(temp));
			newEvent.stage = 1;

            callback();
        },
        //stage 2 send invite to friends including restaurant options
        function(callback) {

        	newEvent.stage = 2;
        	callback();
        },

    ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) {

        	callback(err);
        }
        else{

        	newEvent.stage = 3;

			db.createDocument('Event', newEvent, function(data){
	     //  console.log(data.creater);
	       	callback(data);

			});

        }

    });

};


exports.rsvp = function(payload, callback){

	db.getDocument('Event', payload.eventId, function(data){

			var temp = new Event(data);

			var result = temp.rsvp(payload.guestId, payload.going);

			if(result === true){
				db.updateDocument('Event', payload.eventId,
	                {"$set": {
					             "guest" : temp.guest
					   }
	                }, function(data){

		    			callback(data);
				});
	    	} else {

	    		callback(data);
	    	}
	   });


};