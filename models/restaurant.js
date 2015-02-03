var restRoutes = require('../routes/restRoutes.js');
var async = require('async');
var db = require('../routes/dbRoutes.js');
var user = require('./user.js');

var getRestaurantById = function (restaurantId, callback) {
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
module.exports.getRestaurantById = getRestaurantById;

var getRestaurantByIds = function (restIds, callback) {
    var queryString = "{\"_id\":{$in:[";

    for(var i=0; i<restIds.length; i++){
        if(i===0){
            queryString += "{\"$oid\":\"" + restIds[i] + "\"}";
        } else{
            queryString += ",{\"$oid\":\"" + restIds[i] + "\"}";
        }
    }
    queryString += "]}}}";

    db.getCollection("Restaurants", queryString, function(data){
        var response;

        if (data.length <= 0) {
            response = {success:false, message: 'No such restaurant'};
        } else {
            response = {success:true, restaurantData:data};
        }
        callback(response);
    });
};
module.exports.getRestaurantByIds = getRestaurantByIds;

exports.getRecommendRest = function(participants, callback){
    async.waterfall([
        function(callback){
            var preferenceString = "";
            var locationString = "37.565810,-122.323178"; //Hard code location for now!!

            function callUserPreference(uId, callback){
                user.getUserPreference(uId, function(data){
                    var preferences = [];

                    for(var prop in data){
                        if(data[prop] === 1) { //category user likes
                            preferences.push(prop);
                        }
                    }
                    callback(null, preferences);
                });
            }

            async.map(participants, callUserPreference, function(err, result){
                if(err){
                    callback(err, null, null);
                } else{
                    var baseArr = []; //used for concatnate
                    for(var prop in result){
                        baseArr = baseArr.concat(result[prop]);
                    }

                    //Remove duplicate elements in the array
                    //Why this work? pos will iterate through 'result' since indexOf always return the first found element
                    //when the pos hit the duplicate elem it wont match
                    var uniqueResult = baseArr.filter(function(elem, pos) {
                        return baseArr.indexOf(elem) === pos;
                    });
                    preferenceString = uniqueResult.toString();
                    callback(null, locationString, preferenceString);
                }
            });
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
        }], function (err, result) {
            (err)? callback(err): callback(result);
        });
};

exports.getUserLocRecommendRest = function(userId, userLocation, callback){
    async.waterfall([
        function(callback){
            var i = 0, preferenceString = '';

            function parsePreference(usrpref) {
                preferenceString += (i === 0 ? usrpref.categories : ',' + usrpref.categories);
                i++;
            }

            user.getUserPreference(userId, function(data){
                data.forEach(parsePreference);
                callback(null, userLocation, preferenceString);
            });
        },
        function(locationString, preferenceString, callback){
            // Call recommend to get recommend restaurant IDs
            restRoutes.getRecommendRest(locationString, preferenceString, function (data) {
                if (data.restaurant_ids === null) {
                    callback('no recommendation', null);
                } else {
                    var topThree = [];
                    //Only get top 3 here
                    for(var i=0; i<3; i++){
                        topThree.push(data.restaurant_ids[i]);
                    }
                    callback(null, topThree);
                }
            });
        },
        function(restIds, callback){
            getRestaurantByIds(restIds, function(data){
                callback(null, data);
            });
        }], function (err, result) {
            (err)? callback(err): callback(result);
        }
    );
};

exports.searchRestaurants = function(filter, callback){
    var queryString = "{\"name\":{\"$regex\":\"" + filter + "*\"}}";

    db.getCollection("Restaurants", queryString, function(data){
        if (data.length <= 0) {
            callback({success:false, message: 'No such restaurant'});
        } else {
            callback({success:true, restaurantData:data});
        }
    });
};