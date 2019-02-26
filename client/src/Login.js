import React, { Component } from 'react';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

class Login extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            password: ''
        };
    }

    componentWillMount () {
        if (AuthService.isLoggedIn()) {
            this.props.history.push('/dashboard');
        }
    }

    render () {
        return (
            <div className="login">
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <fieldset>
                        <legend>Login</legend>
                        <input className="form-input" type="email" name="email" placeholder="Email address" value={this.state.email} onChange={(e) => this.handleInputChange(e)} required></input>
                        <input className="form-input" type="password" name="password" placeholder="Password" value={this.state.password} onChange={(e) => this.handleInputChange(e)} required></input>
                        <button type="submit">Login</button>
                    </fieldset>   
                </form>
            </div>
        );
    }

    handleInputChange (event) {
        const { name, value } = event.target;

        this.setState({
            [name]: value
        });
    }

    onSubmit (e) {
        e.preventDefault();

        const opts = ApiHelper.generateOpts({
            body: this.state,
            credentials: true
        });

        fetch('/api/auth/login', opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            AuthService.setToken(json.xsrfToken);
            AuthService.setUser(json.id);

            const { from } = this.props.location.state || { from: { pathname: '/dashboard' } };

            this.props.history.push(from);
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }
}

export default Login;