const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getIndex);
router.get('/products', shopController.getAllProducts);
router.get('/products/:productId', shopController.getSpecificProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart-delete-item', isAuth, shopController.postDeleteCartItem);
router.post('/cart', isAuth, shopController.postCart);
router.post('/create-order', isAuth, shopController.postOrders);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;