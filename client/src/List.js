import React, { Component } from 'react';

import ApiHelper from './helpers/api';
import Utils from './helpers/utils';
import AuthService from './services/auth';

class List extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            error: false,
            isAdmin: false,
            list: null,
            showAddForm: false,
            showShareForm: false,
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

        const list = await fetch(`/api/lists/${this.props.match.params.list_id}`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }

            this.props.history.push('/dashboard');

            return null;
        });

        if (list) {
            this.setState({ isAdmin: list.created_by === user._id, list, user });
        }
    }

    render () {
        const state = this.state;
        const list = state.list;

        if (!list) {
            return null;
        }

        return (
            <div className="List">
                <h1>{list.title} <small className="text-muted">({Utils.pluralize(list.items.length, 'item')})</small></h1>
                {state.isAdmin && list.shared_users.length > 0 &&
                    <ul className="list-inline list-unstyled">
                        {list.shared_users.map((u, i) => {
                            return (
                                <li key={u._id}>
                                    <span className="buttn neutral small">{u.firstName} {u.lastName} <button className="link" onClick={() => this.unshareList(u)}>(delete)</button></span>
                                </li>
                            );
                        })}
                    </ul>
                }
                {list.items.length === 0 && <p>You currently have no items. Click <strong>Add item</strong> below to add one.</p>}
                {list.items.length > 0 && 
                    <ul className="list-container">
                        {list.items.map((item, i) => {
                            return (
                                <li key={i} >
                                    <span><input type="checkbox" checked={item.completed} onChange={() => this.toggleCompleted(item)} /></span>
                                    <span className={`completed-${item.completed.toString()}`}>{item.title}</span>
                                    <button className="small warning" onClick={() => this.deleteItem(item._id)}>delete</button>
                                </li>
                            );
                        })}
                    </ul>
                }
                {!state.showAddForm && !state.showShareForm && 
                    <div className="button-container">
                        <button onClick={() => this.setState({ showAddForm: true })}>Add item</button>
                        {state.isAdmin && 
                            <React.Fragment>
                                <button className="outlined" onClick={() => this.setState({ showShareForm: true })}>Share list</button>
                                <button className="warning pull-right" onClick={() => this.deleteList()}>Delete list</button>
                            </React.Fragment>
                        }
                    </div>
                }
                {state.showAddForm &&
                    <form onSubmit={(e) => this.addItem(e)}>
                        <fieldset>
                            <legend>Add item</legend>
                            {state.error && 
                                <div className="message message-error">You must enter a description of your item.</div>
                            }
                            <input className="form-input" type="text" name="title" placeholder="Enter item description" value={state.title} onChange={(e) => this.handleInputChange(e)} />
                            <button type="submit">Save</button>
                            <button className="caution" onClick={() => this.setState({ error: false, showAddForm: false, title: '' })}>Cancel</button>
                        </fieldset>
                    </form>
                }
                {state.showShareForm &&
                    <form onSubmit={(e) => this.shareList(e)}>
                        <fieldset>
                            <legend>Share list</legend>
                            {state.error && 
                                <div className="message message-error">You must enter a valid email address.</div>
                            }
                            {state.success && 
                                <div className="message message-success">You have shared this list with {state.email}.</div>
                            }
                            <input className="form-input" type="text" name="email" placeholder="Enter the user's email address" value={state.email} onChange={(e) => this.handleInputChange(e)} />
                            <button type="submit">Share</button>
                            <button className="caution" onClick={() => this.setState({ email: '', error: false, showShareForm: false, success: false })}>Cancel</button>
                        </fieldset>
                    </form>
                }
            </div>
        );
    }

    addItem (e) {
        e.preventDefault();

        const state = this.state;

        if (!state.title) {
            return this.setState({ error: true });
        }

        const opts = ApiHelper.generateOpts({
            body: { title: state.title },
            credentials: true,
            method: 'POST',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${state.list._id}/items`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json, title: '' });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    deleteItem (itemId) {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'DELETE',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.state.list._id}/items/${itemId}`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json });
        });
    }

    deleteList () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'DELETE',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.state.list._id}`, opts).then((res) => {
            if (res.ok) {
                this.props.history.push('/dashboard');
            }
        });
    }

    handleInputChange (e) {
        let formError = this.state.error;
        let val = e.target.value;

        if (formError && val) {
            formError = false;
        }

        this.setState({ error: formError, [e.target.name]: val });
    }

    shareList (e) {
        e.preventDefault();

        const state = this.state;

        if (!state.email) {
            return this.setState({ error: true });
        }

        const opts = ApiHelper.generateOpts({
            body: { email: state.email },
            credentials: true,
            method: 'POST',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${state.list._id}/shared`, opts).then((res) => {
            this.setState({ success: true });

            if (res.ok) {
                return res.json();
            }

            return null;
        }).then((json) => {
            if (json) {
                this.setState({ list: json });
            }
        });
    }
    
    toggleCompleted (item) {
        item.completed = !item.completed;

        const opts = ApiHelper.generateOpts({
            body: item,
            credentials: true,
            method: 'PUT',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.state.list._id}/items/${item._id}`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json });
        });
    }

    unshareList (user) {
        const opts = ApiHelper.generateOpts({
            body: { id: user._id },
            credentials: true,
            method: 'DELETE',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.state.list._id}/shared`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json });
        });
    }
}

export default List;