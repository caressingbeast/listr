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
                    <h1>Login</h1>
                    <input type="email" name="email" placeholder="Email address" value={this.state.email} onChange={(e) => this.handleInputChange(e)} required></input>
                    <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={(e) => this.handleInputChange(e)} required></input>
                    <button type="submit">Login</button>
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
            localStorage.setItem('x_token', json.xsrfToken);
            this.props.history.push('/dashboard');
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }
}

export default Login;