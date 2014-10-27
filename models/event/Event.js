var apn = require('../../routes/apnRoutes.js');

//constructor
function Event(data) {

		for(var prop in data) {
	       		this[prop] = data[prop];
	   	}

}

Event.prototype.add_participant = function(participant) {
	// body...
};

Event.prototype.rsvp = function(participant, decision) {

	for	(var index = 0; index < this.participants.length; index++) {
    	if(this.participants[index].id === participant){

    		this.participants[index].going = decision;
    		this.participants[index].stage = 1;

    		return true;
    	}
	}

	return false;
};

Event.prototype.sendMessage = function() {
	
	var method;
	var creater = this.creater;
	var eventId = this._id.$oid;
	console.log(eventId);

	if(this.stage === 2){

		this.participants.forEach( function(g) {
     		apn.pushSingleNotification(g.id, {"sender": creater, "cat" : "EVENT","method": "NEW_INVITE", "optional": {"id" : eventId}}, function(data) {

     			console.log(data);
     		});
		});

	} else if (this.stage === 4) {

		this.participants.forEach( function(g) {
     		
			if(g.going === true){

				apn.pushSingleNotification(g.id, {"sender": this.creater, "cat" : "EVENT","method": "DECIDED", "optional": {"id" : this._id}}, function(data) {

     			console.log(data);
     		});
			}

		});

	} 

	// this.participants.forEach( function(g) {
 //     		apn.pushSingleNotification(g.id, {"sender": this.creater, "cat" : "EVENT","method": "NEW_INVITE", "optional": {"id" : this._id}}, function(data) {

 //     			console.log(data);
 //     		});
	// 	});

};

Event.prototype.cancel = function() {
	// body...
};

Event.prototype.getCreater = function() {
	 console.log(this.creater);
};

Event.prototype.create = function() {


	 console.log("Event created.");
};


module.exports = Event;

