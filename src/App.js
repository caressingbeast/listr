import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import Dashboard from './Dashboard';
import Home from './Home';
import List from './List';
import Login from './Login';
import Register from './Register';

import PrivateRoute from './PrivateRoute';

import './App.css';

class App extends Component {

    render () {
        return (
            <Router>
                <div className="App">
                    {this.renderNav()}

                    <Route path="/" exact component={Home} />
                    <Route path="/login" component={Login} />
                    <Route path="/register" component={Register} />

                    <Route path="/dashboard" component={PrivateRoute(Dashboard)} />
                    <Route path="/lists/:list_id" component={PrivateRoute(List)} />
                </div>
            </Router>
        );
    }

    renderNav () {
        return (
            <ul>
                <li key="home"><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
        );
    }
}

export default App;
