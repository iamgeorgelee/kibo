
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    bodyParser = require('body-parser'),
    connect = require('connect');
  
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser());
app.use(connect.methodOverride());
app.use(express.static(__dirname + '/public'));

// Routes

app.get('/', routes.index);


var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
   app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
}

if ('production' == env) {
   app.use(connect.errorHandler());
}




app.listen(process.env.PORT);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
