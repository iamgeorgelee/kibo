var PriorityQueue = require('priorityqueuejs');
var apn = require('../routes/apnRoutes.js');
var schedule = require('node-schedule');
var EventHandler = require('../models/event/EventHandler.js');

var queue = new PriorityQueue(function(a, b) {
  return a.outTime - b.outTime;
});


function scheduler(){

	var j = schedule.scheduleJob('* * * * * *', function(){

		checkQueue();
    	console.log(queue);
	
	})

}

scheduler.prototype.enQueue = function(obj){

		queue.enq(obj);

};

scheduler.prototype.deQueue = function(obj){

		queue.deq(obj);

};

scheduler.prototype.reSchedule = function(changeId, newOutTime){

	queue.forEach(function(message){

		if(message.id == changeId){

			message.outTime = newOutTime;

		}

	});

};

scheduler.prototype.sayHi = function(){

	console.log("hi");

};

function checkQueue(){

	while(!queue.isEmpty()){

		if(queue.peek().outTime <= new Date()){

			var obj = queue.deq();
			if(obj.type == "event"){
				obj.stage = 4;
            	EventHandler.decided(obj.id).sendMessage();
			}


		} else {

			break;
		}
	}
};


var myscheduler = null;

module.exports = scheduler;
module.exports.getScheduler = function () {
	
	if(myscheduler == null)
		myscheduler = new scheduler();

	return myscheduler;
}