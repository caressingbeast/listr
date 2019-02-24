import React, { Component } from 'react';

class Login extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            password: ''
        };
    }

    componentWillMount () {
        if (localStorage.getItem('jwt')) {
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

    onSubmit (event) {
        event.preventDefault();

        fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status === 200) {
                this.props.history.push('/dashboard');
                return res.json();
            }
        }).then((json) => {
            localStorage.setItem('jwt', json.token);
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }
}

export default Login;