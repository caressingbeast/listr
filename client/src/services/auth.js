class AuthService {

    clearToken () {
        localStorage.removeItem('x_token');
    }

    clearUser () {
        localStorage.removeItem('lid');
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
        localStorage.setItem('lid', id);
    }

    setToken (token) {
        localStorage.setItem('x_token', token);
    }
}

export default new AuthService();