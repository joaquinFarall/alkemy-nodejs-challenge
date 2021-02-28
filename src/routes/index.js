const express = require('express');
const router = express.Router();

// GET routes
router.get('/', (req, res) => {
    if(req.session.loggedin) return res.redirect('/home');
    
    res.render('index');
});

module.exports = router;