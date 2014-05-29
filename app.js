
/**
 * Module dependencies.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    connect = require('connect'),
    flash = require('connect-flash');

//Create Server
var app = express();

//Configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.use(flash());
app.use(connect.methodOverride());
app.use(connect.cookieParser());
app.use(connect.session({
        secret: 'keyboard cat',
        cookie: { maxAge: 60000 }
    })
);
app.use(function(req, res, next){
    var err = req.flash('error');

    if(err.length)
        res.locals.error = err;
    else
        res.locals.error = null;

    next();
  });

/**
 * Router Settings
 */

//Root
app.route('/')
	.get(function(req, res) {
		res.render('index', { title: 'Home'});
	});

//Entry point is where the user do login, logout and register
var entryPoint = require('./routes/entry_point');
var reg = entryPoint.registration();
app.use('/reg', reg);
var login = entryPoint.login();
app.use('/login', login);
var logout = entryPoint.logout();
app.use('/logout', logout);

//Move out if expand leter on
app.route('/user/:user')
	.get(function(req, res) {
		// do stuff
	});

/**
 * Mode
 */
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
   app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
}

if ('production' == env) {
   app.use(connect.errorHandler());
}

/**
 * Listened Port and feedback print to console
 */
app.listen(process.env.PORT);
console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
console.log("Host IP is %s", process.env.IP);
