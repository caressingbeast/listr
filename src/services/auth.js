import ApiHelper from '../helpers/api';

class AuthService {

    clearToken () {
        localStorage.removeItem('x_token');
    }

    clearUser () {
        localStorage.removeItem('lid');
    }

    fetchUser () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: this.getToken()
        });

        return fetch(`/api/users/${this.getUser()}`, opts)
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }

                return null;
            }).catch((err) => {
                window.console && window.console.error(err);
                return null;
            });
    }

    getToken () {
        return localStorage.getItem('x_token');
    }

    getUser () {
        return localStorage.getItem('lid');
    }

    isLoggedIn () {
        return this.getToken() !== null && this.getUser() !== null;
    }

    setUser (id) {
        localStorage.setItem('lid', id)
    }

    setToken (token) {
        localStorage.setItem('x_token', token);
    }
}

export default new AuthService();