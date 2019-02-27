// User.js

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        unique: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', function (next) {
    const user = this;

    // lowercase and trim
    user.email = user.email.toLowerCase().trim();
    user.firstName = user.firstName.trim();
    user.lastName = user.lastName.trim();

    if (!user.isModified('password')) {
        return next();
    }

    user.password = user.password.trim();
    
    return bcrypt.hash(user.password, SALT_ROUNDS, function (err, hashedPassword) {
        if (err) {
            return next(err);
        }

        // update the password
        user.password = hashedPassword;

        return next();
    });
});

UserSchema.methods.isCorrectPassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (err, success) {
        if (err) {
            return callback(err);
        }

        return callback(null, success);
    });
};

module.exports = mongoose.model('User', UserSchema);