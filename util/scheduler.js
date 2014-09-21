var PriorityQueue = require('priorityqueuejs');
var apn = require('../routes/apnRoutes.js');

var queue = new PriorityQueue(function(a, b) {
  return a.outTime - b.outTime;
});

exports.enQueue = function(message){

		queue.enq(message);

};

exports.deQueue = function(message){

		queue.deq(message);

};

function checkQueue(){

	while(!queue.isEmpty()){

		if(queue.peek().outTime <= currentTime){

			var msg = queue.deq();
			apn.pushSingleNotification(msg.id, msg.payload);

		} else {

			break;
		}
	}
};

