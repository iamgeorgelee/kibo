// exports.participant = function(userId, userPreference, userLocation){
//     this.userId = userId;
//     this.userPreference = userPreference;
//     this.userLocation = userLocation;
// };

var restRoutes = require('../routes/restRoutes.js');
var async = require('async');
var db = require('../routes/dbRoutes.js');

exports.getRecommendRest = function(participants, callback){
    async.waterfall([
        function(callback){
            var i = 0, j = 0, locationString = '', preferenceString = '';

            function parseLocation(usrloc) {
                locationString += (i === 0 ? usrloc : ',' + usrloc);
                i++;
            }

            function parsePreference(usrpref) {
                preferenceString += (j === 0 ? usrpref : ',' + usrpref);
                j++;
            }

            for (var prop in participants) {
                participants[prop].userLocation.forEach(parseLocation);
                participants[prop].userLocation.forEach(parsePreference);
            }
            callback(null, locationString, preferenceString);
        },
        function(locationString, preferenceString, callback){
            // Call recommend to get recommend restaurant IDs
            restRoutes.getRecommendRest(locationString, preferenceString, function (data) {
                if (data.restaurant_ids === null) {
                    callback('no recommendation', null);
                } else {
                    callback(null, data.restaurant_ids);
                }
            });
        },
        function(restIds, callback){
            var restDetail = [];
            async.each(restIds, function( oneRestId, callback) {
                db.getDocument('Restaurants', oneRestId, function(data){
                    restDetail.push(data);
                    callback();
                });
            }, function(err){
                (err)? callback(err, null): callback(null, restDetail);
            });
        }], function (err, result) {
            (err)? callback(err): callback(result);
        }
    );
};

exports.getRestaurantById = function(restaurantId, callback) {
    db.getDocument("Restaurants", restaurantId, function(data){
        var response;

        if (data.message === 'Document not found') {
            response = {success:false, message: 'No such restaurant'};
        } else {
            response = {success:true, restaurantData:data};
        }
        callback(response);
    });
};