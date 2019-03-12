import React, { Component } from 'react';

import ApiService from './services/api';
import AuthService from './services/auth';

const inputs = [
    { key: 'firstName', placeholder: 'First name', type: 'text' },
    { key: 'lastName', placeholder: 'Last name', type: 'text' },
    { key: 'email', placeholder: 'Email address', type: 'email' },
    { key: 'password', placeholder: 'Password', type: 'password' }
];

class Register extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            error: false,
            firstName: '',
            lastName: '',
            password: ''
        };
    }

    componentWillMount () {
        if (AuthService.isLoggedIn()) {
            this.props.history.push('/dashboard');
        }
    }

    render () {
        const state = this.state;

        return (
            <div className="Register">
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <fieldset>
                        <legend>Register</legend>
                        {state.error &&
                            <div className="message message-error">You must fill out all fields.</div>
                        }
                        {inputs.map((input, i) => {
                            return (
                                <input key={i} className="form-input" type={input.type} name={input.key} placeholder={input.placeholder} value={state[input.key]} onChange={(e) => this.handleInputChange(e)} />
                            );
                        })}
                        <button type="submit">Register</button>
                    </fieldset>
                </form>
            </div>
        );
    }

    handleInputChange (e) {
        const { name, value } = e.target;

        this.setState({
            [name]: value
        });
    }

    onSubmit (e) {
        e.preventDefault();

        const state = this.state;

        const hasEmptyFields = Object.keys(state).filter((key) => {
            return key !== 'error' && !state[key];
        }).length > 0;

        if (hasEmptyFields) {
            return this.setState({ error: true });
        }

        return ApiService.createUser(this.state).then(() => {
            this.props.history.push('/dashboard');
        });
    }
}

export default Register;