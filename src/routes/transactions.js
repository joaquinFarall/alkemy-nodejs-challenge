const express = require('express');
const router = express.Router();

const pool = require('../database');

// function to format the dates from the db as yyyy-mm-dd
function formatDate(date) {
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }

    return year + '-' + month + '-' + day;
}

// function to validate date's input
function isValidDate(dateString) {
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;  // Invalid format
    var d = new Date(dateString);
    var dNum = d.getTime();
    if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
    return d.toISOString().slice(0, 10) === dateString;
}

// GET routes
router.get('/home', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC limit 10';

    let transactions = await pool.query(query, [user.id]);

    // format date to display
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    });

    res.render('home', { transactions, user });
});

router.get('/transactions/new', (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    res.render('new-transaction');
});

router.get('/transactions', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'TRANSACTIONS';
    let query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC';
    let transactions = await pool.query(query, [user.id]);

    // format date to display
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transactions', { h1, transactions });
});

router.get('/transactions/deposits', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'DEPOSITS';
    let query = 'SELECT * FROM transactions WHERE user_id = ? AND type = "deposit" ORDER BY date DESC';
    let transactions = await pool.query(query, [user.id]);

    // format date to display
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transactions', { h1, transactions });
});

router.get('/transactions/extractions', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let user = req.session.user;

    let h1 = 'EXTRACTIONS';
    let query = 'SELECT * FROM transactions WHERE user_id = ? AND type = "extraction" ORDER BY date DESC';
    let transactions = await pool.query(query, [user.id]);

    // format date to display
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transactions', { h1, transactions });
});

router.get('/transactions/:category', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let { category } = req.params;
    let h1 = category.toUpperCase();

    let user = req.session.user;

    let query = 'SELECT * FROM transactions WHERE user_id = ? AND category = ? ORDER BY date DESC';
    let transactions = await pool.query(query, [user.id, category]);

    // format date to display
    transactions.forEach((transaction) => {
        transaction.date = formatDate(transaction.date);
    })

    res.render('transactions', { h1, transactions });
});

router.get('/transactions/edit/:id', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let { id } = req.params;

    let query = 'SELECT * FROM transactions WHERE id = ?'

    let transaction = await pool.query(query, [id]);

    // format date to display
    transaction[0].date = formatDate(transaction[0].date);

    res.render('edit-transaction', { transaction: transaction[0] });
});

router.get('/transactions/delete/:id', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let { id } = req.params;

    let user = req.session.user;

    // update user's balance with the deleted transaction's amount
    let oldTransaction = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);

    let balance = parseFloat(user.balance);

    if (oldTransaction[0].type == 'deposit') {

        balance = balance - parseFloat(oldTransaction[0].amount);

    } else if (oldTransaction[0].type == 'extraction') {

        balance = balance + parseFloat(oldTransaction[0].amount);

    }

    req.session.user.balance = balance;
    await pool.query('UPDATE users SET balance = ' + balance + ' WHERE id = ?', [user.id]);

    // delete transaction
    let query = 'DELETE FROM transactions WHERE id = ?';

    await pool.query(query, [id]);

    req.flash('success_msg', 'Transaction deleted successfully');
    res.redirect('/transactions');
});

router.get('*', (req, res) => {
    res.render('notfound', { session: req.session });
});

// POST routes
router.post('/transactions/new', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let { amount, concept, type, category, date } = req.body;

    let user = req.session.user;

    // validate amount
    if (amount < 1) {
        req.flash('error_msg', 'Please insert a valid amount');
        return res.redirect('/transactions/new');
    }

    // validate category
    if (category == "null") {
        req.flash('error_msg', "Please select the transaction's category");
        return res.redirect('/transactions/new');
    }

    // validate date
    if (!isValidDate(date)) {
        req.flash('error_msg', 'Please insert a valid date');
        return res.redirect('/transactions/new');
    }

    let balance = 0;

    if (type == 'deposit') {
        balance = parseFloat(user.balance) + parseFloat(amount);
    } else if (type == 'extraction') {
        balance = parseFloat(user.balance) - parseFloat(amount);
    } else {
        // if type isn't deposit or amount it's invalid
        req.flash('error_msg', "Please select the transaction's type");
        return res.redirect('/transactions/new');
    }

    // update balance of the user in the session and in the db
    req.session.user.balance = balance;
    let query = 'UPDATE users SET balance = ' + balance + ' WHERE id = ?';
    await pool.query(query, [user.id]);

    newTransaction = {
        concept,
        amount,
        type,
        category,
        user_id: user.id,
        date
    };

    query = 'INSERT INTO transactions SET ?';

    await pool.query(query, [newTransaction]);

    req.flash('success_msg', 'Transaction completed successfully');
    res.redirect('/transactions/new');
});

router.post('/transactions/edit/:id', async (req, res) => {
    if (!req.session.loggedin) {
        req.flash('error_msg', 'Log in to access this page');
        return res.redirect('/login');
    }

    let { amount, concept, category, date } = req.body;
    let { id } = req.params;

    // validate amount
    if (amount < 1) {
        req.flash('error_msg', 'Please insert a valid amount');
        return res.redirect('/transactions/edit/' + id);
    }

    // validate date
    if (!isValidDate(date)) {
        req.flash('error_msg', 'Please insert a valid date');
        return res.redirect('/transactions/edit/' + id);
    }

    let user = req.session.user;

    // update user's balance with the new transaction's amount
    let oldTransaction = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);

    let balance = parseFloat(user.balance);

    if (oldTransaction[0].type == 'deposit') {

        let diff = parseFloat(oldTransaction[0].amount) - parseFloat(amount);

        balance = balance - diff;

    } else if (oldTransaction[0].type == 'extraction') {

        let diff = parseFloat(oldTransaction[0].amount) - parseFloat(amount);
        balance = balance + diff;

    }

    req.session.user.balance = balance;
    await pool.query('UPDATE users SET balance = ' + balance + ' WHERE id = ?', [user.id]);

    // update transaction
    let query = 'UPDATE transactions SET concept = ?, amount = ?, category = ?, date = ? WHERE id = ?';

    await pool.query(query, [concept, amount, category, date, id]);

    req.flash('success_msg', 'Transaction edited successfully');
    res.redirect('/transactions');
});

module.exports = router;