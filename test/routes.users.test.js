const jwt = require('jsonwebtoken');

const app = require('../server.js');
const config = require('../server/configuration.js');
const helpers = require('./helpers.js');
const fixtures = require('./fixtures.js');

const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');

const User = require('../server/models/User.js');

const ObjectId = require('mongoose').Types.ObjectId;

let sandbox;

describe('API users', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        sandbox.restore();
        await User.deleteMany({});
    });

    describe('POST /api/users', function () {

        function createRequest (user) {
            return request(app)
                .post('/api/users')
                .send(user);
        }
    
        it('responds with 400 if missing required fields', async () => {
            const res = await createRequest();

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(400);
        });

        it('responds with 500 if duplicate user', async () => {
            const { user } = await helpers.createUser();

            const res = await createRequest(user);

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text.indexOf('duplicate key error index') > -1, 'sends expected text').to.be.true;
        });

        it('responds with 201 and expected data if valid request', async () => {
            const user = fixtures.getRandomUser();

            const res = await createRequest(user);

            expect(res.ok).to.be.true;
            expect(res.status, 'sends expected status').to.equal(201);
            expect(res.headers['set-cookie'][0], 'sends valid JWT cookie').to.be.a('string');
            expect(res.body.xsrfToken, 'sends xsrfToken').to.be.a('string');

            // sets user
            const savedUser = res.body.user;
            expect(savedUser.email, 'sets email').to.equal(user.email.toLowerCase().trim());
            expect(savedUser.firstName, 'sets firstName').to.equal(user.firstName.trim());
            expect(savedUser.lastName, 'sets lastName').to.equal(user.lastName.trim());
            expect(savedUser.password, 'removes password').to.be.undefined;

            const decoded = jwt.verify(res.body.token, config.SECRET_KEY);
            expect(decoded.xsrfToken, 'sets xsrfToken in JWT').to.equal(res.body.xsrfToken);
        });
    });

    describe('GET /api/users/:user_id', function () {

        function createRequest (data) {
            return request(app)
                .get(`/api/users/${data.id}`)
                .set('Cookie', [data.cookie])
                .set('Listr-CSRF-Token', data.token);
        }

        it('responds with 401 if not an authorized user', async () => {
            const { cookie, token } = await helpers.logInUser();

            const res = await createRequest({
                id: ObjectId(),
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(401);
        });

        it('responds with 500 if DB find error', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            sandbox.stub(User, 'findById').callsFake((query, cb) => {
                expect(query, 'receives expected ID').to.equal(modelUser.id);
                cb('500', null);
            });

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });
    
        it('responds with 404 if no user found', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            await User.deleteMany({});

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 200 and expected data if valid request', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.true;
            expect(res.status, 'sends expected status').to.equal(200);

            // sends user
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

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(400);
        });

        it('responds with 401 if not an authorized user', async () => {
            const { modelUser, user } = await helpers.createUser();
            const uniqueUser = fixtures.getUniqueUser(user.email);
            const { cookie, token } = await helpers.logInUser(uniqueUser);

            const res = await createRequest({
                id: modelUser.id,
                body: user,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
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

            expect(res.ok).to.be.false;
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

            expect(res.ok).to.be.false;
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

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(500);
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

            expect(res.ok).to.be.true;
            expect(res.status, 'sends expected status').to.equal(200);

            // sends user
            expect(res.body.email).to.equal(user.email.toLowerCase().trim());
            expect(res.body.firstName).to.equal(user.firstName.trim());
            expect(res.body.lastName).to.equal(user.lastName.trim());
        });
    });

    describe('DELETE /api/users/:user_id', () => {

        function createRequest (data) {
            return request(app)
                .delete(`/api/users/${data.id}`)
                .set('Cookie', [data.cookie])
                .set('Listr-CSRF-Token', data.token);
        }

        it('responds with 401 if not an authorized user', async () => {
            const { cookie, token } = await helpers.logInUser();

            const res = await createRequest({
                id: ObjectId(),
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(401);
        });

        it('responds with 500 if DB find error', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            sandbox.stub(User, 'findById').callsFake((userId, cb) => {
                expect(userId).to.equal(modelUser.id);
                cb('500', null);
            });

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 404 if no user found', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            await User.deleteMany({});

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 500 if DB remove error', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            sandbox.stub(User.prototype, 'remove').callsFake((cb) => {
                cb('500', null);
            });

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.false;
            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 200 and expected data if valid request', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            const res = await createRequest({
                id: modelUser.id,
                cookie,
                token
            });

            expect(res.ok).to.be.true;
            expect(res.status, 'sends expected status').to.equal(200);

            // sends deleted user
            expect(res.body.email).to.equal(modelUser.email);
            expect(res.body.firstName).to.equal(modelUser.firstName);
            expect(res.body.lastName).to.equal(modelUser.lastName);
        });
    });
});