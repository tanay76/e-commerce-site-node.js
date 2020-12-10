const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

router.get('/add-product', isAuth, adminController.getAddProducts);
router.get('/products', isAuth, adminController.getProducts);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/add-product', 
  // [
  //   body('title', 'Title should be minimum 5 characters long.')
  //   .isString()
  //   .isLength({ min: 5 })
  //   .trim(),
  //   body('price', 'Price should include 2 decimal places.').isFloat(),
  //   body('description', 'Description should be 5 to 400 characters long!')
  //   .isString()
  //   .isLength({ min: 5, max: 400 })
  //   .trim()
  // ], 
  isAuth, 
  adminController.postAddProducts
  );
router.post(
  '/edit-product', 
  [
    body('title', 'Title should be minimum 5 characters long.')
    .isString()
    .isLength({ min: 5 })
    .trim(),
    body('price', 'Price should include 2 decimal places.').isFloat(),
    body('description', 'Description should be 5 to 400 characters long!')
    .isString()
    .isLength({ min: 5, max: 400 })
    .trim()
  ], 
  isAuth, 
  adminController.postEditProduct
  );
router.post('/delete-product', isAuth, adminController.postDeleteProduct);



module.exports = router;