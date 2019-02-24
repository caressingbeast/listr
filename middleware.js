// middleware.js

const jwt = require('jsonwebtoken');
const config = require('./config.js');
const secret = process.env.API_SECRET || config.secret;

const withAuth = function (req, res, next) {
    const token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).send('Invalid or missing token!');
    }

    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            return res.status(500).send(err);
        }

        req.userId = decoded.id;

        return next();
    });
};

module.exports = withAuth;