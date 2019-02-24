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
            credentials: 'include',
            headers: {
                'Authorization': localStorage.getItem('jwt'),
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status !== 200) {
                return this.props.history.push('/login');
            }

            return res.json();
        }).then((json) => {
            this.setState({ firstName: (json.firstName || 'stranger') });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    render () {
        return (
            <div className="Dashboard">
                <h1>Welcome, {this.state.firstName}!</h1>
            </div>
        );
    }
}

export default Dashboard;