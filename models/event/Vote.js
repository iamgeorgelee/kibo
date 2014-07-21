
//constructor
function Vote() {

	this.options = [];

}

Vote.prototype.add_voter = function(voter) {
	// body...
};

Vote.prototype.decide = function(votes) {
	
	votes.forEach( function(vote) { 
     	vote.stage = 0;
	});

};

Vote.prototype.cancel = function() {
	// body...
};

Vote.prototype.addOption = function(newOption) {
	this.options.push(newOption);
};

Vote.prototype.addAllOptions = function(newOptions) {
	this.options = this.options.concat(newOptions);
};

module.exports = Vote;