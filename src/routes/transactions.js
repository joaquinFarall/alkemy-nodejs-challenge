const express = require('express');
const router = express.Router();

const pool = require('../database');

function setDate(){
    let date = new Date();
    let dd = String(date.getDate()).padStart(2, '0');
    let mm = String(date.getMonth() + 1).padStart(2, '0'); 
    let yyyy = date.getFullYear();
    let hh = date.getHours();
    let ms = date.getMinutes();
    let ss = date.getSeconds();
    return date = yyyy+'-'+mm+'-'+dd + ' ' + hh+':'+ms+':'+ss;
}

function formatDate(date){
    year = date.getFullYear();
    month = date.getMonth()+1;
    day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }

    return year+'-' + month + '-'+day;
}

// GET routes
router.get('/home', async (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC limit 10';
    
    let transactions = await pool.query(query, [user.id]);
    
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    });
    
    res.render('home', {transactions, user});
});

router.get('/depositar', (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    res.render('depositar');
});

router.get('/extraer', (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    res.render('extraer');
});

router.get('/transacciones', async (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'Transacciones';
    let query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC';
    let transactions = await pool.query(query, [user.id]);

    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transacciones', {h1, transactions});
});

router.get('/transacciones/depositos', async (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'Depositos';
    let query = 'SELECT * FROM transactions WHERE user_id = ? AND type = "deposito" ORDER BY id DESC';
    let transactions = await pool.query(query, [user.id]);

    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transacciones', {h1, transactions});
});

router.get('/transacciones/extracciones', async (req, res) => {
    if(!req.session.loggedin){
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'Extracciones';
    let query = 'SELECT * FROM transactions WHERE user_id = ? AND type = "extraccion" ORDER BY id DESC';
    let transactions = await pool.query(query, [user.id]);

    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transacciones', {h1, transactions});
});

// POST routes
router.post('/depositar', async (req, res) => {
    let { amount, password } = req.body;

    let user = req.session.user;

    let balance = parseFloat(user.balance) + parseFloat(amount);
    
    // update balance of the user in the session and in the db
    req.session.user.balance = balance;
    let query = 'UPDATE users SET balance = '+ balance +' WHERE id = ?';
    await pool.query(query, [user.id]);

    // set current date
    let date = setDate();

    newTransaction = {
        amount,
        type: 'deposito',
        user_id: user.id,
        date
    };
    
    query = 'INSERT INTO transactions SET ?';

    await pool.query(query, [newTransaction]);

    req.flash('success_msg', 'Transaction completed successfully');
    res.redirect('/depositar');
});

router.post('/extraer', async (req, res) => {
    let { amount, password } = req.body;

    let user = req.session.user;

    if(user.balance < amount){
        req.flash('error_msg', 'You do not have enough money to extract the selected amount');
        return res.redirect('/extraer');
    }

    let balance = parseFloat(user.balance) - parseFloat(amount);
    
    // update balance of the user in the session and in the db
    req.session.user.balance = balance;
    query = 'UPDATE users SET balance = '+ balance +' WHERE id = ?';
    await pool.query(query, user.id);
    
    // set current date
    let date = setDate();

    newTransaction = {
        amount,
        type: 'extraccion',
        user_id: user.id,
        date
    };
    
    query = 'INSERT INTO transactions SET ?';

    await pool.query(query, [newTransaction]);

    req.flash('success_msg', 'Transaction completed successfully');
    res.redirect('/extraer');
});

module.exports = router;