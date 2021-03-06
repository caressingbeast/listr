const jwt = require('jsonwebtoken');
const config = require('./configuration.js');
const secret = config.SECRET_KEY;

const withAuth = function (req, res, next) {
    const token = req.cookies.jwt;
    const xsrfToken = req.headers['listr-csrf-token'];

    if (!token) {
        return res.status(401).send('Unauthorized: no cookie');
    }

    if (!xsrfToken) {
        return res.status(401).send('Unauthorized: no CSRF header');
    }

    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            return res.status(500).send(err);
        }

        if (decoded.xsrfToken !== xsrfToken) {
            return res.status(401).send('Unauthorized: invalid CSRF key');
        }

        req.userId = decoded.sub;

        return next();
    });
};

module.exports = withAuth;