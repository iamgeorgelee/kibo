var db = require('../routes/dbRoutes.js');
var EventHandler = require('../models/event/EventHandler.js');
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
     * [GET]
     *
     * Get today's event by user id 
     *
     * @method getEventById
     * @param {String} type keyword
     * @return {JSON} event data
     * @example /api/event/today/userid
     */
    app.route('/api/event/today/:userId')
        .get(function(req, res) {

        	var current = new Date();
        	var eod = new Date();
        	eod.setHours(23,59,59,999);
            EventHandler.getEventByUserRange(req.params.userId, "yes", "date", current.toJSON(), eod.toJSON(), function(data) {
                return res.send(data);
            });
        });

          /**
     * [GET]
     *
     * Get event by user id from 7 days
     *
     * @method getEventById
     * @param {String} userId
     * @return {JSON} event data
     * @example /api/event/upcoming/userid
     */
    app.route('/api/event/upcoming/:userId')
        .get(function(req, res) {

        	var tomorrow = new Date();
        	tomorrow.setHours(23,59,59,999);
        	tomorrow.setDate(tomorrow.getDate() + 1);
        	var seven = new Date();
        	seven.setHours(23,59,59,999);
        	seven.setDate(seven.getDate() + 7);
            EventHandler.getEventByUserRange(req.params.userId, "yes", "date", tomorrow.toJSON(), seven.toJSON(), function(data) {
                return res.send(data);
            });
        });
      /**
     * [GET]
     *
     * Get event by other types of parameter
     *
     * @method getEventById
     * @param {String} type of parameter
     * @param {String} type keyword
     * @return {JSON} event data
     * @example /api/event/creater/createrid
     */
    app.route('/api/event/:type/:keyword')
        .get(function(req, res) {
            EventHandler.getEvent(req.params.type, req.params.keyword, function(data) {
                return res.send(data);
            });
        });


           /**
     * [GET]
     *
     * Get event by other types of parameter
     *
     * @method getEventById
     * @param {String} type of parameter
     * @param {String} type keyword
     * @return {JSON} event data
     * @example /api/event/creater/createrid
     */
    app.route('/api/event/upcoming/:userId')
        .get(function(req, res) {
            EventHandler.getEvent(req.params.type, req.params.keyword, function(data) {
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
	*	  "Date": "2012-04-23T18:25:43.511Z",
	*	  "restaurant": "booling crab", //optional, if decided and no voting
	*      "participants": [
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