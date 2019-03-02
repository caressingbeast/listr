const app = require('../server.js');
const fixtures = require('./fixtures.js');

const request = require('supertest');

const User = require('../server/models/User.js');

const createUser = async function (data) {
    const user = data || fixtures.getRandomUser();
    const modelUser = new User(user);
    
    await modelUser.save();
    
    return {
        modelUser,
        user // original password intact
    };
};

const logInUser = async function (data) {
    const { modelUser, user } = await createUser(data);
    const res = await request(app)
        .post('/api/auth/login')
        .send({
            email: user.email,
            password: user.password
        });

    return {
        cookie: res.headers['set-cookie'][0],
        modelUser,
        res,
        token: res.body.xsrfToken,
        user
    };
};

module.exports = {
    createUser,
    logInUser
};