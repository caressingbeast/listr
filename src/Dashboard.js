import React, { Component } from 'react';

class Dashboard extends Component {

    constructor (props) {
        super(props);

        this.state = {
            firstName: 'stranger'
        };
    }

    componentWillMount () {
        fetch('/verifyToken', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status !== 200) {
                return this.props.history.push('/login');
            }
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    render () {
        return (
            <div className="Dashboard">
                <h1>Welcome, {this.state.firstName}!</h1>
                <button onClick={() => this.logout()}>Logout</button>
            </div>
        );
    }

    logout () {
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status === 200) {
                this.props.history.push('/login');
            }
        }).catch((err) => {
            window.console && window.console.error(err);
        });   
    }
}

export default Dashboard;