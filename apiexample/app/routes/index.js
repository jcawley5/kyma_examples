var express = require('express');
var router = express.Router();
const config = require('../config.json');
var mongoose = require('mongoose');
var Order = mongoose.model('Orders');

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', {orders: [], title: 'API Example App', appVersion:  config.version});
// });

router.get('/', (req, res) => {
  
  Order.find({}, function(err, orders) {
    if (err)
      res.send(err);
    console.log(orders);
    res.render('index', {orders: orders, title: 'API Example App', appVersion:  config.version});
  });

  
})

module.exports = router;
