var querystring = require('querystring');
var https = require('https');
var dbConfig = require('../config/db.js');

module.exports = function(endpoint, method, data, success) {

    var dataString = JSON.stringify(data),
        headers = {};

    if (method === 'GET') {
        endpoint += '?' + querystring.stringify(data);
    }
    else {
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }

    // options
    var options = {
        host: dbConfig.host,
        path: endpoint,
        method: method,
        headers: headers
    };

    // do the GET request
    var req = https.request(options, function(res) {
        var responseString = '';

        res.setEncoding('utf-8');
        // console.log("statusCode: ", res.statusCode);

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });

    });
    //POST
    req.write(dataString);
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });
};