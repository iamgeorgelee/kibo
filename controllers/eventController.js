var db = require('../routes/dbRoutes.js');
var EventHandler = require('../models/event/eventHandler.js');
var async = require('async');

/**
 * User API
 *
 * @class eventContorller
 * @constructor
 */


module.exports = function(app) {
 

    /**
     * [GET]
     *
     * Get app user list
     *
     * @method getUsers
     * @return {JSON} app user list
     * @example /api/getUsers
     */
    app.route('/api/event')
        .get(function(req, res) {
            EventHandler.getEventById(function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get event by id
     *
     * @method getEventById
     * @param {String} eventId
     * @return {JSON} event data
     * @example /api/event/:eventId
     */
    app.route('/api/event/:eventId')
        .get(function(req, res) {
            EventHandler.getEventById(req.params.eventId, function(data) {
                return res.send(data);
            });
        });

    /**
     * [POST]
     *
     * Create Event
     * (should add send friend request later on)
     *
     * @method createEvent
     * @param {String} userId User who wants to add friend
     * @param {String} friendId Friend to add (in request content)
     * @return {JSON} user data
     * @example /api/event 
     * {
	*	  "name": "test1",
	*	  "time": "6:30",
	*	  "Date": "11/11/2014",
	*	  "guest": [
	*	    {
	*	      "id": "a45612378"
	*	    },
	*	    {
	*	      "id": "a445122378"
	*	    }
	*	  ],
	*	  "creater": "a123456789"
	*	}
     * 
     */
    app.route('/api/event/')
        .post(function(req, res) {
            EventHandler.createEvent(req.body, function(data) {
                return res.send(data);
            });
     	});

    /**
     * [PUT]
     *
     * guest RSVP
     * 
     *
     * @method RSVP
     * @param {String} userId User who wants to add friend
     * @param {String} friendId Friend to add (in request content)
     * @return {JSON} user data
     * @example /api/event
     */
    app.route('/api/event/rsvp')
        .put(function(req, res) { 

            EventHandler.rsvp(req.body, function(data) {
                
                return res.send(data);
            });
     	});


};