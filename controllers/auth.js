const crypto = require('crypto');
require('dotenv').config()
const chalk = require('chalk');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator'); // Destructuring used

const User = require('../models/user');
const { json } = require('body-parser');

// const transporter = nodemailer.createTransport(sendgridTransport({
//   auth: {
//     api_key: process.env.sendgrid_api_key,
//   }
// }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.transporter_useremail,
    pass: process.env.transporter_pass,
  },
});

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Log In',
    path: '/login',
    login: true
  });
};

exports.getSignup = (req, res, next) => {
  let message1 = req.flash('error');
  let message2 = req.flash('success');
  if (message1.length > 0) {
    message1 = message1[0];
  } else {
    message1 = null;
  }
  if (message2.length > 0) {
    message2 = message2[0];
  } else {
    message2 = null;
  }
  res.render('auth/signup', {
    pageTitle: 'Sign Up',
    path: '/signup',
    errorMessage: message1,
    successMessage: message2,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userConfirmPassword = req.body.confirmPassword;
  const noError = req.body.noError;
  if (noError !== 'false') {
    const user = JSON.parse(noError);
    return user.save(() => {
      transporter.sendMail({
        to: userEmail,
        from: process.env.transporter_useremail,
        subject: 'Account Activation Email',
        html: `
      <p>Thank you for subscribing to our site.</p>
      <p>Please, click this <a href = "http://localhost:3000/activate/activation/${token}">link</a> to activate your account and then login.</p>
      `,
      });
      // console.log('Email sent successfully to ' + userEmail);
      req.flash(
        'success',
        'An activation mail has been sent to your email. Your account will not be activated unless you click on the link provided with the mail!'
      );
      return res.redirect('/');
    })
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    // return res.status(422).render('auth/signup', {
    //   pageTitle: 'Sign Up',
    //   path: '/signup',
    return res.json({errorMessage: errors.array()[0].msg,});
      
      // oldInput: {
      //   email: userEmail,
      //   password: userPassword,
      //   confirmPassword: userConfirmPassword,
      // },
      // validationErrors: errors.array(),
    // });
  }
  bcrypt
    .hash(userPassword, 12)
    .then((hashedPassword) => {
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          req.flash('error', 'Something wrong! Please contact us.');
          // return res.render('auth/signup', {
          //   pageTitle: 'Sign Up',
          //   path: '/signup',
          return res.json({
            errorMessage: req.flash('error')[0],
          });
            // oldInput: {
            //   email: userEmail,
            //   password: userPassword,
            //   confirmPassword: userConfirmPassword,
            // },
            // validationErrors: [],
          // });
        }
        const token = buffer.toString('hex');
        const user = new User({
          email: userEmail,
          password: hashedPassword,
          activationToken: token,
          isActive: false,
          resetToken: undefined,
          resetTokenExpiration: undefined,
          cart: { items: [] },
        });
        return res.json({
          message: user,
          errorMessage: null
        })
      })
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postLogin = (req, res, next) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const noError = req.body.noError;
  if (noError !== 'false') {
    req.session.isLoggedIn = true;
    req.session.user = JSON.parse(noError);
    req.session.save();
    req.flash('success', 'Successfully logged in!');
    return res.redirect('/');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    // return res.status(422).render('auth/login', {
    //   pageTitle: 'Login',
    //   path: '/login',
    //   errorMessage: errors.array()[0].msg,
    //   oldInput: {
    //     email: userEmail,
    //     password: userPassword
    //   },
    //   validationErrors: errors.array()
    // });
    return res.json({
      message: 'Failed to login',
      pageTitle: 'Login',
      path: '/login',
      errorMessag: errors.array()[0].msg,
      oldInputEmai: userEmail,
      oldInputPasswor: userPassword,
      validationError: errors.array(),
    });
  }
  User.findOne({ email: userEmail })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Email not found');
        // res.render('auth/login', {
        //   path: '/login',
        //   pageTitle: 'Login',
        //   errorMessage: req.flash('error')[0],
        //   oldInput: {
        //     email: userEmail,
        //     password: userPassword
        //   },
        //   validationErrors: [{param: 'email'}]
        // });
        res.json({
          message: 'Failed to login',
          pageTitle: 'Login',
          path: '/login',
          errorMessage: req.flash('error')[0],
          oldInputEmail: userEmail,
          oldInputPassword: userPassword,
          validationErrors: [{ param: 'email' }],
        });
      } else if (user.isActive === false) {
        req.flash(
          'error',
          'You have not yet activated your account through the link sent to your email'
        );
        // res.render('auth/login', {
        //   path: '/login',
        //   pageTitle: 'Log In',
        //   errorMessage: req.flash('error')[0],
        //   oldInput: {
        //     email: userEmail,
        //     password: userPassword
        //   },
        //   validationErrors: [{param: 'email', param: 'password'}]
        // });
        res.json({
          message: 'Failed to login',
          pageTitle: 'Login',
          path: '/login',
          errorMessage: req.flash('error')[0],
          oldInputEmail: userEmail,
          oldInputPassword: userPassword,
          validationErrors: [{ param: 'email', param: 'password' }],
        });
      } else {
        bcrypt.compare(userPassword, user.password).then((doMatch) => {
          if (!doMatch) {
            req.flash('error', 'Invalid Password!');
            // res.render('auth/login', {
            //   path: '/login',
            //   pageTitle: 'Log In',
            //   errorMessage: req.flash('error')[0],
            //   oldInput: {
            //     email: userEmail,
            //     password: userPassword
            //   },
            //   validationErrors: [{param: 'password'}]
            // });
            res.json({
              message: 'Failed to login',
              pageTitle: 'Login',
              path: '/login',
              errorMessage: req.flash('error')[0],
              oldInputEmail: userEmail,
              oldInputPassword: userPassword,
              validationErrors: [{ param: 'password' }],
            });
          } else {
            res.json({
              message: JSON.stringify(user),
              errorMessage: null,
            });
          }
        });
      }
    })
    .catch((err) => {
      return res.status(500).json();
    });
};

exports.getActivated = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ activationToken: token })
    .then((user) => {
      console.log(user);
      if (!user) {
        req.flash('error', 'You have perhaps clicked on wrong link!');
        return res.redirect('/signup');
      }
      return res.render('auth/login', {
        pageTitle: 'Log In',
        path: '/activation-login',
        login: false,
        successMessage: 'Right you are! You are almost done!',
        userId: user._id.toString()
      });
      console.log('DONE');
    })
    .catch((err) => {
      console.log('Error occured: ',err);
      return next(new Error(err));
    });
};

exports.postActivate = (req, res, next) => {
  const userId = req.body.userId;
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const noError = req.body.noError;
  
  if (noError !== 'false') {
    req.session.isLoggedIn = true;
    req.session.user = noError;
    req.session.save();
    req.flash('success', 'You are now activated and logged in!');
    return res.redirect('/');
  }
  let activatedUser;
  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        // req.flash('error', 'No such active or inactive users found!');
        // res.render('auth/activation-login', {
        //   pageTitle: 'Log In',
        //   path: '/activation-login',
        //   errorMessage: req.flash('error')[0],
        //   successMessage: null,
        //   userId: null,
        //   oldInput: {
        //     email: userEmail,
        //     password: userPassword,
        //   },
        // });
        res.json({
          errorMessage: 'No such active or inactive users found!'
        });
      } else {
        activatedUser = user;
        if (user.email !== userEmail) {
          // req.flash('error', 'No such email is found!');
          // res.render('auth/activation-login', {
          //   pageTitle: 'Log In',
          //   path: '/activation-login',
          //   errorMessage: req.flash('error')[0],
          //   successMessage: null,
          //   userId: user._id.toString(),
          //   oldInput: {
          //     email: userEmail,
          //     password: userPassword,
          //   },
          // });
          res.json({
            errorMessage: 'No such email is found!'
          });
        } else {
          bcrypt.compare(userPassword, user.password).then((doMatch) => {
            if (doMatch) {
              activatedUser.isActive = true;
              return activatedUser
                .save()
                .then((result) => {
                  // req.session.isLoggedIn = true;
                  // req.session.user = user;
                  // req.session.save();
                  // req.flash('success', 'You are now activated and logged in!');
                  // res.redirect('/');
                  res.json({
                    message: JSON.stringify(activatedUser),
                    errorMessage: null
                  });
                })
                .catch((err) => {
                  // console.log(err);
                });
            }
            // req.flash('error', 'Invalid Password!');
            // res.render('auth/activation-login', {
            //   pageTitle: 'Log In',
            //   path: '/activation-login',
            //   errorMessage: req.flash('error')[0],
            //   successMessage: null,
            //   userId: user._id.toString(),
            //   oldInput: {
            //     email: userEmail,
            //     password: userPassword,
            //   },
            // });
            res.json({
              errorMessage: 'Invalid Password!'
            });
          });
        }
      }
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getResetPassword = (req, res, next) => {
  return res.render('auth/reset-password', {
    pageTitle: 'Reset Password',
    path: 'reset-password',
    errorMessage: null,
    oldInput: {
      email: '',
    },
  });
};

exports.postResetPassword = (req, res, next) => {
  const userEmail = req.body.email;
  let resetUser;
  User.findOne({ email: userEmail })
    .then((user) => {
      if (!user) {
        req.flash('error', 'No user with this email exists!');
        return res.render('auth/reset-password', {
          pageTitle: 'Reset Password',
          path: 'reset-password',
          errorMessage: req.flash('error')[0],
          oldInput: {
            email: userEmail,
          },
        });
      }
      if (!user.isActive) {
        req.flash('error', 'You are not active! First activate your account.');
        return res.render('auth/reset-password', {
          pageTitle: 'Reset Password',
          path: 'reset-password',
          errorMessage: req.flash('error')[0],
          oldInput: {
            email: userEmail,
          },
        });
      }
      resetUser = user;
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          req.flash('error', 'Something wrong! Please contact us.');
          return res.render('auth/reset-password', {
            pageTitle: 'Reset Password',
            path: '/error-message',
            errorMessage: req.flash('error')[0],
            oldInput: {
              email: userEmail,
            },
          });
        }
        const token = buffer.toString('hex');
        resetUser.resetToken = token;
        resetUser.resetTokenExpiration = Date.now() + 1800000;
        return resetUser.save((err) => {
          if (!err) {
            req.flash(
              'success',
              'Please, click on the link sent to your email. link will remain active for 30 minutes.'
            );
            res.redirect('/');
            transporter.sendMail({
              to: userEmail,
              from: 'ourblogpost3476@gmail.com',
              subject: 'Password Reset',
              html: `
            <p>Thank you for subscribing to our site.</p>
            <p>Please, click this <a href = "http://localhost:3000/new-password/${token}">link</a> to reset your password.</p>
            `,
            });
          } else {
            // console.log('Error in saving resetUser: ', err);
          }
        });
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getNewPassword = (req, res, next) => {
  const resetToken = req.params.token;
  User.findOne({ resetToken: resetToken })
    .then((user) => {
      if (!user) {
        req.flash('error', 'You have perhaps clicked on wrong link!');
        return res.render('auth/new-password', {
          pageTitle: 'New Password',
          path: '/new-password',
          userId: null,
          resetToken: null,
          errorMessage: req.flash('error')[0],
          oldInput: {
            password: '',
            confirmPassword: '',
          },
        });
      }
      return res.render('auth/new-password', {
        pageTitle: 'New Password',
        path: '/new-password',
        userId: user._id.toString(),
        resetToken: resetToken,
        errorMessage: null,
        oldInput: {
          password: '',
          confirmPassword: '',
        },
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postNewPassword = (req, res, next) => {
  let resetUser;
  const userId = req.body.userId;
  const resetToken = req.body.resetToken;
  const newPassword = req.body.password;
  const newConfirmPassword = req.body.confirmPassword;
  User.findOne({ _id: userId, resetToken: resetToken, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Your time for password renewal has expired! Please, try again.');
        return res.render('auth/new-password', {
          pageTitle: 'New Password',
          path: '/new-password',
          userId: null,
          resetToken: null,
          errorMessage: req.flash('error')[0],
          oldInput: {
            password: newPassword,
            confirmPassword: newConfirmPassword,
          },
        });
      }
      if (newPassword !== newConfirmPassword) {
        req.flash('error', 'Passwords mismatch!');
        return res.render('auth/new-password', {
          pageTitle: 'New Password',
          path: '/new-password',
          userId: userId,
          resetToken: resetToken,
          errorMessage: req.flash('error')[0],
          oldInput: {
            password: newPassword,
            confirmPassword: newConfirmPassword,
          },
        });
      }
      bcrypt.hash(newPassword, 12).then((hashedPassword) => {
        resetUser = user;
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        resetUser.save();
        req.flash('success', 'Password changed successfully.');
        return res.redirect('/');
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.redirect('/');
  });
};
