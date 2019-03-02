const jwt = require('jsonwebtoken');

const app = require('../server.js');
const config = require('../server/configuration.js');
const helpers = require('./helpers.js');

const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');

const ObjectId = require('mongoose').Types.ObjectId;
const randomId = ObjectId();

const User = require('../server/models/User.js');

let auth;
let sandbox;

const withAuthRoutes = [
    {
        type: 'post',
        url: '/api/auth/verify'
    },
    {
        type: 'get',
        url: `/api/users/${randomId}`
    },
    {
        type: 'put',
        url: `/api/users/${randomId}`
    },
    {
        type: 'delete',
        url: `/api/users/${randomId}`
    },
    {
        type: 'post',
        url: '/api/lists'
    },
    {
        type: 'get',
        url: '/api/lists'
    },
    {
        type: 'get',
        url: `/api/lists/${randomId}`
    },
    {
        type: 'delete',
        url: `/api/lists/${randomId}`
    },
    {
        type: 'post',
        url: `/api/lists/${randomId}/items`
    },
    {
        type: 'put',
        url: `/api/lists/${randomId}/items/${randomId}`
    },
    {
        type: 'delete',
        url: `/api/lists/${randomId}/items/${randomId}`
    },
    {
        type: 'post',
        url: `/api/lists/${randomId}/shared`
    },
    {
        type: 'delete',
        url: `/api/lists/${randomId}/shared`
    }
];

function createRequest (route) {
    const req = request(app);

    switch (route.type) {
        case 'post':
            return req.post(route.url);

        case 'get':
            return req.get(route.url);

        case 'put':
            return req.put(route.url);

        case 'delete': {
            return req.delete(route.url);
        }
    }
}

describe('API authentication middleware', () => {

    before(async () => {
        auth = await helpers.logInUser();
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        sandbox.restore();
        await User.deleteMany({});
    });

    it('responds with 401 if no JWT cookie', async () => {
        const promises = withAuthRoutes.map((route) => {
            return createRequest(route);
        });

        const res = await Promise.all(promises);

        res.forEach((r) => {
            const route = `${r.req.method} ${r.req.path}`;
            expect(r.status, `${route} sends expected status`).to.equal(401);
            expect(r.text, `${route} sends expected text`).to.equal('Unauthorized: no cookie');
        });
    });

    it('responds with 401 if no CSRF header', async () => {
        const promises = withAuthRoutes.map((route) => {
            return createRequest(route).set('Cookie', [auth.cookie]);
        });

        const res = await Promise.all(promises);

        res.forEach((r) => {
            const route = `${r.req.method} ${r.req.path}`;
            expect(r.status, `${route} sends expected status`).to.equal(401);
            expect(r.text, `${route} sends expected text`).to.equal('Unauthorized: no CSRF header');
        });
    });

    it('responds with 500 if JWT token can\'t be verified', async () => {
        sandbox.stub(jwt, 'verify').callsFake((token, secret, cb) => {
            expect(auth.cookie.indexOf(token), 'passes token').to.be.above(-1);
            expect(secret, 'passes secret key').to.equal(config.SECRET_KEY);
            cb('500', null);
        });

        const promises = withAuthRoutes.map((route) => {
            return createRequest(route)
                .set('Cookie', [auth.cookie])
                .set('Listr-CSRF-Token', auth.token);
        });

        const res = await Promise.all(promises);

        res.forEach((r) => {
            const route = `${r.req.method} ${r.req.path}`;
            expect(r.status, `${route} sends expected status`).to.equal(500);
            expect(r.text, `${route} sends expected text`).to.equal('500');
        });
    });

    it('responds with 401 if CSRF keys don\'t match', async () => {
        const token = '1234567890';
                
        const promiseArray = withAuthRoutes.map((c) => {
            return createRequest(c)
                .set('Cookie', [auth.cookie])
                .set('Listr-CSRF-Token', token);
        });

        const res = await Promise.all(promiseArray);

        res.forEach((r) => {
            const route = `${r.req.method} ${r.req.path}`;
            expect(r.status, `${route} sends expected status`).to.equal(401);
            expect(r.text, `${route} sends expected text`).to.equal('Unauthorized: invalid CSRF key');
        });
    });
});