

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

