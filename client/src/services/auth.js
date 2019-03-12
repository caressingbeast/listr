class AuthService {

    clearToken () {
        localStorage.removeItem('lxt');
    }

    clearUser () {
        localStorage.removeItem('lid');
    }

    getToken () {
        return localStorage.getItem('lxt');
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
        localStorage.setItem('lxt', token);
    }
}

export default new AuthService();