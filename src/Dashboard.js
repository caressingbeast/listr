import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

class Dashboard extends Component {

    constructor (props) {
        super(props);

        this.state = {
            lists: [],
            showForm: false,
            title: '',
            user: null
        };
    }

    componentDidMount () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: AuthService.getToken()
        });

        fetch('/api/users', opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ lists: json.lists, user: json.user });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    render () {
        const state = this.state;
        const user = state.user;

        if (!user) {
            return null;
        }

        const lists = state.lists;

        return (
            <div className="Dashboard">
                <h1>My Lists</h1>
                <ul>
                    {lists.map((l, i) => {
                        let completed = l.items.filter((item) => {
                            return item.completed;
                        }).length;
                        let total = l.items.length;

                        let title = `${l.title}: ${completed} completed / ${total} total`;

                        return (
                            <li key={l._id} title={title}><Link to={`/lists/${l._id}`}>{l.title} ({total})</Link></li>
                        );
                    })}
                </ul>
                {!state.showForm && <button onClick={() => this.setState({ showForm: true })}>Create list</button>}
                {state.showForm && 
                    <form onSubmit={(e) => this.createList(e)}>
                        <input type="text" placeholder="Enter a title for your list" value={state.title} onChange={(e) => this.handleInputChange(e)} />
                        <button type="submit">Save</button>
                        <button onClick={() => this.setState({ showForm: false, title: '' })}>Cancel</button>
                    </form>
                }
            </div>
        );
    }

    createList (e) {
        e.preventDefault();

        let state = this.state;

        if (!state.title) {
            return false;
        }

        const opts = ApiHelper.generateOpts({
            body: { title: state.title },
            credentials: true,
            token: AuthService.getToken()
        });

        fetch('/api/lists', opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            let lists = state.lists;

            lists.push(json);

            this.setState({ lists, showForm: false });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    handleInputChange (e) {
        this.setState({ title: e.target.value });
    }
}

export default Dashboard;