const express = require('express');
const router = express.Router();

const pool = require('../database');

// GET routes
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/login', (req, res) => {
    res.render('login');
});

// POST routes
router.post('/signup', async (req, res) => {
    let {fullname, email, password, repeatpassword} = req.body;

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

router.post('/login', (req, res) => {
    let {email, password} = req.body;
});

module.exports = router;