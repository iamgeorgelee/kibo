/**
 * MongoLab API
 *
 * @class dbController
 * @constructor
 */

var dbConfig = require('../config/db.js');
var querystring = require('querystring');
var https = require('https');

var performrequest = function(host, endpoint, method, data, success) {

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
};
module.exports.performrequest = performrequest;

/**
 * Get collection by collection name
 *
 * TODO: Should support all optional parameters in http://docs.mongolab.com/restapi/#list-documents, now only support "q"
 *
 * @method getCollection
 * @param {String} collectionName
 * @param {String} queryString
 * @return {JSON} userList
 */
exports.getCollection = function (collectionName, queryString, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName, 'GET', {
        apiKey: dbConfig.apiKey,
        q: queryString
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
 * Create document in given collection
 *
 * @method createDocument
 * @param {String} collectionName
 * @param {Object} input
 * @return {JSON} document (Depends)
 */
exports.createDocument = function (collectionName, input, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName + '?apiKey=' + dbConfig.apiKey, 'POST', input, function (data) {
        callback(data);
    });
};

/**
 * Update document in given collection
 *
 * @method updateDocument
 * @param {String} collectionName
 * @param {String} documentId
 * @param {Object} input
 * @return {JSON} document (Depends)
 * @example Example of input
 *  {"$set": {
 *       username: username,
 *       password: generateHash(password)
 *  }}
 */
exports.updateDocument = function (collectionName, documentId, input, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName + '/' + documentId + '?apiKey=' + dbConfig.apiKey, 'PUT', input, function (data) {
        callback(data);
    });
};
