// middleware.js

const jwt = require('jsonwebtoken');
const config = require('./config.js');
const secret = process.env.SECRET_KEY || config.secret;

const withAuth = function (req, res, next) {
    const token = req.cookies.jwt;
    const xsrfToken = req.headers['listr-csrf-token'];

    if (!token) {
        return res.status(403).send('Invalid token');
    }

    if (!xsrfToken) {
        return res.status(403).send('Invalid CSRF token');
    }

    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            return res.status(500).send(err);
        }

        if (decoded.xsrfToken !== xsrfToken) {
            return res.status(403).send('Invalid CSRF token');
        }

        req.userId = decoded.sub;

        return next();
    });
};

module.exports = withAuth;