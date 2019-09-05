var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

router.get('/liveness', function(req, res, next) {
    return mongoose.connections.map((conn) => {
        if(conn.readyState === 0){
            res.status(500)
            res.render('error', { error: "a connection to the database has not been established" })
        }
        res.json({status: "the database is ready"});
      });
});

router.get('/readiness', function(req, res, next) {
    res.json({status: 'App is running'});
});

module.exports = router;