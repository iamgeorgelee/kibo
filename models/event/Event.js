

//constructor
function Event(data) {

		for(prop in data) {                        
	       		this[prop] = data[prop];                  
	   	}

}

Event.prototype.add_participant = function(participant) {
	// body...
};

Event.prototype.rsvp = function(participant, decision) {

	for	(index = 0; index < this.guest.length; index++) {
    	if(this.guest[index].id == participant){

    		this.guest[index].going = decision;
    		this.guest[index].stage = 1;

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

