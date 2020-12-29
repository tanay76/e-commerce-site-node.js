const express = require('express');

const router = express.Router();

const paytmController = require('../controllers/paytm');
// const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

// router.post('/proceed', shopController.postProceed);
router.post('/callback', paytmController.postCallback);

module.exports = router;