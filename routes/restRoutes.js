//Connect recommand API
var db = require('./dbRoutes');
var host = "enigmatic-shelf-8910.herokuapp.com";

exports.getRecommendRest = function(locationString, preferenceString, callback){
    db.performrequest(host, '/recommendation/api/v1.0/restaurants/location=' + locationString + '_category=' + preferenceString, 'GET', {
        // apiKey: dbConfig.apiKey
    }, function (data) {
        callback(data);
    });
};