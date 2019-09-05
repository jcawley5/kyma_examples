'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  orderCode: {  
    type: String,
    required: 'No orderCode was received - this is required'
  },
  Created_date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: "kyma"
  }
});

module.exports = mongoose.model('Orders', OrderSchema);