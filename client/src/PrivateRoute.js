import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import AuthService from './services/auth';
import ApiHelper from './helpers/api';

function PrivateRoute (ComponentToProtect) {

    return class PrivateRoute extends Component {

        constructor () {
            super();

            this.state = {
                loading: true,
                redirect: false
            };
        }

        async componentDidMount () {
            const opts = ApiHelper.generateOpts({
                credentials: true,
                token: AuthService.getToken()
            });
    
            let success = await fetch('/api/auth/verify', opts).then((res) => {
                if (res.ok) {
                    return res;
                }

                return null;
            });

            if (success) {
                return this.setState({ loading: false });
            }

            return this.setState({ loading: false, redirect: true });
        }

        render () {
            const { loading, redirect } = this.state;

            if (loading) {
                return null;
            }

            if (redirect) {
                return (
                    <Redirect to={{
                        pathname: '/login',
                        state: { from: this.props.location }
                    }} />
                );
            }

            return (
                <React.Fragment>
                    <ComponentToProtect {...this.props} />
                </React.Fragment>
            );
        }
    };
}

export default PrivateRoute;