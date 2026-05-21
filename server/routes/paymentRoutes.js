const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, placeCodOrder } = require('../controllers/paymentController');

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.post('/cod', placeCodOrder);

module.exports = router;
