const express = require('express');
const router = express.Router();

const pool = require('../database');

// GET router
router.get('/home', (req, res) => {
    res.render('home');
});

router.get('/depositar', (req, res) => {
    res.render('depositar');
});

router.get('/extraer', (req, res) => {
    res.render('extraer');
});

// POST routes
router.post('/depositar', async (req, res) => {
    let { amount, password } = req.body;

    let query = 'SELECT * FROM users WHERE id = 1'
    let user = await pool.query(query);

    let balance = parseFloat(user[0].balance) + parseFloat(amount);
    
    query = 'UPDATE users SET balance = '+ balance +' WHERE id = 1';
    await pool.query(query);

    // set current date
    var date = new Date();
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); 
    var yyyy = date.getFullYear();

    date = yyyy + '-' + mm + '-' + dd;

    newTransaction = {
        amount,
        type: 'deposito',
        user_id: 1,
        date
    };
    
    query = 'INSERT INTO transactions SET ?';

    await pool.query(query, [newTransaction]);

    req.flash('success_msg', 'Transaction completed successfully');
    res.redirect('/depositar');
});

router.post('/extraer', async (req, res) => {
    let { amount, password } = req.body;

    let query = 'SELECT * FROM users WHERE id = 1'
    let user = await pool.query(query);

    if(user[0].balance < amount){
        req.flash('error_msg', 'You do not have enough money to extract');
        return res.redirect('/extraer');
    }

    let balance = parseFloat(user[0].balance) - parseFloat(amount);
    
    query = 'UPDATE users SET balance = '+ balance +' WHERE id = 1';
    await pool.query(query);
    
    // set current date
    var date = new Date();
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); 
    var yyyy = date.getFullYear();

    date = yyyy + '-' + mm + '-' + dd;

    newTransaction = {
        amount,
        type: 'extraccion',
        user_id: 1,
        date
    };
    
    query = 'INSERT INTO transactions SET ?';

    await pool.query(query, [newTransaction]);

    req.flash('success_msg', 'Transaction completed successfully');
    res.redirect('/extraer');
});

module.exports = router;