import React, { Component } from 'react';

class Home extends Component {

    constructor (props) {
        super(props);

        this.state = {
            email: '',
            password: ''
        };
    }

    render () {
        return (
            <div className="Home"></div>
        );
    }

    handleInputChange (event) {
        const { name, value } = event.target;

        this.setState({
            [name]: value
        });
    }

    onSubmit (e) {
        e.preventDefault();

        fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if (res.status === 200) {
                return this.props.history.push('/');
            }
        }).catch((err) => {
            console.error(err);
        });
    }
}

export default Home;