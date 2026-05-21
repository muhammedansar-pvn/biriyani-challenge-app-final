const express = require('express');
const router = express.Router();
const { createOrder, getOrders, deleteOrder, getOrdersByPhone } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(createOrder)
  .get(protect, getOrders);

router.get('/track/:phone', getOrdersByPhone);

router.route('/:id')
  .delete(protect, deleteOrder);

module.exports = router;
