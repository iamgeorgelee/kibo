var dbConfig = require('../config/db.js');
var performrequest = require('../controllers/performRequest');

exports.getCollection = function (collectionName, callback) {
    performrequest('/api/1/databases/kibo/collections/' + collectionName, 'GET', {
        apiKey: dbConfig.apiKey
    }, function(data) {
        callback(data);
    });
};

exports.getDocument = function (collectionName, documentName, callback) {
    performrequest('/api/1/databases/kibo/collections/' + collectionName + '/' + documentName, 'GET', {
        apiKey: dbConfig.apiKey
    }, function(data) {
        callback(data);
    });
};

exports.createUser = function (input, callback) {
    performrequest('/api/1/databases/kibo/collections/User?apiKey=' + dbConfig.apiKey, 'POST', input, function(data) {
        callback(data);
    });
};

exports.updateUser = function (userId, input, callback) {
    performrequest('/api/1/databases/kibo/collections/User/' + userId + '?apiKey=' + dbConfig.apiKey, 'PUT', input, function(data) {
        callback(data);
    });
};

