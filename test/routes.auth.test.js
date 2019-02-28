const app = require('../server.js');
const config = require('../server/configuration.js');
const helpers = require('./helpers.js');
const fixtures = require('./fixtures.js');

const jwt = require('jsonwebtoken');

const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');

const User = require('../server/models/User.js');

let sandbox;

describe('API auth', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        sandbox.restore();
        await User.deleteMany({});
    });

    describe('POST /api/auth/login', () => {

        it('responds with 400 if missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/login');

            expect(res.status, 'sends correct status').to.equal(400);
        });

        it('responds with 500 if find error', async () => {
            const user = fixtures.getRandomUser();

            sandbox.stub(User, 'findOne').returns({
                select: function () {
                    return {
                        exec: function (cb) {
                            return cb('500', null);
                        }
                    };
                }
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(res.status, 'sends correct status').to.equal(500);
        });

        it('responds with 404 if no user found', async () => {
            const user = fixtures.getRandomUser();

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(res.status, 'sends correct status').to.equal(404);
        });

        it('responds with 500 if password verification error', async () => {
            const { user } = await helpers.createUser();

            sandbox.stub(User.prototype, 'isCorrectPassword').callsFake((password, cb) => {
                expect(password, 'receives password').to.equal(user.password);
                cb('500', null);
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(res.status, 'sends correct status').to.equal(500);
        });

        it('responds with 401 if invalid password', async () => {
            const { user } = await helpers.createUser();

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: 'invalid'
                });

            expect(res.status, 'sends correct status').to.equal(401);
        });

        it('responds with 200 and expected data if valid request', async () => {
            const { modelUser, res } = await helpers.logInUser();
            const token = res.body.token;

            expect(res.status, 'sends correct status').to.equal(200);
            expect(res.body.id, 'sends user ID').to.equal(modelUser.id);
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
            const { res } = await helpers.logInUser();

            const cookie = res.headers['set-cookie'][0];

            const logoutRes = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [cookie]);

            expect(logoutRes.status, 'sends correct status').to.equal(200);
            expect(logoutRes.body.token, 'sends null token').to.be.null;
            expect(logoutRes.body.xsrfToken, 'sends null xsrfToken').to.be.null;
            expect(logoutRes.headers['set-cookie'][0], 'clears cookie').to.not.equal(cookie);
        });
    });

    describe('POST /api/auth/verify', () => {
        
        it('responds with 200 and expected data if verified', async () => {
            const { cookie, modelUser, token } = await helpers.logInUser();

            const res = await request(app)
                .post('/api/auth/verify')
                .set('Cookie', [cookie])
                .set('Listr-CSRF-Token', token);

            expect(res.status).to.equal(200);
            expect(res.body.id).to.equal(modelUser.id);
        });
    });
});