import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

import './Nav.css';

class Nav extends Component {

    render () {

        if (AuthService.isLoggedIn()) {
            return (
                <div className="Nav button-group">
                    <Link className="button" to="/">Home</Link>   
                    <Link className="button" to="/dashboard">Dashboard</Link> 
                    <Link className="button" to="/profile">Profile</Link>
                    <button onClick={() => this.logout()}>Logout</button>
                </div>
            );
        }

        return (
            <div className="Nav button-group">
                <Link className="button" to="/">Home</Link>   
                <Link className="button" to="/login">Login</Link> 
                <Link className="button" to="/register">Register</Link>
            </div>
        );
    }

    logout () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            token: AuthService.getToken()
        });

        fetch('/api/auth/logout', opts).then((res) => {
            if (res.ok) {
                AuthService.clearToken();
                AuthService.clearUser();
                this.props.history.push('/');
            }
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }
}

export default withRouter(Nav);