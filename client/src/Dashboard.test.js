import './testSetup';

import React from 'react';
import { Link } from 'react-router-dom';

import Dashboard from './Dashboard';

import ApiService from './services/api';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

let sandbox;

const user = {
    firstName: 'firstName',
    lastName: 'lastName'
};

async function generateComponent (opts) {
    const promise = Promise.resolve(opts.loadData || {});

    let wrapper;

    sandbox.stub(Dashboard.prototype, 'loadData').resolves(opts.loadData || {});

    wrapper = shallow(<Dashboard />);

    await promise;

    wrapper.update();

    return wrapper;
}

describe('Dashboard component', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('render', () => {

        it('renders null if no listData', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    user: {}
                }
            });
    
            expect(wrapper.find('.Dashboard'), 'does not render wrapper').to.have.lengthOf(0);
        });
    
        it('renders null if no user', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [],
                        sharedLists: []
                    }
                }
            });
    
            expect(wrapper.find('.Dashboard'), 'does not render wrapper').to.have.lengthOf(0);
        });
    
        it('renders expected HTML if listData and user', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [],
                        sharedLists: []
                    },
                    user
                }
            });
    
            expect(wrapper.find('.Dashboard'), 'renders wrapper').to.have.lengthOf(1);
            expect(wrapper.find('h1').text(), 'renders heading').to.equal(`${user.firstName}'s Lists`);
            expect(wrapper.find('p'), 'renders empty text').to.have.lengthOf(1);
            expect(wrapper.find('button').text(), 'renders create button').to.equal('Create list');
            expect(wrapper.find('.list-container'), 'does not render lists if empty').to.have.lengthOf(0);
            expect(wrapper.find('form'), 'does not render form').to.have.lengthOf(0);
        });

        it('renders expected HTML if lists', async () => {
            const fakeItem = {
                _id: '123456790',
                items: [],
                sharedUsers: [],
                title: 'title'
            };

            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [fakeItem],
                        sharedLists: []
                    },
                    user
                }
            });

            expect(wrapper.find('p'), 'does not render empty text').to.have.lengthOf(0);
            expect(wrapper.find('.list-container.lists'), 'renders lists if not empty').to.have.lengthOf(1);
            expect(wrapper.find('.list-container.sharedLists'), 'does not render shared lists if empty').to.have.lengthOf(0);

            const listItem = wrapper.find(Link).at(0);
            expect(listItem.props().to).to.equal(`/lists/${fakeItem._id}`);
            expect(listItem.find('span').text()).to.equal(`${fakeItem.title} (0)`);
        });

        it('renders expected HTML if shared lists', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [
                            {
                                _id: '123456790',
                                items: [],
                                sharedUsers: [],
                                title: 'title'
                            }
                        ],
                        sharedLists: [
                            {
                                _id: '123456790',
                                items: [],
                                sharedUsers: [],
                                title: 'title'
                            }
                        ]
                    },
                    user
                }
            });

            expect(wrapper.find('.list-container.lists'), 'renders lists if not empty').to.have.lengthOf(1);
            expect(wrapper.find('.list-container.sharedLists'), 'renders shared lists if not empty').to.have.lengthOf(1);
        });

        it('renders "shared" badge', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [
                            {
                                _id: '123456790',
                                items: [],
                                sharedUsers: [{}],
                                title: 'title'
                            }
                        ],
                        sharedLists: []
                    },
                    user
                }
            });

            expect(wrapper.find('.list-container.lists'), 'renders lists if not empty').to.have.lengthOf(1);
            expect(wrapper.find('.list-container small'), 'renders "shared" badge').to.have.lengthOf(1);
        });

        it('renders form', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [
                            {
                                _id: '123456790',
                                items: [],
                                sharedUsers: [{}],
                                title: 'title'
                            }
                        ],
                        sharedLists: []
                    },
                    user
                }
            });

            wrapper.setState({
                showForm: true
            });

            expect(wrapper.find('form'), 'renders form').to.have.lengthOf(1);
            expect(wrapper.find('legend').text(), 'renders form heading').to.equal('Create list');
            expect(wrapper.find('input'), 'renders input').to.have.lengthOf(1);
            expect(wrapper.find('button[type="submit"]'), 'renders submit button').to.have.lengthOf(1);
            expect(wrapper.find('button.caution'), 'renders "Cancel" button').to.have.lengthOf(1);
        });
    });

    describe('events', () => {

        it('updates "showForm" state on "Create list" button click', async () => {
            const wrapper = await generateComponent({
                loadData: {
                    listData: {
                        lists: [],
                        sharedLists: []
                    },
                    user
                }
            });

            wrapper.find('button').simulate('click');

            expect(wrapper.state().showForm).to.be.true;
        });

        describe('form', () => {

            it('updates state on "Cancel" button click', async () => {
                const wrapper = await generateComponent({
                    loadData: {
                        listData: {
                            lists: [],
                            sharedLists: []
                        },
                        user
                    }
                });

                wrapper.setState({
                    showForm: true,
                    title: 'title'
                });

                wrapper.find('button.caution').simulate('click');

                const state = wrapper.state();
                expect(state.showForm).to.be.false;
                expect(state.title).to.equal('');
            });

            it('invokes createList on form submit', async () => {
                sandbox.stub(Dashboard.prototype, 'createList').resolves();

                const wrapper = await generateComponent({
                    loadData: {
                        listData: {
                            lists: [],
                            sharedLists: []
                        },
                        user
                    }
                });

                wrapper.setState({
                    showForm: true
                });

                wrapper.find('form').simulate('submit');

                expect(Dashboard.prototype.createList.calledOnce).to.be.true;
            });
        });
    });

    describe('methods', () => {
        
        describe('loadData', () => {

            it('invokes ApiService methods', async () => {
                const listData = {
                    lists: [],
                    sharedLists: []
                };

                sandbox.stub(ApiService, 'fetchLists').resolves(listData);
                sandbox.stub(ApiService, 'fetchUser').resolves(user);

                const wrapper = await generateComponent({
                    loadData: {
                        listData: {
                            lists: [],
                            sharedLists: []
                        },
                        user
                    }
                });

                const res = await wrapper.instance().loadData();

                expect(res.listData, 'returns listData').to.deep.equal(listData);
                expect(res.user, 'returns user').to.deep.equal(user);
            });
        });

        describe('createList', () => {

            beforeEach(() => {
                sandbox.stub(ApiService, 'createList').resolves();
            });

            it('updates state if no title', async () => {
                const wrapper = await generateComponent({
                    loadData: {
                        listData: {
                            lists: [],
                            sharedLists: []
                        },
                        user
                    }
                });

                const e = {
                    preventDefault: sandbox.stub()
                };

                await wrapper.instance().createList(e);

                expect(wrapper.state().error).to.be.true;
                expect(ApiService.createList.called).to.be.false;
            });

            it('invokes ApiService.createList if title', async () => {
                const wrapper = await generateComponent({
                    loadData: {
                        listData: {
                            lists: [],
                            sharedLists: []
                        },
                        user
                    }
                });

                wrapper.setState({
                    title: 'title'
                });

                const e = {
                    preventDefault: sandbox.stub()
                };

                const listItem = {
                    _id: '123456790',
                    items: [],
                    sharedUsers: [],
                    title: 'title'
                };

                ApiService.createList.resolves(listItem);

                await wrapper.instance().createList(e);

                const state = wrapper.state();
                expect(state.lists, 'adds list').to.have.lengthOf(1);
                expect(state.showForm, 'hides form').to.be.false;
                expect(state.title, 'clears title').to.equal('');
            });
        });
    });
});