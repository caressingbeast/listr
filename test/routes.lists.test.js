const app = require('../server.js');
const helpers = require('./helpers.js');
const fixtures = require('./fixtures.js');

const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');

const ObjectId = require('mongoose').Types.ObjectId;

const List = require('../server/models/List.js');
const User = require('../server/models/User.js');

let loggedInUser;
let loggedInUserList;
let sandbox;

describe('API lists', () => {

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        loggedInUser = await helpers.logInUser();

        const title = 'loggedInUserList.title';

        // create a list for the logged in user
        loggedInUserList = new List({
            createdBy: loggedInUser.modelUser.id,
            title
        });
        await loggedInUserList.save();
    });

    afterEach(async () => {
        sandbox.restore();
        await List.deleteMany({});
        await User.deleteMany({});
    });

    describe('POST /api/lists', function () {

        function createRequest (body) {
            return request(app)
                .post('/api/lists')
                .send(body)
                .set('Cookie', [loggedInUser.cookie])
                .set('Listr-CSRF-Token', loggedInUser.token);
        }

        it('responds with 400 if missing required fields', async () => {
            const res = await createRequest({});

            expect(res.status, 'sends expected status').to.equal(400);
        });

        it('responds with 500 if DB save error', async () => {
            sandbox.stub(List.prototype, 'save').callsFake((cb) => {
                cb('500', null);
            });

            const res = await createRequest({ title: 'title' });

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 201 and expected data if valid request', async () => {
            const title = 'title   ';

            const res = await createRequest({ title });

            expect(res.status, 'sends expected status').to.equal(201);
            expect(res.body.title, 'sets title').to.equal(title.trim());
            expect(res.body.createdBy, 'sets createdBy').to.equal(loggedInUser.modelUser.id);
        });
    });

    describe('GET /api/lists', function () {

        function createRequest () {
            return request(app)
                .get('/api/lists')
                .set('Cookie', [loggedInUser.cookie])
                .set('Listr-CSRF-Token', loggedInUser.token);
        }

        it('responds with 500 if DB find error with "lists"', async () => {
            sandbox.stub(List, 'find').callsFake((query, cb) => {
                expect(query.createdBy).to.equal(loggedInUser.modelUser.id);
                cb('500', null);
            });

            const res = await createRequest();

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 500 if DB find error with "sharedLists"', async () => {
            sandbox.stub(List, 'find').callsFake((query, cb) => {
                if (query.hasOwnProperty('sharedUsers')) {
                    return cb('500', 500);
                }

                cb(null, [loggedInUserList]);
            });

            const res = await createRequest();

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 200 and expected data if valid request', async () => {

            // create a new user and some lists for that user
            const user = fixtures.getUniqueUser(loggedInUser.user.email);
            const { modelUser } = await helpers.createUser(user);

            const privateList = new List({
                createdBy: modelUser.id,
                title: 'privateList.title'
            });
            await privateList.save();

            const sharedList = new List({
                createdBy: modelUser.id,
                sharedUsers: [loggedInUser.modelUser.id],
                title: 'sharedList.title'
            });
            await sharedList.save();

            const res = await createRequest();

            expect(res.status, 'sends expected status').to.equal(200);
            expect(res.body.lists, 'sends lists').to.have.lengthOf(1);
            expect(res.body.sharedLists, 'sends sharedLists').to.have.lengthOf(1);

            // sends expected list
            const userList = res.body.lists[0];
            expect(userList._id).to.equal(loggedInUserList.id);
            expect(userList.title).to.equal(loggedInUserList.title);
            expect(userList.createdBy).to.equal(loggedInUser.modelUser.id);

            // sends expected shared list
            const userSharedList = res.body.sharedLists[0];
            expect(userSharedList._id).to.equal(sharedList.id);
            expect(userSharedList.title).to.equal(sharedList.title);
            expect(userSharedList.createdBy).to.equal(modelUser.id);
        });
    });

    describe('GET /api/lists/:list_id', function () {

        function createRequest (id) {
            return request(app)
                .get(`/api/lists/${id}`)
                .set('Cookie', [loggedInUser.cookie])
                .set('Listr-CSRF-Token', loggedInUser.token);
        }

        it('responds with 404 if no list found', async () => {
            const res = await createRequest(ObjectId());

            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 500 if DB find error', async () => {
            const id = ObjectId().toString();

            sandbox.stub(List, 'findById').callsFake((query) => {
                expect(query, 'receives expected ID').to.equal(id);

                return {
                    populate: (str) => {
                        return {
                            exec: (cb) => {
                                expect(str, 'populates sharedUsers').to.equal('sharedUsers');
                                cb('500', 500);
                            }
                        };
                    }
                };
            });

            const res = await createRequest(id);

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 404 if no list found', async () => {
            const res = await createRequest(ObjectId());

            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 200 and expected data if valid request', async () => {
            const res = await createRequest(loggedInUserList.id);

            expect(res.status, 'sends expected status').to.equal(200);
            expect(res.body.createdBy).to.equal(loggedInUser.modelUser.id);
            expect(res.body.title).to.equal(loggedInUserList.title);
        });
    });

    describe('DELETE /api/lists/:list_id', function () {

        function createRequest (id) {
            return request(app)
                .delete(`/api/lists/${id}`)
                .set('Cookie', [loggedInUser.cookie])
                .set('Listr-CSRF-Token', loggedInUser.token);
        }

        it('responds with 500 if DB find error', async () => {
            const id = ObjectId().toString();

            sandbox.stub(List, 'findById').callsFake((query, cb) => {
                expect(query, 'receives expected ID').to.equal(id);
                cb('500', null);
            });

            const res = await createRequest(id);

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 404 if no list found', async () => {
            const res = await createRequest(ObjectId());

            expect(res.status, 'sends expected status').to.equal(404);
        });

        it('responds with 401 if not an authorized user', async () => {

            // create a new user and list for that user
            const user = fixtures.getUniqueUser(loggedInUser.user.email);
            const { modelUser } = await helpers.createUser(user);

            const privateList = new List({
                createdBy: modelUser.id,
                title: 'privateList.title'
            });
            await privateList.save();

            const res = await createRequest(privateList.id);

            expect(res.status, 'sends expected status').to.equal(401);
        });

        it('responds with 500 if DB remove error', async () => {
            sandbox.stub(List.prototype, 'remove').callsFake((cb) => {
                cb('500', null);
            });

            const res = await createRequest(loggedInUserList.id);

            expect(res.status, 'sends expected status').to.equal(500);
            expect(res.text, 'sends expected text').to.equal('500');
        });

        it('responds with 200 and expected data if valid request', async () => {
            const res = await createRequest(loggedInUserList.id);

            expect(res.status, 'sends expected status').to.equal(200);
            expect(res.body._id).to.equal(loggedInUserList.id);
            expect(res.body.title).to.equal(loggedInUserList.title);
        }); 
    });
    
    describe('items', () => {

        describe('POST /api/lists/:list_id/items', function () {

            function createRequest (data) {
                return request(app)
                    .post(`/api/lists/${data.id}/items`)
                    .send(data.body)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
            }

            it('responds with 400 if missing required fields', async () => {
                const res = await createRequest({
                    id: ObjectId()
                });

                expect(res.status, 'sends expected status').to.equal(400);
            });

            it('responds with 500 if DB find error', async () => {
                const id = ObjectId().toString();

                sandbox.stub(List, 'findById').callsFake((query) => {
                    expect(query, 'receives expected query').to.equal(id);

                    return {
                        populate: (str) => {
                            return {
                                exec: (cb) => {
                                    expect(str, 'populates sharedUsers').to.equal('sharedUsers');
                                    cb('500', null);
                                }
                            };
                        }
                    };
                });

                const res = await createRequest({
                    id,
                    body: { title: 'title' }
                });

                expect(res.status).to.equal(500);
                expect(res.text).to.equal('500');
            });

            it('responds with 404 if no list found', async () => {
                const res = await createRequest({
                    id: ObjectId(),
                    body: { title: 'title' }
                });

                expect(res.status, 'sends expected status').to.equal(404);
            });

            it('responds with 400 if not an authorized user', async () => {
                
                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    title: 'privateList.title'
                });
                await privateList.save();

                const res = await createRequest({
                    id: privateList.id,
                    body: { title: 'title' }
                });

                expect(res.status, 'sends expected status').to.equal(400);
            });

            it('resonds with 500 if DB save error', async () => {
                sandbox.stub(List.prototype, 'save').callsFake((cb) => {
                    cb('500', null);
                });

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { title: 'title' }
                });

                expect(res.status).to.equal(500);
                expect(res.text).to.equal('500');
            });

            it('responds with 201 and expected data if user is creator', async () => {
                const item = {
                    title: 'listItem   '
                };

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: item
                });

                expect(res.status, 'sends expected status').to.equal(201);

                const list = res.body;
                expect(list.items, 'adds item').to.have.lengthOf(1);
                expect(list.items[0].title, 'formats title').to.equal(item.title.trim());
            });

            it('responds with 201 and expected data if user is a shared user', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    sharedUsers: [loggedInUser.modelUser.id],
                    title: 'privateList.title'
                });
                await privateList.save();

                const item = {
                    title: 'listItem   '
                };

                const res = await createRequest({
                    id: privateList.id,
                    body: item
                });

                expect(res.status, 'sends expected status').to.equal(201);

                const list = res.body;
                expect(list.items, 'adds item').to.have.lengthOf(1);
                expect(list.items[0].title, 'formats title').to.equal(item.title.trim());

                // populates sharedUsers
                const sharedUser = list.sharedUsers[0];
                expect(sharedUser.email).to.equal(loggedInUser.modelUser.email);
                expect(sharedUser.firstName).to.equal(loggedInUser.modelUser.firstName);
                expect(sharedUser.lastName).to.equal(loggedInUser.modelUser.lastName);
            });
        });

        describe('PUT /api/lists/:list_id/items/:item_id', function () {

            function createRequest (data) {
                return request(app)
                    .put(`/api/lists/${data.list}/items/${data.item}`)
                    .send(data.body)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
            }

            it('responds with 400 if missing required fields', async () => {
                const res = await createRequest({});

                expect(res.status, 'sends expected status').to.equal(400);
            });

            it('resonds with 500 if find error', async () => {
                const id = ObjectId().toString();

                sandbox.stub(List, 'findById').callsFake((query) => {
                    expect(query, 'receives expected query').to.equal(id);

                    return {
                        populate: (str) => {
                            return {
                                exec: (cb) => {
                                    expect(str, 'populates sharedUsers').to.equal('sharedUsers');
                                    cb('500', null);
                                }
                            };
                        }
                    };
                });

                const res = await createRequest({
                    list: id,
                    item: id,
                    body: { completed: true }
                });

                expect(res.status, 'sends expected status').to.equal(500);
            });

            it('resonds with 404 if no list found', async () => {
                const id = ObjectId();

                const res = await createRequest({
                    list: id,
                    item: id,
                    body: { completed: true }
                });

                expect(res.status, 'sends expected status').to.equal(404);
            });

            it('responds with 401 if not an authorized user', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    title: 'privateList.title'
                });
                await privateList.save();

                const res = await createRequest({
                    list: privateList.id,
                    item: ObjectId(),
                    body: { completed: true }
                });

                expect(res.status, 'sends expected status').to.equal(400);
            });

            it('responds with 404 if no item found', async () => {
                const res = await createRequest({
                    list: loggedInUserList.id,
                    item: ObjectId(),
                    body: { completed: true }
                });

                expect(res.status, 'sends expected status').to.equal(404);
            });

            it('responds with 500 if save error', async () => {

                // save item to database
                loggedInUserList.items.push({
                    completed: true,
                    title: 'title'
                });
                await loggedInUserList.save();

                sandbox.stub(List.prototype, 'save').callsFake((cb) => {
                    cb('500', null);
                });

                const res = await createRequest({
                    list: loggedInUserList.id,
                    item: loggedInUserList.items[0].id,
                    body: { completed: false }
                });

                expect(res.status, 'sends expected status').to.equal(500);
            });

            it('responds with 200 and sends expected data if user is creator', async () => {

                // save item to database
                loggedInUserList.items.push({
                    completed: true,
                    title: 'title'
                });
                await loggedInUserList.save();

                const res = await createRequest({
                    list: loggedInUserList.id,
                    item: loggedInUserList.items[0].id,
                    body: { completed: false }
                });

                expect(res.status, 'sends expected status').to.equal(200);
                expect(res.body.items[0].completed, 'sets "completed"').to.be.false;
            });

            it('responds with 200 and sends expected data if user is a shared user', async () => {
                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    items: [
                        {
                            completed: true,
                            title: 'title'
                        }
                    ],
                    sharedUsers: [loggedInUser.modelUser.id],
                    title: 'privateList.title'
                });
                await privateList.save();

                const res = await createRequest({
                    list: privateList.id,
                    item: privateList.items[0].id,
                    body: { completed: false }
                });

                expect(res.status, 'sends expected status').to.equal(200);
                expect(res.body.items[0].completed, 'sets "completed"').to.be.false;
            });
        });

        describe('DELETE /api/lists/:list_id/items/:item_id', function () {

            function createRequest (data) {
                return request(app)
                    .delete(`/api/lists/${data.list}/items/${data.item}`)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
            }

            beforeEach(async () => {
                loggedInUserList.items.push({
                    completed: false,
                    title: 'title'
                });
                await loggedInUserList.save();
            });

            it('responds with 500 if DB find error', async () => {
                sandbox.stub(List, 'findById').callsFake((query) => {
                    expect(query, 'receives expected query').to.equal(loggedInUserList.id);

                    return {
                        populate: (str) => {
                            return {
                                exec: (cb) => {
                                    expect(str, 'populates sharedUsers').to.equal('sharedUsers');
                                    cb('500', null);
                                }
                            };
                        }
                    };
                });

                const res = await createRequest({
                    list: loggedInUserList.id,
                    item: loggedInUserList.items[0].id
                });

                expect(res.status, 'sends expected status').to.equal(500);
                expect(res.text, 'sends expected text').to.equal('500');
            });

            it('responds with 404 if no list found', async () => {
                const res = await createRequest({
                    list: ObjectId(),
                    items: loggedInUserList.items[0].id
                });

                expect(res.status, 'sends expected status').to.equal(404);
            });

            it('responds with 401 if not an authorized user', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    items: [
                        {
                            completed: false,
                            title: 'title'
                        }
                    ],
                    title: 'privateList.title'
                });
                await privateList.save();

                const res = await createRequest({
                    list: privateList.id,
                    item: privateList.items[0].id
                });

                expect(res.status, 'sends expected status').to.equal(401);
            });

            it('responds with 200 and expected data if valid request', async () => {
                const res = await createRequest({
                    list: loggedInUserList.id,
                    item: loggedInUserList.items[0].id
                });

                expect(res.status, 'sends expected status').to.equal(200);
                expect(res.body.items).to.have.lengthOf(0);
            });
        });
    });

    describe('sharedUsers', () => {

        describe('POST /api/lists/:list_id/shared', function () {

            function createRequest (data) {
                return request(app)
                    .post(`/api/lists/${data.id}/shared`)
                    .send(data.body)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
            }

            it('responds with 400 if missing required fields', async () => {
                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: {}
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(400);
            });

            it('responds with 500 on DB find list error', async () => {
                const id = ObjectId().toString();

                sandbox.stub(List, 'findById').callsFake((query, cb) => {
                    expect(query, 'receives expected query').to.equal(id);
                    cb('500', null);
                });

                const res = await createRequest({
                    id,
                    body: { email: 'EXAMPLE@example.com   ' }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(500);
                expect(res.text, 'sends expected text').to.equal('500');
            });

            it('responds with 404 if no list found', async () => {
                const res = await createRequest({
                    id: ObjectId(),
                    body: { email: 'EXAMPLE@example.com   ' }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(404);
            });

            it('responds with 401 if not an authorized user', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const privateList = new List({
                    createdBy: modelUser.id,
                    title: 'privateList.title'
                });
                await privateList.save();

                const res = await createRequest({
                    id: privateList.id,
                    body: { email: 'EXAMPLE@example.com   ' }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(401);
            });

            it('responds with 500 if DB find user error', async () => {
                const email = 'EXAMPLE@example.com   ';

                sandbox.stub(User, 'findOne').callsFake((query, cb) => {
                    expect(query.email).to.equal(email.toLowerCase().trim());
                    cb('500', null);
                });

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { email }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(500);
                expect(res.text, 'sends expected text').to.equal('500');
            });

            it('responds with 200 if no user found', async () => {
                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { email: 'example@example.com' }
                });

                expect(res.ok).to.be.true;
                expect(res.status, 'sends expected status').to.equal(200);
                expect(res.body._id).to.equal(loggedInUserList.id);
                expect(res.body.title).to.equal(loggedInUserList.title);
            });

            it('responds with 500 if DB save error', async () => {
                
                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                sandbox.stub(List.prototype, 'save').callsFake((cb) => {
                    cb('500', 500);
                });

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { email: modelUser.email }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(500);
                expect(res.text, 'sends expected text').to.equal('500');
            });

            it('responds with 500 if DB populate error', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                sandbox.stub(User, 'populate').callsFake((model, opts, cb) => {
                    expect(model.id).to.equal(loggedInUserList.id);
                    expect(opts).to.deep.equal({ path: 'sharedUsers' });
                    cb('500', null);
                });

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { email: modelUser.email }
                });

                expect(res.ok).to.be.false;
                expect(res.status, 'sends expected status').to.equal(500);
                expect(res.text, 'sends expected text').to.equal('500');
            });

            it('responds with 200 and expected data if valid request', async () => {

                // create a new user and list for that user
                const user = fixtures.getUniqueUser(loggedInUser.user.email);
                const { modelUser } = await helpers.createUser(user);

                const res = await createRequest({
                    id: loggedInUserList.id,
                    body: { email: modelUser.email }
                });

                expect(res.ok).to.be.true;
                expect(res.status, 'sends expected status').to.equal(200);
                expect(res.body.sharedUsers).to.have.lengthOf(1);
                
                // sets shared user
                const sharedUser = res.body.sharedUsers[0];
                expect(sharedUser.email).to.equal(modelUser.email);
                expect(sharedUser.firstName).to.equal(modelUser.firstName);
                expect(sharedUser.lastName).to.equal(modelUser.lastName);
            });
        });

        describe('DELETE /api/lists/:list_id/shared', function () {

            function createRequest (data) {
                return request(app)
                    .post(`/api/lists/${data.id}/shared`)
                    .send(data.body)
                    .set('Cookie', [loggedInUser.cookie])
                    .set('Listr-CSRF-Token', loggedInUser.token);
            }
        });
    });
});