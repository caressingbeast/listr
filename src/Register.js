import React, { Component } from 'react';

class Register extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            password: ''
        };
    }

    render () {
        return (
            <div className="register">
                <form onSubmit={(e) => this.onSubmit(e)}>
                    <h1>Register</h1>
                    <input type="email" name="email" placeholder="Email address" value={this.state.email} onChange={(e) => this.handleInputChange(e)} required />
                    <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={(e) => this.handleInputChange(e)} required />
                    <button type="submit">Register</button>
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

        fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status === 200) {
                return this.props.history.push('/');
            }

            throw new Error(res.error);
        }).catch((err) => {
            console.error(err);
        });
    }
}

export default Register;