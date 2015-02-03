/**
 * Restaurant API
 *
 * @class restController
 * @constructor
 */

var rest = require('../models/restaurant.js');

module.exports = function(app) {
    /**
     * [GET]
     *
     * Get recommand restaurant list
     *
     * payload should look like this
     * {
     *  "participants": [
     *    "541f8f16e4b0a6c8e23401a8",
     *    "544dc0dce4b021c6189d02fe"
     *  ]
     * }
     * Please remember this should encode with base64 utf-8 format before it sent
     *
     * @method getRecommendRest
     * @param {String} participants
     * @return {JSON} restaurant list
     * @example /api/getRecommendRest?participants=<uft-8 encoded participants arry>
     */
    app.route('/api/getRecommendRest')
        .get(function(req, res) {
            try {
                //TODO: use module "validator" isBase64 to handle if req.query.participants is not base64 encoded.
                
                //decode base64 string
                var decodedInput = new Buffer(req.query.participants, 'base64').toString("utf8");
                var decodedQueryObj = JSON.parse(decodedInput);

                rest.getRecommendRest(decodedQueryObj.participants, function (data) {
                    return res.send(data);
                });
            } catch (e) {
                // An error has occured, probably on JSON,parse
                return res.send('Not valid input, unable to do JSON.parse. Please check your pre-encoded JSON format');
            }
        });

    /**
     * [GET]
     *
     * Get top 3 recommand restaurant bases on user location
     *
     * @method getUserLocRecommendRest
     * @param {String} userLocation
     * @return {JSON} restaurant list
     * @example /api/user/:userId/getUserLocRecommendRest
     */
    app.route('/api/user/:userId/getUserLocRecommendRest')
        .get(function(req, res) {
            rest.getUserLocRecommendRest(req.params.userId, req.query.userLocation, function(data) {
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get restaurant by id
     *
     * @method getRestaurantById
     * @param {String} restaurantId
     * @return {JSON} restaurant info
     * @example /api/getRestaurantById/:restaurantId
     */
    app.route('/api/getRestaurantById/:restaurantId')
        .get(function(req, res) {
            rest.getRestaurantById(req.params.restaurantId, function(data){
                return res.send(data);
            });
        });

    /**
     * [GET]
     *
     * Get restaurant by an array of ids
     *
     * @method getRestaurantByIds
     * @param {array} restIds
     * @return {JSON} restaurant info
     * @example /api/getRestaurantByIds?restIds=<uft-8 encoded participants arry>
     */
    app.route('/api/getRestaurantByIds')
        .get(function(req, res) {
            try {
                //decode base64 string
                var decodedInput = new Buffer(req.query.restIds, 'base64').toString("utf8");
                var decodedQueryObj = JSON.parse(decodedInput);

                rest.getRestaurantByIds(decodedQueryObj.restaurant_ids, function(data){
                    return res.send(data);
                });
            } catch (e) {
                // An error has occured, probably on JSON,parse
                return res.send('Not valid input, unable to do JSON.parse. Please check your pre-encoded JSON format');
            }
        });

    /**
     * [GET]
     *
     * Search restaurants w/ filter. Can accept all lower case, will transform "all lower case" to "All Lower Case" to match restaurant name
     *
     * @method searchRestaurants
     * @param {String} filter
     * @return {JSON} restaurant info
     * @example /api/searchRestaurants?filter=
     */
    app.route('/api/searchRestaurants')
        .get(function(req, res) {
            var filterStr = req.query.filter;

            if(filterStr.length < 3){
                res.statusCode = 400;
                return res.send({success: false, message: "Filter must input more than 2 character"});
            } else{
                //Make filter string become title case to match restaurant name
                filterStr = filterStr.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            }
            rest.searchRestaurants(filterStr, function(data){
                return res.send(data);
            });
        });
};