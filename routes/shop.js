const express = require('express');

const router = express.Router();
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getIndex);
router.get('/products', shopController.getAllProducts);
router.get('/products/:productId', shopController.getSpecificProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart-delete-item', isAuth, shopController.postDeleteCartItem);
router.post('/cart', isAuth, shopController.postCart);
router.post('/proceed', isAuth, shopController.postProceed);
router.post('/complete', isAuth, shopController.postComplete);
router.get('/payOnDelv/:orderId', shopController.getPayOnDelv);
router.get('/checkout', isAuth, shopController.getCheckout);
router.get('/delete-order/:orderId', isAuth, shopController.getDelOrder);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;