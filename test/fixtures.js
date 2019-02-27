const users = [
    {
        email: 'WYATT.caldwell43@example.com   ',
        firstName: 'Wyatt   ',
        lastName: 'Caldwell   ',
        password: 'password'
    },
    {
        email: 'TYRONE.lawson80@example.com   ',
        firstName: 'Tyrone   ',
        lastName: 'Lawson   ',
        password: 'password'
    }
];

function format (str) {
    return str.toLowerCase().trim();
}

function getRandom (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
    getRandomUser () {
        return getRandom(users);
    },
    getUniqueUser (email) {
        const uniqueUsers = users.filter((u) => {
            return format(u.email) !== format(email);
        });

        return getRandom(uniqueUsers);
    }
};