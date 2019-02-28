const jwt = require('jsonwebtoken');

const app = require('../server.js');
const config = require('../server/configuration.js');
const helpers = require('./helpers.js');
const fixtures = require('./fixtures.js');

const expect = require('chai').expect;
const mongoose = require('mongoose');
const request = require('supertest');
const sinon = require('sinon');

const User = require('../server/models/User.js');

const ObjectId = mongoose.Types.ObjectId;

let sandbox;

describe('API users', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        sandbox.restore();
        await User.deleteMany({});
    });

    describe('POST /api/users', () => {  
    
        it('responds with 400 if missing required fields', async () => {
            const res = await request(app)
                .post('/api/users');

            expect(res.status, 'sends expected status').to.equal(400);
        });

        it('responds with 500 if duplicate user', async () => {
            const { user } = await helpers.createUser();

            const res = await request(app)
                .post('/api/users')
                .send(user);

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text.indexOf('duplicate key error index') > -1, 'sends expected text').to.be.true;
        });

        it('responds with 201 and expected data if valid request', async () => {
            const user = fixtures.getRandomUser();

            const res = await request(app)
                .post('/api/users')
                .send(user);

            expect(res.status, 'sends expected status').to.equal(201);
            expect(res.headers['set-cookie'][0], 'sends valid JWT cookie').to.be.a('string');
            expect(res.body.xsrfToken, 'sends xsrfToken').to.be.a('string');

            // sets user
            const savedUser = res.body.user;
            expect(savedUser.email, 'sets email').to.equal(user.email.toLowerCase().trim());
            expect(savedUser.firstName, 'sets firstName').to.equal(user.firstName.trim());
            expect(savedUser.lastName, 'sets lastName').to.equal(user.lastName.trim());
            expect(savedUser.password, 'removes password').to.be.undefined;

            // adds CSRF key to JWT
            const decoded = jwt.verify(res.body.token, config.SECRET_KEY);
            expect(decoded.xsrfToken, 'sets xsrfToken in JWT').to.equal(res.body.xsrfToken);
        });
    });

    describe('GET /api/users/:user_id', () => {

        it('responds with 500 if DB find error', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            sandbox.stub(User, 'findById').callsFake((id, cb) => {
                expect(id).to.equal(modelUser.id);
                cb('500', false);
            });

            const res = await request(app)
                .get(`/api/users/${modelUser.id}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });
    
        it('responds with 404 if no user found', async () => {
            const { cookie, token } = await helpers.logInUser();

            const res = await request(app)
                .get(`/api/users/${ObjectId()}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 200 and expected data if valid request', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            const res = await request(app)
                .get(`/api/users/${modelUser.id}`)
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status, 'sends expected status').to.equal(200);
            expect(res.body.email).to.equal(modelUser.email);
            expect(res.body.firstName).to.equal(modelUser.firstName);
            expect(res.body.lastName).to.equal(modelUser.lastName);
            expect(res.body.password, 'does not send password').to.be.undefined;
        });
    });

    describe('PUT /api/users/:user_id', () => {

        function createRequest (data) {
            return request(app)
                .put(`/api/users/${data.id}`)
                .send(data.body)
                .set('Cookie', [data.cookie])
                .set('Listr-CSRF-Token', data.token);
        }

        it('responds with 400 if missing required fields', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.status, 'sends expected status').to.equal(400);
        });

        it('responds with 401 if not an authorized user', async () => {
            const protectedUser = await helpers.createUser();
            const uniqueUser = fixtures.getUniqueUser(protectedUser.user.email);
            const { cookie, token } = await helpers.logInUser(uniqueUser);

            const res = await createRequest({
                id: protectedUser.modelUser.id,
                body: protectedUser.user,
                cookie,
                token
            });

            expect(res.status, 'sends expected status').to.equal(401);
        });

        it('responds with 500 if DB find error', async () => {
            const { cookie, modelUser, token, user } = await helpers.logInUser();

            sandbox.stub(User, 'findById').callsFake((userId, cb) => {
                expect(userId).to.equal(modelUser.id);
                cb('500', null);
            });

            const res = await createRequest({
                id: modelUser.id,
                body: user,
                cookie,
                token
            });

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 404 if no user found', async () => {
            const { cookie, modelUser, token, user } = await helpers.logInUser();

            await User.deleteMany({});

            const res = await createRequest({
                id: modelUser.id,
                body: user,
                cookie,
                token
            });

            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 500 if DB save error', async () => {
            const { cookie, modelUser, token, user } = await helpers.logInUser();

            sandbox.stub(User.prototype, 'save').callsFake((cb) => {
                cb('500', null);
            });

            const res = await createRequest({
                id: modelUser.id,
                body: user,
                cookie,
                token
            });

            expect(res.status, 'sends expectd status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 200 and expected data if valid request', async () => {
            const { cookie, modelUser, token, user } = await helpers.logInUser();

            const res = await createRequest({
                id: modelUser.id,
                body: user,
                cookie,
                token
            });

            expect(res.status, 'sends expected status').to.equal(200);
            expect(res.body.email).to.equal(user.email.toLowerCase().trim());
            expect(res.body.firstName).to.equal(user.firstName.trim());
            expect(res.body.lastName).to.equal(user.lastName.trim());
        });
    });

    describe('DELETE /api/users/:user_id', () => {

        it('responds with 404 if no user found', async () => {
            const id = ObjectId();

            const res = await request(app)
                .delete(`/api/users/${id}`)
                .set('Cookie', [loggedInUser.cookie])
                .set('Listr-CSRF-Token', loggedInUser.token);

            expect(res.status, 'sends correct status').to.equal(404);
        });

        it('responds with 401 if not an authorized user', async () => {
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
});