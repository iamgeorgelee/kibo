// // app/models/user.js
// // load the things we need
//     var bcrypt   = require('bcrypt-nodejs');
//     var https      = require('https');
//     var user;
//     var performrequest = require('../models/performRequest');

// // module.exports = function() {

// //     // var user = {
// //     //     local            : {
// //     //         email        : String,
// //     //         password     : String,
// //     //     },
// //     //     facebook         : {
// //     //         id           : String,
// //     //         token        : String,
// //     //         email        : String,
// //     //         name         : String
// //     //     }
// //     // };



// //     // // methods ======================
// //     // // generating a hash
// //     // userSchema.methods.generateHash = function(password) {
// //     //     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// //     // };

// //     // // checking if password is valid
// //     // userSchema.methods.validPassword = function(password) {
// //     //     return bcrypt.compareSync(password, this.local.password);
// //     // };



// exports.getUser = function(){
//     performrequest.performRequest('/api/1/databases/kibo/collections/User', 'GET', {
//         apiKey: "necMvEqo9wdApurqW9z5c-80Jz04T_uX"
//     }, function(data) {
//         // sessionId = data.result.id;
//         console.log(data);
//         return data;
//         // getCards();
//     });
// };
