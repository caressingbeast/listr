// server.js

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

const mongoUrl = process.env.MONGODB_URL;
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true }, (err) => {
    if (err) {
        throw err;
    }
});

require('./routes.js')(app);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

app.get('*',(req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

let port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started at port: ${port}`);
});