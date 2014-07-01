/**
 * MongoLab API
 *
 * @class dbController
 * @constructor
 */

var dbConfig = require('../config/db.js');
var performrequest = require('../controllers/performRequest');

/**
 * Get coolection by collection name
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
 *
 * @method getDocument
 * @param {String} collectionName
 * @param {String} documentName
 * @return {JSON} user
 */
exports.getDocument = function (collectionName, documentName, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/' + collectionName + '/' + documentName, 'GET', {
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
 */
exports.updateUser = function (userId, input, callback) {
    performrequest(dbConfig.host, '/api/1/databases/kibo/collections/User/' + userId + '?apiKey=' + dbConfig.apiKey, 'PUT', input, function (data) {
        callback(data);
    });
};
