const express = require('express');
const ejs = require('ejs');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');

const {database} = require('./connection');

// initializations
const app = express();

// settings
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({
    secret: 'alkemyChallenge',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());

// global variables
app.use((req, res, next) => {
    app.locals.success_msg = req.flash('success_msg');
    app.locals.error_msg = req.flash('error_msg');
    next();
});

// routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use(require('./routes/transactions'));

// public 
app.use(express.static(path.join(__dirname, 'public')));

// server
app.listen(app.get('port'), () => {
    console.log('server started on port ' + app.get('port'));
});