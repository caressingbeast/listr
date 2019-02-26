import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Dashboard from './Dashboard';
import Home from './Home';
import List from './List';
import Login from './Login';
import Nav from './Nav';
import Profile from './Profile';
import Register from './Register';

import PrivateRoute from './PrivateRoute';

import './App.css';

class App extends Component {

    render () {
        return (
            <Router>
                <div className="App">
                    <Nav />

                    <Route path="/" exact component={Home} />
                    <Route path="/login" component={Login} />
                    <Route path="/register" component={Register} />

                    <Route path="/dashboard" component={PrivateRoute(Dashboard)} />
                    <Route path="/lists/:list_id" component={PrivateRoute(List)} />
                    <Route path="/profile" component={PrivateRoute(Profile)} />

                    <div className="Footer">
                        <small>made by <a href="https://github.com/caressingbeast/listr" rel="nofollow">caressingbeast</a></small>
                    </div>
                </div>
            </Router>
        );
    }
}

export default App;
