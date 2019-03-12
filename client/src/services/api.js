import ApiHelper from '../helpers/api';
import AuthService from './auth';

class ApiService {

    createList (title) {
        const opts = ApiHelper.generateOpts({
            body: { title },
            credentials: true,
            token: AuthService.getToken()
        });

        return fetch('/api/lists', opts).then((res) => {
            if (res.ok) {
                return res.json();
            }

            return null;
        });
    }

    createUser (data) {
        const opts = ApiHelper.generateOpts({
            body: data,
        });

        fetch('/api/users', opts).then((res) => {
            if (res.ok) {
                return res.json();
            }
        }).then((json) => {
            AuthService.setToken(json.xsrfToken);
            AuthService.setUser(json.id);
        });
    }

    fetchLists () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: AuthService.getToken()
        });

        return fetch('/api/lists', opts).then((res) => {
            if (res.ok) {
                return res.json();
            }

            return null;
        });
    }

    fetchUser () {
        const opts = ApiHelper.generateOpts({
            credentials: true,
            method: 'GET',
            token: AuthService.getToken()
        });

        return fetch(`/api/users/${AuthService.getUser()}`, opts)
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }

                return null;
            });
    }
}

export default new ApiService();