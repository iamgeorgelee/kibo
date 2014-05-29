exports.registration = function(){
    var reg = require('express').Router();

    reg.get('/', function(req, res) {
            res.render('reg', { title: 'Registration'});
        })
        .post('/', function(req, res) {
            if(req.body['password'] != req.body['password-repeat']){
                req.flash('error', 'Entered password not the same');
                // req.session.messages = ['Entered password not the same'];
                return res.redirect('/reg');
            }
        });

	return reg;
};

exports.login = function(){
    var login = require('express').Router();

    login.get('/', function(req, res) {
            res.render('login', { title: 'Login'});
        })
        .post('/', function(req, res) {
            // do stuff
        });

	return login;
};

exports.logout = function(){
    var logout = require('express').Router();

    logout.get('/', function(req, res) {
            // do stuff
        });

	return logout;
};