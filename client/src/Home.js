import React, { Component } from 'react';

import './Home.css';

class Home extends Component {

    render () {
        return (
            <div className="Home">
                <h1>Listr</h1>
                <p><a href="/login">Login</a> or <a href="/register">register</a> to get started today.</p>
            </div>
        );
    }
}

export default Home;