// routes.js

module.exports = (app) => {
    const config = require('./config.js');
    const isProd = process.env.NODE_ENV === 'production';
    const jwt = require('jsonwebtoken');
    const secret = process.env.SECRET_KEY || config.secret;
    const uuid = require('uuid/v4');
    const withAuth = require('./middleware');

    const User = require('./models/User.js');
    const List = require('./models/List.js');

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

        if (!email || !password) {
            return res.status(500).send('Invalid email or password.');
        }

        const user = new User({ email, password });

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
    app.get('/api/users', withAuth, function (req, res) {
        User.findById(req.userId, { password: 0 }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404).send('Not Found');
            }

            List.find({ created_by: req.userId }, function (err, lists) {
                if (err) {
                    return res.status(500).send(err);
                }

                const payload = {
                    user,
                    lists
                };

                return res.status(200).send(payload);
            });
        });
    });

    // POST: create a new list
    app.post('/api/lists', withAuth, function (req, res) {
        let { title } = req.body;

        if (!title) {
            return res.status(400).send('Invalid title!');
        }

        title = title.trim();

        const list = new List({ title, created_by: req.userId });

        list.save(function (err) {
            if (err) {
                return res.status(500).send(err);
            }

            return res.status(200).send(list);
        });
    });

    // GET: get a particular list
    app.get('/api/lists/:list_id', withAuth, function (req, res) {
        List.findById(req.params.list_id, function (err, list) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!list) {
                return res.status(404).send('Not Found');
            }

            return res.status(200).send(list);
        });
    });

    // POST: create an item on a list
    app.post('/api/lists/:list_id/items', withAuth, function (req, res) {
        List.findByIdAndUpdate(req.params.list_id, {
            $push: { items: { title: req.body.title } }
        }, { new: true }, function (err, list) {
            if (err) {
                return res.error(500).send(err);
            }

            return res.status(200).send(list);
        });
    });

    app.delete('/api/lists/:list_id/items/:item_id', withAuth, function (req, res) {
        List.findByIdAndUpdate(req.params.list_id, {
            $pull: { items: { _id: req.params.item_id } }
        }, { new: true }, function (err, list) {
            if (err) {
                return res.status(500).send(err);
            }

            return res.status(200).send(list);
        });
    });

    app.post('/api/auth/verify', withAuth, function (req, res) {
        return res.status(200).send({ id: req.userId });
    });
};