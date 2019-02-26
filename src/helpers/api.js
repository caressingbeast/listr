class ApiHelper {

    static generateOpts (opts) {
        let returnOpts = {
            headers: {
                'Content-Type': 'application/json'
            },
            method: opts.method || 'POST'
        };

        if (opts.body) {
            returnOpts.body = JSON.stringify(opts.body);
        }

        if (opts.credentials) {
            returnOpts.credentials = 'same-origin';
        }

        if (opts.headers) {
            Object.keys(opts.headers).forEach((k) => {
                returnOpts.headers[k] = opts.headers[k];
            });
        }

        if (opts.token) {
            returnOpts.headers['Listr-CSRF-Token'] = opts.token;
        }

        return returnOpts;
    }
}

export default ApiHelper;