// expose our config directly to our application using module.exports
module.exports = {
    'develop': {
        'facebookAuth': { //FB test app
            'clientID': '641407545950720', // your App ID
            'clientSecret': '66503486c31b4cf233f9256ac319e12d', // your App Secret
            'callbackURL': 'https://kibo-service-c9-yuliang29.c9.io/api/FBAuth/callback'
        }
    },
    'staging': {
        'facebookAuth': { //FB test app
            'clientID': '646247828800025', // your App ID
            'clientSecret': '9e3f842fbeffb80e6b6fa8f02ac5ed73', // your App Secret
            'callbackURL': 'http://kibo-service-s.herokuapp.com/auth/facebook/callback'
        }
    }
};