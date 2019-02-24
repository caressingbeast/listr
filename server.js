// server.js

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const config = require('./config.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

const mongoUrl = process.env.MONGODB_URL || config.mongodb_url;
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true }, (err) => {
    if (err) {
        throw err;
    }
});

// const db = mongoose.connection;

// app.use(session({
//     key: 'user_sid',
//     name: 'id',
//     resave: false,
//     saveUninitialized: true,
//     secret: process.env.SECRET_KEY || config.secret,
//     store: new MongoStore({ 
//         mongooseConnection: db,
//         ttl: 3600 * 2 // 2 hours
//     }),
//     cookie: {
//         httpOnly: true,
//         path: '/',
//         secure: process.env.NODE_ENV === 'production'
//     }
// }));

require('./routes.js')(app);

let port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started at port: ${port}`);
});