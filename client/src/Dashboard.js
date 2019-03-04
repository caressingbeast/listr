import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import ApiService from './services/api';

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
        const listData = await ApiService.fetchLists();
        const user = await ApiService.fetchUser();

        if (listData && user) {
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

        if (!lists || !sharedLists) {
            return null;
        }

        return (
            <div className="Dashboard">
                <h1>{user.firstName ? `${user.firstName}'s Lists` : 'My Lists'}</h1>
                {lists.length === 0 && <p>You currently have no lists. Click <strong>Create list</strong> below to add one.</p>}
                {lists.length > 0 && 
                    <ul className="list-container lists">
                        {lists.map((l, i) => {
                            return (
                                <li key={l._id}>
                                    <Link to={`/lists/${l._id}`}>
                                        <span>{l.title} ({l.items.length})</span>
                                        {l.sharedUsers.length > 0 && <small className="button neutral small pull-right">shared</small>}
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
                        <ul className="list-container sharedLists">
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

    async createList (e) {
        e.preventDefault();

        let state = this.state;
        let title = state.title.trim();

        if (!title) {
            return this.setState({ error: true });
        }

        const res = await ApiService.createList(title);

        console.log(res);

        if (res) {
            let lists = state.lists;
            lists.push(res);
            this.setState({ lists, showForm: false });
        }
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