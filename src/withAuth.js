import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

function withAuth (ComponentToProtect) {

    return class Auth extends Component {

        constructor () {
            super();

            this.state = {
                loading: true,
                redirect: false
            };
        }

        componentDidMount () {
            
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

export default withAuth;