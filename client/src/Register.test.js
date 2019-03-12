import './testSetup';

import React from 'react';

import Register from './Register';

import ApiService from './services/api';
import AuthService from './services/auth';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

let sandbox;

describe('Register component', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        sandbox.stub(AuthService, 'isLoggedIn').returns(false);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('renders expected HTML for not authenticated user', () => {
        const wrapper = shallow(<Register />);

        expect(wrapper.find('.Register')).to.have.lengthOf(1);
        expect(wrapper.find('form')).to.have.lengthOf(1);
        expect(wrapper.find('legend').text()).to.equal('Register');
        expect(wrapper.find('input[type="text"]')).to.have.lengthOf(2);
        expect(wrapper.find('input[type="email"]')).to.have.lengthOf(1);
        expect(wrapper.find('input[type="password"]')).to.have.lengthOf(1);
        expect(wrapper.find('button[type="submit"]')).to.have.lengthOf(1);
    });

    it('pushes "/dashboard" to history for authenticated user', () => {
        const history = {
            push: (str) => {
                expect(str).to.equal('/dashboard');
            }
        };

        AuthService.isLoggedIn.returns(true);

        shallow(<Register history={history} />);
    });

    it('invokes handleInputChange on input change', () => {
        const handleInputChange = sandbox.stub(Register.prototype, 'handleInputChange');
        const e = { target: { name: 'name', value: 'value' } };
        
        const wrapper = shallow(<Register />);

        const inputs = wrapper.find('input');

        inputs.forEach((i) => {
            i.simulate('change', e);
        });

        expect(handleInputChange.callCount).to.equal(4);
    });

    it('invokes onSubmit on form submit', () => {
        const onSubmit = sandbox.stub(Register.prototype, 'onSubmit');
        
        const wrapper = shallow(<Register />);

        wrapper.find('form').simulate('submit');

        expect(onSubmit.calledOnce).to.be.true;
    });

    describe('handleInputChange', () => {

        it('updates state with value in input', () => {
            const e = {
                target: {
                    name: 'firstName',
                    value: 'Example'
                }
            };

            const wrapper = shallow(<Register />);
            const instance = wrapper.instance();

            instance.handleInputChange(e);

            expect(wrapper.state().firstName).to.equal(e.target.value);
        });
    });

    describe('onSubmit', () => {

        beforeEach(() => {
            sandbox.stub(ApiService, 'createUser').resolves();
        });

        it('updates state if empty fields', async () => {
            const e = {
                preventDefault: sandbox.stub()
            };

            const wrapper = shallow(<Register />);
            const instance = wrapper.instance();

            await instance.onSubmit(e);

            expect(wrapper.state().error).to.be.true;
            expect(ApiService.createUser.called).to.be.false;
        });

        it('invokes ApiService.createUser if no empty fields', async () => {
            const e = {
                preventDefault: sandbox.stub()
            };

            const history = {
                push: (str) => {
                    expect(str).to.equal('/dashboard');
                }
            };

            const wrapper = shallow(<Register history={history} />);
            const instance = wrapper.instance();

            wrapper.setState({
                email: 'email',
                firstName: 'firstName',
                lastName: 'lastName',
                password: 'password'
            });

            await instance.onSubmit(e);
            
            expect(ApiService.createUser.calledWith(wrapper.state())).to.be.true;
        });
    });
});