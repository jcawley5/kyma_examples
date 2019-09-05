'use strict';

var mongoose = require('mongoose'),
  Order = mongoose.model('Orders');

exports.getAll = function(req, res) {
    Order.find({}, function(err, order) {
    if (err)
      res.send(err);
    res.json(order);
  });
};

exports.create = function(req, res) {
  var new_order = new Order(req.body);
  new_order.save(function(err, order) {
    if (err)
      res.send(err);
    res.json(order);
  });
};

exports.read = function(req, res) {
    Order.findOne({orderCode: req.params.orderCode}, function(err, order) {
    if (err)
      res.send(err);
    res.json(order);
  });
};

exports.update = function(req, res) {
    Order.findOneAndUpdate({orderCode: req.params.orderCode}, req.body, {new: true}, function(err, order) {
    if (err)
      res.send(err);
    res.json(order);
  });
};

exports.delete = function(req, res) {

    Order.remove({
      orderCode: req.params.orderCode
  }, function(err, order) {
    if (err)
      res.send(err);
    res.json({ message: 'Order successfully deleted' });
  });
};