import React, { Component } from 'react';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

class List extends Component {

    constructor (props) {
        super(props);

        this.state = {
            list: null,
            showForm: false,
            title: ''
        };
    }

    componentDidMount () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.props.match.params.list_id}`, opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    render () {
        const state = this.state;

        if (!state.list) {
            return null;
        }

        return (
            <div className="List">
                <h1>{state.list.title}</h1>
                <ul>
                    {state.list.items.map((item, i) => {
                        return (
                            <li key={i}>{item.title}<button onClick={() => this.deleteItem(item._id)}>Delete</button></li>
                        );
                    })}
                </ul>
                {!state.showForm && <button onClick={() => this.setState({ showForm: true })}>Add item</button>}
                {state.showForm &&
                    <form onSubmit={(e) => this.addItem(e)}>
                        <input type="text" placeholder="Enter item" value={state.title} onChange={(e) => this.handleInputChange(e)} />
                        <button type="submit">Save</button>
                        <button onClick={() => this.setState({ showForm: false, title: '' })}>Cancel</button>
                    </form>
                }
            </div>
        );
    }

    addItem (e) {
        e.preventDefault();

        const state = this.state;

        if (!state.title) {
            return false;
        }

        const opts = ApiHelper.generateOpts({
            body: { title: state.title },
            credentials: true,
            method: 'POST',
            token: AuthService.getToken()
        });

        fetch(`/api/lists/${this.props.match.params.list_id}/items`, opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json, showForm: false, title: '' });
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

        fetch(`/api/lists/${this.props.match.params.list_id}/items/${itemId}`, opts).then((res) => {
            if (res.status === 200) {
                return res.json();
            }
        }).then((json) => {
            this.setState({ list: json });
        }).catch((err) => {
            window.console && window.console.error(err);
        });
    }

    handleInputChange (e) {
        this.setState({ title: e.target.value });
    }
}

export default List;