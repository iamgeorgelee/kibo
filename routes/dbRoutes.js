/**
 * MongoLab API
 *
 * @class dbController
 * @constructor
 */

var dbConfig = require('../config/db.js');
var querystring = require('querystring');
var https = require('https');

function performrequest(host, endpoint, method, data, success) {
    var dataString = JSON.stringify(data),
        headers = {};

    if (method === 'GET') {
        endpoint += '?' + querystring.stringify(data);
    } else {
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }

    // options
    var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: headers
    };

    // do the GET request
    var req = https.request(options, function (res) {
        var responseString = '';

        res.setEncoding('utf-8');

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });

    });
    //POST
    req.write(dataString);
    req.end();
    req.on('error', function (e) {
        console.error(e);
    });
}

/**
 * Get collection by collection name
 *
 * @method getCollection
 * @param {String} collectionName
 * @return {JSON} userList
 */
exports.getCollection = function (collectionName, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName, 'GET', {
        apiKey: dbConfig.apiKey
    }, function (data) {
        callback(data);
    });
};

/**
 * Get document by document name
 * e.g. Get User by userid
 *
 * @method getDocument
 * @param {String} collectionName
 * @param {String} documentName
 * @return {JSON} user
 */
exports.getDocument = function (collectionName, documentId, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName + '/' + documentId, 'GET', {
        apiKey: dbConfig.apiKey
    }, function (data) {
        callback(data);
    });
};

/**
 * Create user
 *
 * @method createUser
 * @param {Object} input
 * @return {JSON} user
 */
exports.createUser = function (input, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/User?apiKey=' + dbConfig.apiKey, 'POST', input, function (data) {
        callback(data);
    });
};

/**
 * Update user
 *
 * @method updateUser
 * @param {String} userId
 * @param {Object} input
 * @return {JSON} user
 * @example Example of input
 *  {"$set": {
 *       username: username,
 *       password: User.generateHash(password)
 *  }}
 */
exports.updateUser = function (userId, input, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/User/' + userId + '?apiKey=' + dbConfig.apiKey, 'PUT', input, function (data) {
        callback(data);
    });
};


