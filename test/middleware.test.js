const jwt = require('jsonwebtoken');

const config = require('../server/configuration.js');
const secret = config.SECRET_KEY;
const withAuth = require('../server/middleware.js');

const expect = require('chai').expect;
const sinon = require('sinon');

let sandbox;

function getRes (expected) {
    return {
        status: (code) => {
            return {
                send: (text) => {
                    expect(code, 'sends correct code').to.equal(expected.code);
                    expect(text, 'sends expected text').to.equal(expected.text);
                }
            };
        }
    };
}

describe.only('withAuth middleware', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns correct status if no token', () => {
        const callback = sandbox.stub();

        let req = {
            cookies: {},
            headers: {}
        };

        const res = getRes({
            code: 401,
            text: 'Unauthorized: no token'
        });

        withAuth(req, res, callback);

        expect(callback.called, 'does not invoke callback').to.be.false;
    });

    it('returns correct status if no custom header', () => {
        const callback = sandbox.stub();

        let req = {
            cookies: {
                jwt: 'jwt'
            },
            headers: {}
        };

        const res = getRes({
            code: 401,
            text: 'Unauthorized: no xsrfToken'
        });

        withAuth(req, res, callback);

        expect(callback.called, 'does not invoke callback').to.be.false;
    });

    it('returns 500 if verify error', () => {
        const callback = sandbox.stub();

        let req = {
            cookies: {
                jwt: 'jwt'
            },
            headers: {
                'listr-csrf-token': 'token'
            }
        };

        const res = getRes({
            code: 500,
            text: '500'
        });

        sandbox.stub(jwt, 'verify').callsFake((token, tokenSecret, cb) => {
            expect(token).to.equal(req.cookies.jwt);
            expect(tokenSecret).to.equal(config.SECRET_KEY);
            cb('500', false);
        });

        withAuth(req, res, callback);

        expect(callback.called, 'does not invoke callback').to.be.false;
    });

    it('returns 401 if tokens don\'t match', () => {
        let callback = sandbox.stub();

        let req = {
            cookies: {
                jwt: 'jwt'
            },
            headers: {
                'listr-csrf-token': 'token'
            }
        };

        const res = getRes({
            code: 401,
            text: 'Unauthorized: invalid xsrfToken'
        });

        sandbox.stub(jwt, 'verify').callsFake((token, tokenSecret, cb) => {
            expect(token).to.equal(req.cookies.jwt);
            expect(tokenSecret).to.equal(config.SECRET_KEY);
            cb(false, {
                xsrfToken: 'xsrfToken'
            });
        });

        withAuth(req, res, callback);

        expect(callback.called, 'does not invoke callback').to.be.false;
    });

    it('adds userId to req and invokes callback if successful', () => {
        const callback = sandbox.stub();
        const id = '1234567890';
        const res = getRes();

        let req = {
            cookies: {
                jwt: 'jwt'
            },
            headers: {
                'listr-csrf-token': 'token'
            }
        };

        sandbox.stub(jwt, 'verify').callsFake((token, tokenSecret, cb) => {
            expect(token).to.equal(req.cookies.jwt);
            expect(tokenSecret).to.equal(config.SECRET_KEY);
            cb(false, {
                sub: id,
                xsrfToken: 'token'
            });
        });

        withAuth(req, res, callback);

        expect(req.userId, 'adds userId').to.equal(id);
        expect(callback.called, 'invokes callback').to.be.true;
    });
});