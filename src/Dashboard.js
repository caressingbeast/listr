import React, { Component } from 'react';
import AuthService from './services/auth';
import ApiHelper from './helpers/api';

class Dashboard extends Component {

    constructor (props) {
        super(props);

        this.state = {
            user: null
        };
    }

    componentWillMount () {
        if (!AuthService.isLoggedIn()) {
            return this.props.history.push('/login');
        }

        const opts = {
            url: '/api/user',
            credentials: true,
            headers: {
                'X-CSRF-Token': AuthService.getToken()
            }
        };

        ApiHelper.generateAsync(opts).then((user) => {
            this.setState({ user });
        });
    }

    render () {
        const user = this.state.user;

        if (!user) {
            return null;
        }

        return (
            <div className="Dashboard">
                <p>PROTECTED: Dashboard</p>
                <button onClick={() => this.logout()}>Logout</button>
            </div>
        );
    }

    logout () {
        AuthService.logout().then(() => {
            this.props.history.push('/login');
        });
    }
}

export default Dashboard;