const app = require('../server.js');
const config = require('../configuration.js');

const jwt = require('jsonwebtoken');

const chai = require('chai');
const mongoose = require('mongoose');
const request = require('supertest');
const expect = chai.expect;

const List = require('../models/List.js');
const User = require('../models/User.js');

const randomUser = {
    email: 'WYATT.caldwell43@example.com   ',
    firstName: 'Wyatt   ',
    lastName: 'Caldwell   ',
    password: 'password'
};

describe('Listr API integration tests', () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/auth/login', () => {

        it('responds with 400 if missing email or password', async () => {
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
            await user.save(randomUser);

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

        it('responds with 200 and expected data if valid user', async () => {
            
            // save a user to the database first
            const user = new User(randomUser);
            await user.save(randomUser);

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
            await user.save(randomUser);

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

        it('responds with 400 if fields missing', async () => {
            const res = await request(app).post('/api/users')
                .send({});

            expect(res.status, 'sends correct status').to.equal(400);
        });

        it('responds with 500 if duplicate user', async () => {

            // save a user to the database first
            const user = new User(randomUser);
            await user.save(randomUser);

            const res = await request(app)
                .post('/api/users')
                .send(randomUser);

            expect(res.status, 'sends correct status').to.equal(500);
            expect(res.text.indexOf('duplicate key error index'), 'sends expected error').to.be.above(-1);
        });

        it('responds with 201 and expected data if valid user', async () => {
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

    describe('GET /api/users/:user_id', () => {
        let cookie;
        let loggedInUser;
        let token;

        beforeEach(async () => {

            // save a user to the database first
            const user = new User(randomUser);
            await user.save(randomUser);

            loggedInUser = user;

            // log in
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: randomUser.email,
                    password: randomUser.password
                });

            cookie = res.headers['set-cookie'][0];
            token = res.body.xsrfToken;
        });

        it('responds with 401 if no JWT cookie', async () => {
            const res = await request(app)
                .get(`/api/users/${loggedInUser.id}`)
                .set('Listr-CSRF-Token', token);

            expect(res.status).to.equal(401);
        });

        it('responds with 401 if no CSRF token', async () => {
            const res = await request(app)
                .get(`/api/users/${loggedInUser.id}`)
                .set('Cookie', [cookie]);

            expect(res.status, 'sends correct status').to.equal(401);
        });

        it('responds with 401 if JWT and CSRF don\'t match', async () => {
            const res = await request(app)
                .get(`/api/users/${loggedInUser.id}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', '1234567890');

            expect(res.status, 'sends correct status').to.equal(401);
        });

        it('responds with 404 if no user found', async () => {
            const id = mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/api/users/${id}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status, 'sends correct status').to.equal(404);
        });

        it('responds with 200 and expected data if valid user', async () => {
            const res = await request(app)
                .get(`/api/users/${loggedInUser.id}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status, 'sends correct status').to.equal(200);
            expect(res.body.email).to.equal(loggedInUser.email);
            expect(res.body.firstName).to.equal(loggedInUser.firstName);
            expect(res.body.lastName).to.equal(loggedInUser.lastName);
            expect(res.body.password, 'removes password').to.be.undefined;
        });
    });

    describe('PUT /api/users/:user_id', () => {

    });
});