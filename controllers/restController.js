/**
 * Restaurant API
 *
 * @class restController
 * @constructor
 */

var rest = require('../models/restaurant.js');
// var base64_encode = require('base64').encode;
var base64Decode = require('base64').decode;

module.exports = function(app) {
    /**
     * [GET]
     *
     * Get recommand restaurant list
     *
     * payload should look like this
     * {  "participants": [
     *     {
     *       "userId": "123456",
     *       "userPreference": ["chinese", "mexican"],
     *       "userLocation": [37.353596, -121.824393]
     *     },
     *     {
     *       "userId": "154345",
     *       "userPreference": ["korean", "pizza", "italian"],
     *       "userLocation": [37.571382, -122.327199]
     *     }]
     * }
     * Please remember this should encode with base64 utf-8 format before it sent
     *
     * @method getRecommendRest
     * @param {String} participants (uft-8 encoded)
     * @return {JSON} restaurant list
     * @example /api/getRecommendRest
     */
    app.route('/api/getRecommendRest')
        .get(function(req, res) {
            try {
              var decodedQueryObj = JSON.parse(base64Decode(req.query.participants));

              rest.getRecommendRest(decodedQueryObj.participants, function(data) {
                    return res.send(data);
                });
            } catch (e) {
              // An error has occured, probably on JSON,parse
              return res.send('Not valid input, unable to do JSON.parse. Please check your pre-encoded JSON format');
            }
        });
};