class AuthService {

    clearToken () {
        localStorage.removeItem('x_token');
    }

    getToken () {
        return localStorage.getItem('x_token');
    }

    isLoggedIn () {
        return this.getToken() !== null;
    }
}

export default new AuthService();