// routes.js

module.exports = (app) => {
    const config = require('./config.js');
    const isProd = process.env.NODE_ENV = 'production';
    const jwt = require('jsonwebtoken');
    const secret = process.env.SECRET_KEY || config.secret;
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

                const payload = {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                };

                const token = jwt.sign(payload, secret, {
                    expiresIn: '24h'
                });

                res.cookie('jwt', token, { domain: '127.0.0.1', httpOnly: true, secure: isProd });
                return res.status(200).send({ email, token });
            });
        });
    });

    // POST: log out a user
    app.post('/api/auth/logout', function (req, res) {
        return res.status(200).send({ auth: false, token: null });
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

            const payload = {
                id: user._id,
                email: user.email
            };

            const token = jwt.sign(payload, secret, {
                expiresIn: '24h'
            });

            res.cookie('jwt', token, { httpOnly: true, secure: isProd });
            return res.status(200).send({ email, token });
        });
    });

    // GET: get a particular user
    app.get('/api/users/:user_id', function (req, res) {
        User.findById(req.params.user_id, { password: 0 }, function (err, user) {
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

    app.post('/verifyToken', withAuth, function (req, res) {
        User.findById(req.userId, { password: 0 }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404).send('No user');
            }

            return res.status(200).send(user);
        });
    });
};