const expect = require('chai').expect;
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const List = require('../server/models/List');

describe('ListSchema', () => {

    it('requires title', (done) => {
        const list = new List({
            createdBy: ObjectId()
        });

        list.validate((err) => {
            const errors = err && err.errors;

            expect(errors.title, 'requires title').to.exist;
            expect(errors.title.kind).to.equal('required');

            done();
        });
    });

    it('requires createdBy', (done) => {
        const list = new List({
            title: 'title'
        });

        list.validate((err) => {
            const errors = err && err.errors;

            expect(errors.createdBy, 'requires createdBy').to.exist;
            expect(errors.createdBy.kind).to.equal('required');

            done();
        });
    });

    it('requires valid createdBy', (done) => {
        const list = new List({
            title: 'title',
            createdBy: 'abc123'
        });

        list.validate((err) => {
            const errors = err && err.errors;

            expect(errors.createdBy, 'requires createdBy').to.exist;
            expect(errors.createdBy.kind).to.equal('ObjectID');

            done();
        });
    });

    it('creates list with valid data', (done) => {
        const data = {
            title: 'title   ',
            createdBy: ObjectId(),
        };

        const list = new List(data);

        list.validate((err) => {
            expect(err).to.be.null;

            expect(list.items).to.have.lengthOf(0);
            expect(list.sharedUsers).to.have.lengthOf(0);
            expect(list.title, 'trims and sets title').to.equal(data.title.trim());
            expect(list.createdAt, 'sets createdAt to Date.now by default').to.not.be.null;
            expect(list.createdBy, 'sets createdBy').to.equal(data.createdBy);

            done();
        });
    });

    it('requires title of items', (done) => {
        const data = {
            items: [
                {
                    completed: false
                }
            ],
            title: 'title   ',
            createdBy: ObjectId()
        };

        const list = new List(data);

        list.validate((err) => {
            const error = err && err.errors && err.errors['items.0.title'];

            expect(error).to.exist;
            expect(error.kind).to.equal('required');

            done();
        });
    });

    it('creates list item with valid data', (done) => {
        const data = {
            items: [
                {
                    title: 'item   '
                }
            ],
            title: 'title',
            createdBy: ObjectId()
        };

        const list = new List(data);

        list.validate((err) => {
            expect(err).to.be.null;

            const item = list.items[0];
            expect(item.completed, 'sets completed').to.be.false;
            expect(item.title, 'trims and sets title').to.equal(data.items[0].title.trim());
            expect(item.createdAt, 'sets createdAt to Date.now by default').to.not.be.null;

            done();
        });
    });

    it('requires valid ObjectId for sharedUsers', (done) => {
        const data = {
            sharedUsers: ['abc123'],
            title: 'title',
            createdBy: ObjectId()
        };

        const list = new List(data);

        list.validate((err) => {
            expect(err.errors.sharedUsers).to.exist;

            done();
        });
    });

    it('saves sharedUsers with valid data', (done) => {
        const data = {
            sharedUsers: [ObjectId()],
            title: 'title',
            createdBy: ObjectId()
        };

        const list = new List(data);

        list.validate((err) => {
            expect(err).to.be.null;
            expect(list.sharedUsers).to.deep.equal(data.sharedUsers);

            done();
        });
    });
});