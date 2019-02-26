const app = require('../server.js');
const config = require('../configuration.js');
const fixtures = require('./fixtures.js');

const jwt = require('jsonwebtoken');

const chai = require('chai');
const mongoose = require('mongoose');
const request = require('supertest');
const expect = chai.expect;

const List = require('../models/List.js');
const User = require('../models/User.js');

const randomUser = fixtures.getRandomUser();

describe('Listr API integration tests', () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('public routes', () => {

        describe('POST /api/auth/login', () => {

            it('responds with 400 if missing required fields', async () => {
                const res = await request(app)
                    .post('/api/auth/login');
    
                expect(res.status, 'sends correct status').to.equal(400);
            });
    
            it('responds with 404 if no user found', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: randomUser.email,
                        password: randomUser.password
                    });
    
                expect(res.status, 'sends correct status').to.equal(404);
            });
    
            it('responds with 401 if invalid password', async () => {
    
                // save a user to the database first
                const user = new User(randomUser);
                await user.save();
    
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: randomUser.email,
                        password: 'invalid'
                    });
    
                expect(res.status, 'sends correct status').to.equal(401);
                expect(res.body.token, 'sends null token').to.be.null;
                expect(res.body.xsrfToken, 'sends null xsrfToken').to.be.null;
            });
    
            it('responds with 200 and expected data if valid request', async () => {
                
                // save a user to the database first
                const user = new User(randomUser);
                await user.save();
    
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: randomUser.email,
                        password: randomUser.password
                    });
    
                const token = res.body.token;
    
                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.id, 'sends user ID').to.equal(user.id);
                expect(token, 'sends valid token').to.be.a('string');
                expect(res.body.xsrfToken, 'sends valid xsrfToken').to.be.a('string');
    
                const cookies = res.headers['set-cookie'];
                expect(cookies, 'sends cookie').to.have.lengthOf(1);
                expect(cookies[0].indexOf(token), 'sends token in cookie').to.be.above(-1);
    
                const decoded = jwt.verify(token, config.SECRET_KEY);
                expect(decoded.xsrfToken, 'sets xsrfToken in JWT').to.equal(res.body.xsrfToken);
            });
        });
    
        describe('POST /api/auth/logout', () => {
    
            it('responds with 200 and clears cookie', async () => {
    
                // save a user to the database first
                const user = new User(randomUser);
                await user.save();
    
                // log in
                const loginRes = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: randomUser.email,
                        password: randomUser.password
                    });
    
                const cookie = loginRes.headers['set-cookie'][0];
    
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Cookie', [cookie]);
    
                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.token, 'sends null token').to.be.null;
                expect(res.body.xsrfToken, 'sends null xsrfToken').to.be.null;
                expect(res.headers['set-cookie'][0], 'clears cookie').to.not.equal(cookie);
            });
        });
    
        describe('POST /api/users', () => {  
    
            it('responds with 400 if missing required fields', async () => {
                const res = await request(app).post('/api/users')
                    .send({});
    
                expect(res.status, 'sends correct status').to.equal(400);
            });
    
            it('responds with 500 if duplicate user', async () => {
    
                // save a user to the database first
                const user = new User(randomUser);
                await user.save();
    
                const res = await request(app)
                    .post('/api/users')
                    .send(randomUser);
    
                expect(res.status, 'sends correct status').to.equal(500);
                expect(res.text.indexOf('duplicate key error index'), 'sends expected error').to.be.above(-1);
            });
    
            it('responds with 201 and expected data if valid request', async () => {
                const res = await request(app)
                    .post('/api/users')
                    .send(randomUser);
    
                const token = res.body.token;
    
                expect(res.status, 'sends correct status').to.equal(201);
                expect(token, 'sends valid token').to.be.a('string');
                expect(res.body.xsrfToken, 'sends valid xsrfToken').to.be.a('string');
    
                // sets user
                const user = res.body.user;
                expect(user.email, 'sets email').to.equal(randomUser.email.toLowerCase().trim());
                expect(user.firstName, 'sets firstName').to.equal(randomUser.firstName.trim());
                expect(user.lastName, 'sets lastName').to.equal(randomUser.lastName.trim());
                expect(user.password, 'removes password').to.be.undefined;
    
                // sets a cookie
                const cookies = res.headers['set-cookie'];
                expect(cookies, 'sends cookie').to.have.lengthOf(1);
                expect(cookies[0].indexOf(token), 'sends token in cookie').to.be.above(-1);
    
                // adds CSRF data to JWT token
                const decoded = await jwt.verify(token, config.SECRET_KEY);
                expect(decoded.xsrfToken, 'sets xsrfToken in JWT').to.equal(res.body.xsrfToken);
            });
        });
    });

    describe('protected routes', () => {
        let loggedInUser;
        let protectedUser;

        beforeEach(async () => {

            // save a user to the database
            const user = new User(randomUser);
            await user.save();

            loggedInUser = user;

            // log in
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: randomUser.email,
                    password: randomUser.password
                });

            loggedInUser.cookie = res.headers['set-cookie'][0];
            loggedInUser.token = res.body.xsrfToken;

            // save a protected user to the database
            protectedUser = new User(fixtures.getUniqueUser(randomUser.email));
            await protectedUser.save();
        });

        describe('withAuth middleware', () => {            
            let authCalls = [
                {
                    url: 'userUrl',
                    type: 'get'
                },
                {
                    url: 'userUrl',
                    type: 'put'
                },
                {
                    url: 'userUrl',
                    type: 'delete'
                },
                {
                    url: 'listUrl',
                    type: 'post'
                },
                {
                    url: 'listUrl',
                    type: 'get'
                }
            ];

            function getAuthCalls () {
                const listUrl = '/api/lists';
                const userUrl = `/api/users/${loggedInUser.id}`;

                return authCalls.map((c) => {
                    if (c.url === 'userUrl') {
                        c.url = userUrl;
                    }

                    if (c.url === 'listUrl') {
                        c.url = listUrl;
                    }

                    return c;
                });
            }

            function generateRequest (data) {
                const req = request(app);

                switch (data.type) {
                    case 'get':
                        return req.get(data.url);

                    case 'post':
                        return req.post(data.url);

                    case 'put':
                        return req.put(data.url);

                    case 'delete': 
                        return req.delete(data.url);
                }
            }

            it('responds with 401 if no JWT cookie', async () => {
                const promiseArray = getAuthCalls().map((c) => {
                    return generateRequest(c).set('Listr-CSRF-Token', loggedInUser.token);
                });

                const res = await Promise.all(promiseArray);
                
                res.forEach((r) => {
                    expect(r.status, `${r.req.method} ${r.req.path}: sends correct status`).to.equal(401);
                });
            });
    
            it('responds with 401 if no CSRF token', async () => {
                const promiseArray = getAuthCalls().map((c) => {
                    return generateRequest(c).set('Cookie', [loggedInUser.cookie]);
                });

                const res = await Promise.all(promiseArray);

                res.forEach((r) => {
                    expect(r.status, `${r.req.method} ${r.req.path}: sends correct status`).to.equal(401);
                });
            });
    
            it('responds with 401 if JWT and CSRF don\'t match', async () => {
                const token = '1234567890';
                
                const promiseArray = getAuthCalls().map((c) => {
                    return generateRequest(c)
                        .set('Cookie', [loggedInUser.cookie])
                        .set('Listr-CSRF-Token', token);
                });

                const res = await Promise.all(promiseArray);

                res.forEach((r) => {
                    expect(r.status, `${r.req.method} ${r.req.path}: sends correct status`).to.equal(401);
                });
            });
        });

        describe('GET /api/users/:user_id', () => {
    
            it('responds with 404 if no user found', async () => {
                const id = mongoose.Types.ObjectId();
    
                const res = await request(app)
                    .get(`/api/users/${id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(404);
            });
    
            it('responds with 200 and expected data if valid request', async () => {
                const res = await request(app)
                    .get(`/api/users/${loggedInUser.id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.email).to.equal(loggedInUser.email);
                expect(res.body.firstName).to.equal(loggedInUser.firstName);
                expect(res.body.lastName).to.equal(loggedInUser.lastName);
                expect(res.body.password, 'removes password').to.be.undefined;
            });
        });
    
        describe('PUT /api/users/:user_id', () => {

            it('responds with 404 if no user found', async () => {
                const id = mongoose.Types.ObjectId();
    
                const res = await request(app)
                    .put(`/api/users/${id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(404);
            });

            it('responds with 401 if :user_id does not match JWT user', async () => {
                const res = await request(app)
                    .put(`/api/users/${protectedUser.id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(401);
            });

            it('responds with 400 if missing required fields', async () => {
                const res = await request(app)
                    .put(`/api/users/${loggedInUser.id}`)
                    .send({})
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(400);
            });

            it('responds with 200 and expected data if valid request', async () => {
                const user = {
                    email: 'email@example.com',
                    firstName: 'Email',
                    lastName: 'Example'
                };

                const res = await request(app)
                    .put(`/api/users/${loggedInUser.id}`)
                    .send(user)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);

                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.email).to.equal(user.email);
                expect(res.body.firstName).to.equal(user.firstName);
                expect(res.body.lastName).to.equal(user.lastName);
            });
        });

        describe('DELETE /api/users/:user_id', () => {

            it('responds with 404 if no user found', async () => {
                const id = mongoose.Types.ObjectId();
    
                const res = await request(app)
                    .delete(`/api/users/${id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(404);
            });

            it('responds with 401 if :user_id does not match JWT user', async () => {
                const res = await request(app)
                    .delete(`/api/users/${protectedUser.id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(401);
            });

            it('responds with 200 and expected data if valid request', async () => {
                const res = await request(app)
                    .delete(`/api/users/${loggedInUser.id}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
    
                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.email).to.equal(loggedInUser.email);
                expect(res.body.firstName).to.equal(loggedInUser.firstName);
                expect(res.body.lastName).to.equal(loggedInUser.lastName);
            });
        });

        describe('POST /api/lists', () => {

            it('responds with 400 if missing required fields', async () => {
                const res = await request(app)
                    .post('/api/lists')
                    .send({})
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);

                expect(res.status, 'sends correct status').to.equal(400);
            });

            it('responds with 200 and expected data if valid request', async () => {
                const title = 'List title';

                const res = await request(app)
                    .post('/api/lists')
                    .send({ title })
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);

                expect(res.status, 'sends correct status').to.equal(200);
                expect(res.body.title, 'sets title').to.equal(title);
                expect(res.body.created_by, 'sets created_by').to.equal(loggedInUser.id);
            });
        });

        describe('GET /api/lists', () => {

            it('returns 200 and expected data if valid request', async () => {
                
                // save a list to the database
                const userList = new List({
                    title: 'userList',
                    created_by: loggedInUser.id
                });
                await userList.save();

                // save a list for a different user
                const protectedList = new List({
                    title: 'protectedList',
                    created_by: protectedUser.id
                });
                await protectedList.save();

                const res = await request(app)
                    .get('/api/lists')
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);

                expect(res.status).to.equal(200);
                expect(res.body.lists, 'sets lists').to.have.lengthOf(1);
                expect(res.body.sharedLists, 'sets sharedLists').to.have.lengthOf(0);

                const list = res.body.lists[0];
                expect(list.title).to.equal(userList.title);
                expect(list.created_by).to.equal(loggedInUser.id);
            });
        });
    });
});