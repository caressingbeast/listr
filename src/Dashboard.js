import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

class Dashboard extends Component {

    constructor (props) {
        super(props);

        this.state = {
            error: false,
            lists: [],
            sharedLists: [],
            showForm: false,
            title: '',
            user: null
        };
    }

    async componentDidMount () {
        const user = await AuthService.fetchUser();

        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: AuthService.getToken()
        });

        const listData = await fetch('/api/lists', opts).then((res) => {
            if (res.ok) {
                return res.json();
            }

            return null;
        });

        if (listData) {
            this.setState({
                lists: listData.lists,
                sharedLists: listData.sharedLists,
                user
            });
        }
    }

    render () {
        const state = this.state;
        const user = state.user;

        if (!user) {
            return null;
        }

        const lists = state.lists;
        const sharedLists = state.sharedLists;

        return (
            <div className="Dashboard">
                <h1>{user.firstName ? `${user.firstName}'s Lists` : 'My Lists'}</h1>
                {lists.length === 0 && <p>You currently have no lists. Click <strong>Create list</strong> below to add one.</p>}
                {lists.length > 0 && 
                    <ul className="list-container">
                        {lists.map((l, i) => {
                            return (
                                <li key={l._id}>
                                    <Link to={`/lists/${l._id}`}>
                                        <span>{l.title} ({l.items.length})</span>
                                        {l.shared_users.length > 0 && <small className="button neutral small pull-right">shared</small>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                }
                {!state.showForm && <button onClick={() => this.setState({ showForm: true })}>Create list</button>}
                {state.showForm && 
                    <form onSubmit={(e) => this.createList(e)}>
                        <fieldset>
                            <legend>Create list</legend>
                            {state.error && 
                                <div className="message message-error">You must enter a title for your list.</div>
                            }
                            <input className="form-input" type="text" placeholder="Enter a title for your list" value={state.title} onChange={(e) => this.handleInputChange(e)} />
                            <button type="submit">Save</button>
                            <button className="caution" onClick={() => this.setState({ error: false, showForm: false, title: '' })}>Cancel</button>
                        </fieldset>
                    </form>
                }
                {sharedLists.length > 0 &&
                    <React.Fragment>
                        <hr />
                        <h2>Shared Lists</h2>
                        <ul className="list-container">
                            {sharedLists.map((l, i) => {
                                return (
                                    <li key={l._id}>
                                        <Link to={`/lists/${l._id}`}>
                                            <span>{l.title} ({l.items.length})</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </React.Fragment>
                }
            </div>
        );
    }

    createList (e) {
        e.preventDefault();

        let state = this.state;

        if (!state.title) {
            this.setState({ error: true });
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
        let formError = this.state.error;
        let title = e.target.value;

        if (formError && title) {
            formError = false;
        }

        this.setState({ error: formError, title });
    }
}

export default Dashboard;