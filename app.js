//This is the application entry point

//Module dependencies.
var express    = require('express');
var bodyParser = require('body-parser');
var connect    = require('connect');
var flash      = require('connect-flash');
var session    = require('express-session');
var logger     = require('morgan');
var passport   = require('passport');
var port       = process.env.PORT || 8080;
var app = express();

// ========================================
// Configuration
// ========================================
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(logger('dev'));
app.use(connect.methodOverride());
app.use(connect.cookieParser());
app.use(bodyParser());
app.use(session({ secret: 'kibokibokibo' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


// var test = require('./models/user.js');
// pass passport for configuration
require('./config/user')(passport);

// ========================================
// Routes for our API
// ========================================

// HOME PAGE
app.route('/')
    .get(function(req, res) {
        res.render('index', { message: req.flash('loginMessage'), isAuthenticated: req.isAuthenticated(), user : req.user});
    });
// User Routes. e.g. login, signup
require('./routes/UserRoutes.js')(app, passport);

// ========================================
// Mode Selection
// ========================================
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
   app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
}

if ('production' == env) {
   app.use(connect.errorHandler());
}

// ========================================
// Listened Port and feedback print to console
// ========================================
app.listen(port);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
console.log("Host IP is %s", process.env.IP);
console.log("Server Up!");
