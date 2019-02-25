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

        componentDidMount () {
            const opts = ApiHelper.generateOpts({
                credentials: true,
                token: AuthService.getToken()
            });
    
            fetch('/api/auth/verify', opts).then((res) => {
                if (res.status === 200) {
                    return this.setState({ loading: false });
                }

                return this.setState({ loading: false, redirect: true });
            }).catch((err) => {
                this.setState({ loading: false, redirect: true });
                window.console && window.console.error(err);
            });
        }

        render () {
            const { loading, redirect } = this.state;

            if (loading) {
                return null;
            }

            if (redirect) {
                return (<Redirect to="/login" />);
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