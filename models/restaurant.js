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
            var i=0, j=0;
            var locationString = '';
            var preferenceString = '';
            for(var prop in participants){
                participants[prop].userLocation.forEach(function(usrloc){
                    locationString += ( i === 0? usrloc: ',' + usrloc);
                    i++;
                });

                participants[prop].userPreference.forEach(function(usrpref){
                    preferenceString += ( j === 0? usrpref: ',' + usrpref);
                    j++;
                });
            }
            callback(null, locationString, preferenceString);
        },
        function(locationString, preferenceString, callback){
            // Call recommend to get recommend restaurant IDs
            restRoutes.getRecommendRest(locationString, preferenceString, function(data){
                callback(null, data.restaurant_ids);
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
                if( err ) {
                  console.log('Retrieve restaurant failed');
                  callback(err, null);
                } else {
                  console.log('All data retrieved successfully');
                  callback(null, restDetail);
                }
            });
        }], function (err, result) {
            if (err) {
                callback(err);
            } else{
                callback(result);
            }
        }
    );
};