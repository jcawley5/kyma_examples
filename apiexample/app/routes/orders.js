var express = require('express');
var router = express.Router();
var orders = require('../api/controllers/orders');

/* GET users listing. */
router.get('/', orders.getAll);
router.post('/', orders.create);

router.get('/:orderCode', orders.read);
router.put('/:orderCode', orders.update);
router.delete('/:orderCode', orders.delete);

module.exports = router;
