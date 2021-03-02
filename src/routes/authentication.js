const express = require('express');
const router = express.Router();

const pool = require('../database');

// function to validate the email adress
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

// GET routes
router.get('/signup', (req, res) => {
    if(req.session.loggedin) return res.redirect('/home');

    res.render('signup');
});

router.get('/login', (req, res) => {
    if(req.session.loggedin) return res.redirect('/home');

    res.render('login');
});

router.get('/logout', (req, res) => {
    if(!req.session.loggedin) return res.redirect('/');

    req.session.user = null;
    req.session.loggedin = false;
    req.flash('success_msg', 'Successfully logged out');
    res.redirect('/');
});

// POST routes
router.post('/signup', async (req, res) => {
    let {fullname, email, password, repeatpassword} = req.body;

    // validate email
    if(!validateEmail(email)){
        req.flash('error_msg', 'Invalid email. Try again');
        return res.redirect('/signup');
    }

    let emailCheck = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if(emailCheck.length > 0){
        req.flash('error_msg', 'The selected email is already in use');
        return res.redirect('/signup');
    }

    // check if passwords match
    if(password != repeatpassword){
        req.flash('error_msg', 'Passwords do not match. Try again');
        return res.redirect('/signup');
    }

    let newUser = {
        email,
        password,
        fullname,
        balance: 0
    };
    let query = 'INSERT INTO users SET ?';

    await pool.query(query, [newUser]);

    req.flash('success_msg', 'User created successfully')
    res.redirect('/login');
});

router.post('/login', async (req, res) => {
    let {email, password} = req.body;
    
    let query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    let user = await pool.query(query, [email, password]);
    
    if(user.length > 0){
        req.session.loggedin = true;
        req.session.user = user[0];
        res.redirect('/home');
    }else{
        req.flash('error_msg', 'Incorrect email or password. Try again');
        res.redirect('/login');
    }
});

module.exports = router;