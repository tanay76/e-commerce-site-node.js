const express = require('express');
const { check, body } = require('express-validator'); //Destructuring

const router = express.Router();

const authController = require('../controllers/auth');

const User = require('../models/user');

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.get('/activate/activation/:token', authController.getActivated);
router.get('/reset-password', authController.getResetPassword);
router.get('/new-password/:token', authController.getNewPassword);

router.post(
  '/signup',
  [
    check('email')
    .isEmail()
    .trim()
    .withMessage('Email input is invalid!')
    .custom((value, { req }) => {
      return User.findOne({email: value})
      .then(user => {
        if(user) {
          return Promise.reject(
            'Email already exists!'
          );
        }
      })
    }),
    body('password', 'Your password should be minimum 5 characters long.')
    .isLength({min: 5})
    .isString()
    .trim(),
    body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Both the passwords have to match!');
      }
      return true;
    })
  ], 
  authController.postSignup
);
router.post('/login', authController.postLogin);
router.post('/activation-login', authController.postActivate);
router.post('/reset-password', authController.postResetPassword);
router.post('/new-password', authController.postNewPassword);

router.post('/logout', authController.postLogout);

module.exports = router;