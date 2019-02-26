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

module.exports = {
    getRandomUser () {
        return users[Math.floor(Math.random() * users.length)];
    },
    getUniqueUser (email) {
        const uniqueUsers = users.filter((u) => {
            return u.email.toLowerCase().trim() !== email.toLowerCase().trim();
        });

        return uniqueUsers[Math.floor(Math.random() * uniqueUsers.length)];
    }
};