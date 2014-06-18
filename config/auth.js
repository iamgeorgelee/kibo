// expose our config directly to our application using module.exports
module.exports = {
    'develop' : {
        'facebookAuth' : { //FB test app
            'clientID' 		: '644509915640483', // your App ID
            'clientSecret' 	: 'ec766e17d02ced808c9b87ae0b0e1077', // your App Secret
            'callbackURL' 	: 'https://kibo-service-c9-yuliang29.c9.io/auth/facebook/callback'
    	}
    },
    'staging' : {
        'facebookAuth' : { //FB test app
            'clientID' 		: '646247828800025', // your App ID
            'clientSecret' 	: '9e3f842fbeffb80e6b6fa8f02ac5ed73', // your App Secret
            'callbackURL' 	: 'http://kibo-service-s.herokuapp.com/auth/facebook/callback'
    	}
    }
};