import React, { Component } from 'react';

import ApiHelper from './helpers/api';
import AuthService from './services/auth';

class Profile extends Component {

    constructor (props) {
        super(props);

        this.state = {
            error: false,
            success: false,
            user: null
        };
    }

    async componentDidMount () {
        const user = await AuthService.fetchUser();

        if (user) {
            this.setState({ user });
        }
    }

    render () {
        const user = this.state.user;

        if (!user) {
            return null;
        }

        const state = this.state;

        return (
            <div className="Profile">
                <form onSubmit={(e) => this.saveProfile(e)}>
                    <fieldset>
                        <legend>Edit your profile</legend>
                        {state.error && 
                            <div className="message message-error">You must enter a valid email address.</div>
                        }
                        {state.success &&
                            <div className="message message-success">Your profile has been successfully updated.</div>
                        }
                        <input className="form-input" name="email" type="email" placeholder="Email address" defaultValue={user.email} onChange={(e) => this.handleInputChange(e)} />
                        <input className="form-input" name="firstName" type="text" placeholder="First name" defaultValue={user.firstName} onChange={(e) => this.handleInputChange(e)} />
                        <input className="form-input" name="lastName" type="text" placeholder="Last name" defaultValue={user.lastName} onChange={(e) => this.handleInputChange(e)} />
                        <button type="submit">Save</button>
                    </fieldset>
                </form>
            </div>
        );
    }

    handleInputChange (e) {
        let user = this.state.user;

        user[e.target.name] = e.target.value;

        this.setState({ user });
    }

    saveProfile (e) {
        e.preventDefault();

        const user = this.state.user;

        if (!user.email) {
            return this.setState({ error: true });
        }

        const opts = ApiHelper.generateOpts({
            body: user,
            credentials: true,
            method: 'PUT',
            token: AuthService.getToken()
        });

        fetch(`/api/users/${user._id}`, opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((user) => {
            this.setState({ success: true, user });
        });
    }
}

export default Profile;