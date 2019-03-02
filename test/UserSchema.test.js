const bcrypt = require('bcrypt');

const expect = require('chai').expect;
const sinon = require('sinon');

const fixtures = require('./fixtures.js');

const User = require('../server/models/User');

let sandbox;

describe('UserSchema', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('requires email, firstName, lastName, password', (done) => {
        const user = new User();

        user.validate((err) => {
            const errors = err.errors;

            expect(errors.email).to.exist;
            expect(errors.email.kind).to.equal('required');
            expect(errors.firstName).to.exist;
            expect(errors.firstName.kind).to.equal('required');
            expect(errors.lastName).to.exist;
            expect(errors.lastName.kind).to.equal('required');
            expect(errors.password).to.exist;
            expect(errors.password.kind).to.equal('required');
            
            done();
        });
    });

    it('saves user with valid data', (done) => {
        const data = fixtures.getRandomUser();
        const user = new User(data);

        user.validate((err) => {
            expect(err).to.be.null;

            expect(user.email, 'lowers, trims, and sets email').to.equal(data.email.toLowerCase().trim());
            expect(user.firstName, 'trims and sets firstname').to.equal(data.firstName.trim());
            expect(user.lastName, 'trims and sets lastName').to.equal(data.lastName.trim());
            expect(user.password).to.equal(data.password);
            done();
        });
    });

    describe('isCorrectPassword', () => {

        it('sends expected response if false', (done) => {
            const data = fixtures.getRandomUser();
            const user = new User(data);

            sandbox.stub(bcrypt, 'compare').callsFake((password, userPassword, cb) => {
                return cb(true, false);
            });
    
            user.isCorrectPassword('password', (err, success) => {
                expect(err, 'sends error').to.be.true;
                expect(success, 'does not send success').to.be.undefined;
    
                done();
            });
        });

        it('sends expected response if true', (done) => {
            const data = fixtures.getRandomUser();
            const user = new User(data);

            sandbox.stub(bcrypt, 'compare').callsFake((password, userPassword, cb) => {
                return cb(false, true);
            });
    
            user.isCorrectPassword('password', (err, success) => {
                expect(err, 'sends null error').to.be.null;
                expect(success, 'sends success').to.be.true;
    
                done();
            });
        });
    });
});