// routes.js

module.exports = (app) => {
    const config = require('./config.js');
    const isProd = process.env.NODE_ENV === 'production';
    const jwt = require('jsonwebtoken');
    const secret = process.env.SECRET_KEY || config.secret;
    const uuid = require('uuid/v4');
    const withAuth = require('./middleware');

    const User = require('./models/User.js');

    // POST: log in a user
    app.post('/api/auth/login', function (req, res) {
        const { email, password } = req.body;

        User.findOne({ email }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404).send(err);
            }

            user.isCorrectPassword(password, function (err, success) {
                if (err) {
                    return res.status(500).send(err);
                }

                if (!success) {
                    return res.status(401).json({ auth: false, token: null });
                }

                const xsrfToken = uuid();
                const payload = {
                    id: user._id,
                    xsrfToken
                };

                const token = jwt.sign(payload, secret, {
                    expiresIn: '24h'
                });

                res.cookie('jwt', token, { httpOnly: true, secure: isProd });
                return res.status(200).send({ token, xsrfToken });
            });
        });
    });

    // POST: log out a user
    app.post('/api/auth/logout', function (req, res) {
        res.clearCookie('jwt');
        return res.status(200).send({ token: null });
    });

    // POST: create a new user
    app.post('/api/users', function (req, res) {
        const { email, password } = req.body;
        const user = new User({ email, password });

        if (!email || !password) {
            return res.status(500).send('Invalid email or password.');
        }

        user.save(function (err) {

            if (err) {
                return res.status(500).send(err);
            }

            const xsrfToken = uuid();
            const payload = {
                id: user._id,
                xsrfToken
            };

            const token = jwt.sign(payload, secret, {
                expiresIn: '24h'
            });

            res.cookie('jwt', token, { httpOnly: true, secure: isProd });
            return res.status(200).send({ token, xsrfToken });
        });
    });

    // GET: get a particular user
    app.get('/api/user', withAuth, function (req, res) {
        User.findById(req.userId, { password: 0 }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404);
            }

            return res.status(200).send(user);
        });
    });

    // DELETE: deletes a particular user
    app.delete('/api/users/:user_id', withAuth, function (req, res) {
        User.findByIdAndRemove(req.params.user_id, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404);
            }

            return res.status(200);
        });
    });

    // PUT: updates a particular user
    app.put('/api/users/:user_id', withAuth, function (req, res) {
        User.findByIdAndUpdate(req.params.user_id, req.body, { new: true }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            return res.status(200).send(user);
        });
    });

    app.post('/api/auth/verify', withAuth, function (req, res) {
        return res.status(200).send();
    });
};