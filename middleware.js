// middleware.js

const jwt = require('jsonwebtoken');
const config = require('./config.js');
const secret = process.env.API_SECRET || config.secret;

const withAuth = function (req, res, next) {
    const token = req.cookies.jwt;
    const xsrfToken = req.headers['x-csrf-token'];

    if (!token) {
        return res.status(403).send('Invalid token!');
    }

    if (!xsrfToken) {
        return res.status(403).send('Invalid CSRF token!');
    }

    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            return res.status(500).send(err);
        }

        if (decoded.xsrfToken !== xsrfToken) {
            return res.status(403).send('Invalid CSRF token!');
        }

        req.userId = decoded.id;

        return next();
    });
};

module.exports = withAuth;