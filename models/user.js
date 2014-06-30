var bcrypt = require('bcrypt-nodejs');

// generating a hash
exports.generateHash = function (userPassword){
    return bcrypt.hashSync(userPassword, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
exports.validPassword = function (password, userPassword) {
    return bcrypt.compareSync(password, userPassword);
};