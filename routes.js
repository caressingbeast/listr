// routes.js

module.exports = (app) => {
    const config = require('./configuration.js');
    const isProd = process.env.NODE_ENV === 'production';
    const jwt = require('jsonwebtoken');
    const secret = config.SECRET_KEY;
    const uuid = require('uuid/v4');
    const withAuth = require('./middleware');

    const List = require('./models/List.js');
    const User = require('./models/User.js');

    // POST: log in a user
    app.post('/api/auth/login', function (req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Bad Request');
        }

        // find the user (explicitly include password)
        User.findOne({ email }).select('+password').exec(function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404).send('Not Found');
            }

            user.isCorrectPassword(password, function (err, success) {
                if (err) {
                    return res.status(500).send(err);
                }

                if (!success) {
                    return res.status(401).json({ token: null, xsrfToken: null });
                }

                const xsrfToken = uuid();
                const payload = {
                    sub: user.id,
                    xsrfToken
                };

                const token = jwt.sign(payload, secret, {
                    expiresIn: '24h'
                });

                res.cookie('jwt', token, { httpOnly: true, secure: isProd });
                return res.status(200).json({ id: payload.sub, token, xsrfToken });
            });
        });
    });

    // POST: log out a user
    app.post('/api/auth/logout', function (req, res) {
        res.clearCookie('jwt');
        return res.status(200).send({ token: null, xsrfToken: null });
    });

    // POST: create a user
    app.post('/api/users', function (req, res) {
        const body = req.body;

        // all fields are required
        if (!body.email || !body.firstName || !body.lastName || !body.password) {
            return res.status(400).send('Bad Request');
        }

        const user = new User(body);

        user.save(function (err) {
            if (err) {
                return res.status(500).send(err);
            }

            const xsrfToken = uuid();
            const payload = {
                sub: user.id,
                xsrfToken
            };

            const token = jwt.sign(payload, secret, {
                expiresIn: '24h'
            });

            // remove the password
            const objUser = user.toObject();
            delete objUser.password;

            res.cookie('jwt', token, { httpOnly: true, secure: isProd });
            return res.status(201).send({ id: payload.sub, token, user: objUser, xsrfToken });
        });
    });

    // GET: get a user
    app.get('/api/users/:user_id', withAuth, function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!user) {
                return res.status(404).send('Not Found');
            }

            return res.status(200).json(user);
        });
    });

    // PUT: update a user
    app.put('/api/users/:user_id', withAuth, function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            const { email, firstName, lastName } = req.body;

            user.email = email;
            user.firstName = firstName;
            user.lastName = lastName;

            user.save(function (saveErr, updatedUser) {
                if (saveErr) {
                    return res.status(500).send(saveErr);
                }

                return res.status(200).send(updatedUser);
            });
        });
    });

    // DELETE: delete a user
    app.delete('/api/users/:user_id', withAuth, function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }

            user.remove(function (saveErr, removedUser) {
                if (saveErr) {
                    return res.status(500).send(saveErr);
                }
                
                return res.status(200).json(removedUser);
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

    // GET: get all lists for a user
    app.get('/api/lists', withAuth, function (req, res) {
        List.find({ created_by: req.userId }, function (err, lists) {
            if (err) {
                return res.status(500).send(err);
            }

            List.find({ shared_users: req.userId }, function (err, sharedLists) {
                if (err) {
                    return res.status(500).send(err);
                }

                const payload = {
                    lists,
                    sharedLists
                };

                return res.status(200).send(payload);
            });
        });
    });

    // GET: get a list
    app.get('/api/lists/:list_id', withAuth, function (req, res) {
        List.findById(req.params.list_id)
            .populate('shared_users')
            .exec(function (err, list) {
                if (err) {
                    return res.status(500).send(err);
                }

                if (!list) {
                    return res.status(404).send('Not Found');
                }

                return res.status(200).send(list);
            });
    });

    // DELETE: delete a list
    app.delete('/api/lists/:list_id', withAuth, function (req, res) {
        List.findById(req.params.list_id, function (err, list) {
            if (err) {
                return res.status(500).send(err);
            }

            // only the creator can delete a list
            if (list.created_by.toString() !== req.userId) {
                return res.status(401).send('Unauthorized');
            }

            list.remove(function (saveErr, removedList) {
                if (saveErr) {
                    return res.status(500).send(saveErr);
                }

                return res.status(200).send(removedList);
            });
        });
    });

    // POST: create an item on a list
    app.post('/api/lists/:list_id/items', withAuth, function (req, res) {
        List.findById(req.params.list_id)
            .populate('shared_users')
            .exec(function (err, list) {
                if (err) {
                    return res.status(500).send(err);
                }

                // push the item
                list.items.push({
                    title: req.body.title
                });

                // save the list
                list.save(function (saveErr, updatedList) {
                    if (saveErr) {
                        return res.error(500).send(saveErr);
                    }
        
                    return res.status(200).send(updatedList);
                });
            });
    });

    // DELETE: delete an item on a list
    app.delete('/api/lists/:list_id/items/:item_id', withAuth, function (req, res) {
        List.findById(req.params.list_id)
            .populate('shared_users')
            .exec(function (err, list) {
                if (err) {
                    return res.status(500).send(err);
                }

                // pull the item
                list.items.pull({ _id: req.params.item_id });

                // save the list
                list.save(function (saveErr, updatedList) {
                    if (saveErr) {
                        return res.status(500).send(saveErr);
                    }

                    return res.status(200).send(updatedList);
                });
            });
    });

    // PUT: update an item on a list
    app.put('/api/lists/:list_id/items/:item_id', withAuth, function (req, res) {
        List.findById(req.params.list_id)
            .populate('shared_users')
            .exec(function (err, list) {
                if (err) {
                    return res.status(500).send(err);
                }

                // get and update the item
                let item = list.items.find(function (i) {
                    return i.id === req.params.item_id;
                });

                item.completed = req.body.completed;

                // save the list
                list.save(function (saveErr, updatedList) {
                    if (saveErr) {
                        return res.status(500).send(saveErr);
                    }

                    return res.status(200).send(updatedList);
                });
            });
    });

    // POST: share a list
    app.post('/api/lists/:list_id/shared', withAuth, function (req, res) {
        List.findById(req.params.list_id, function (err, list) {
            if (err) {
                return res.status(500).send(err);
            }

            // only the creator can share a list
            if (list.created_by.toString() !== req.userId) {
                return res.status(401).send('Unauthorized');
            }

            // lowercase and trim
            const email = req.body.email.toLowerCase().trim();

            User.findOne({ email }, function (userErr, user) {
                if (userErr) {
                    return res.status(500).send(userErr);
                }

                // if no user found, make the front-end think all is okay
                if (!user) {
                    return res.status(204).send('No Content');
                }

                list.shared_users.push(user);

                list.save(function (saveErr, updatedList) {
                    if (saveErr) {
                        return res.status(500).send(saveErr);
                    }

                    return res.status(200).send(updatedList);
                });
            });
        });
    });

    // DELETE: unshare a list 
    app.delete('/api/lists/:list_id/shared', function (req, res) {
        List.findById(req.params.list_id)
            .populate('shared_users')
            .exec(function (err, list) {
                if (err) {
                    return res.status(500).send(err);
                }

                if (!list) {
                    return res.status(404).send('Not Found');
                }

                list.shared_users.pull(req.body.id);

                list.save(function (saveErr, updatedList) {
                    if (saveErr) {
                        return res.status(500).send(saveErr);
                    }

                    return res.status(200).json(updatedList);
                });
            });
    });

    // POST: verify a JWT
    app.post('/api/auth/verify', withAuth, function (req, res) {
        return res.status(200).send({ id: req.userId });
    });
};