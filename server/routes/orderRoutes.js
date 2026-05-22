const express = require('express');
const router = express.Router();
const { createOrder, getOrders, deleteOrder, clearAllOrders, getOrdersByPhone } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(createOrder)
  .get(protect, getOrders);

router.get('/track/:phone', getOrdersByPhone);
router.delete('/clear-all', protect, clearAllOrders);

router.route('/:id')
  .delete(protect, deleteOrder);

module.exports = router;
