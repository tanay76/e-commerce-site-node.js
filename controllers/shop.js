const fs = require('fs');
const https = require('https');
const path = require('path');

require('dotenv').config();

const chalk = require('chalk');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const Payment = require('../models/payment');

const PaytmChecksum = require('../Paytm/checksum');
const PaytmConfig = require('../Paytm/config');


const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
  let message = req.flash('success');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  const page = Number(req.query.page) || 1;
  let totalItems;
  let lastPage;
  Product.find()
    .countDocuments()
    .then((productsNum) => {
      totalItems = productsNum;
      lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        pageTitle: 'Shop',
        path: '/',
        successMessage: message,
        prods: products,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: lastPage,
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getAllProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  let totalItems;
  let lastPage;
  Product.find()
    .countDocuments()
    .then((productsNum) => {
      totalItems = productsNum;
      lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        pageTitle: 'Products',
        path: '/products',
        prods: products,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: lastPage,
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getSpecificProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        pageTitle: product.title,
        path: '/products',
        product: product,
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products: user.cart.items,
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postDeleteCartItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteCartItem(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      // console.log(products);
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        userId: req.user._id,
        totalSum: total.toFixed(2), // This will limit the price upto 2 decimal places
      });
    })
    .catch((err) => {
      return next(new Error(err));
    });
};

exports.postProceed = (req, res, next) => {
  let order;
  let productIds = [];
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((_user) => {
      const products = _user.cart.items.map((i) => {
        return { product: { ...i.productId._doc }, quantity: i.quantity };
      });
      const user = { userId: req.user._id, email: req.user.email };
      order = new Order({ products: products, user: user, status: 'pending', pod: false, deleted: false });
      return order.save();
    })
    .then(order => {
      req.user.clearCart();
      //Handle order creation and initiate transaction here

      // const orderId = 'TEST_' + new Date().getTime();
      const orderId = order._id.toString();

      var paytmParams = {};

      paytmParams.body = {
        requestType: 'Payment',
        mid: PaytmConfig.PaytmConfig.mid,
        websiteName: PaytmConfig.PaytmConfig.website,
        channelId: 'WEB',
        orderId: orderId,
        callbackUrl: 'http://localhost:3000/paytm/callback',
        txnAmount: {
          value: req.body.amount,
          currency: 'INR',
        },
        userInfo: {
          custId: req.user._id.toString(),
        },
      };
      // console.log('HEY:NAI ');

      PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        PaytmConfig.PaytmConfig.key
      ).then(function (checksum) {
        paytmParams.head = {
          signature: checksum,
        };

        var post_data = JSON.stringify(paytmParams);

        var options = {
          /* for Staging */
          hostname: 'securegw-stage.paytm.in',

          /* for Production */
          // hostname: 'securegw.paytm.in',

          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length,
          },
        };

        var response = '';
        var post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
            response += chunk;
          });

          post_res.on('end', function () {
            response = JSON.parse(response);
            // console.log('txnToken:', response);

            // res.cookie('cookieName', undefined, { maxAge: 900000, httpsOnly: true });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`<html>
                <head>
                    <title>Show Payment Page</title>
                </head>
                <body>
                    <center>
                        <h1>Please do not refresh this page...</h1>
                    </center>
                    <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}" name="paytm">
                        <table border="1">
                            <tbody>
                                <input type="hidden" name="mid" value="${PaytmConfig.PaytmConfig.mid}">
                                    <input type="hidden" name="orderId" value="${orderId}">
                                    <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                          </tbody>
                      </table>
                                    <script type="text/javascript"> document.paytm.submit(); </script>
                    </form>
                </body>
              </html>`);
            res.end();
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
    });
};

exports.postComplete = (req, res, next) => {

  const orderId = '@'+req.body.orderId.toString();

  var paytmParams = {};

  paytmParams.body = {
    requestType: 'Payment',
    mid: PaytmConfig.PaytmConfig.mid,
    websiteName: PaytmConfig.PaytmConfig.website,
    channelId: 'WEB',
    orderId: orderId,
    callbackUrl: 'http://localhost:3000/paytm/callback',
    txnAmount: {
      value: req.body.amount,
      currency: 'INR',
    },
    userInfo: {
      custId: req.body.userId.toString(),
    },
  };

  /*
   * Generate checksum by parameters we have in body
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  PaytmChecksum.generateSignature(
    JSON.stringify(paytmParams.body),
    PaytmConfig.PaytmConfig.key
  ).then(function (checksum) {
    paytmParams.head = {
      signature: checksum,
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {
      /* for Staging */
      hostname: 'securegw-stage.paytm.in',

      /* for Production */
      // hostname: 'securegw.paytm.in',

      port: 443,
      path: `/theia/api/v1/initiateTransaction?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length,
      },
    };

    var response = '';
    var post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });

      post_res.on('end', function () {
        response = JSON.parse(response);
        // console.log('txnToken: ', response);

        // res.cookie('cookieName', undefined, { maxAge: 900000, httpsOnly: true });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(`<html>
                <head>
                    <title>Show Payment Page</title>
                </head>
                <body>
                    <center>
                        <h1>Please do not refresh this page...</h1>
                    </center>
                    <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${PaytmConfig.PaytmConfig.mid}&orderId=${orderId}" name="paytm">
                    
                        <table border="1">
                          <tbody>
                                <input type="hidden" name="mid" value="${PaytmConfig.PaytmConfig.mid}">
                                <input type="hidden" name="orderId" value="${orderId}">
                                <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                          </tbody>
                        </table>
                                    <script type="text/javascript"> document.paytm.submit(); </script>
                    </form>
                </body>
              </html>`);
        res.end();
      });
    });
    post_req.write(post_data);
    post_req.end();
  });
};

exports.getPayOnDelv = (req, res, next) => {
  if (req.params.orderId == 'null') {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((_user) => {
      const products = _user.cart.items.map((i) => {
        return { product: { ...i.productId._doc }, quantity: i.quantity };
      });
      const user = { userId: req.user._id, email: req.user.email };
      order = new Order({ products: products, user: user, status: 'pending', pod: true, deleted: false });
      return order.save();
    })
    .then(order => {
      req.user.clearCart();
      return res.redirect('/orders');
    })
    .catch(err => {next(new Error(err))});
  } else {
    const orderId = req.params.orderId;
    Order.findOne({_id: orderId})
    .then(order => {
      order.pod = true;
      return order.save();
    })
    .then(result => {
      return res.redirect('/orders');
    })
    .catch(err => {next(new Error(err))});
  }
};

exports.getOrders = (req, res, next) => {
  let updatedOrders = [];
  let payments_list = [];
  Order.find({'user.userId': req.user._id}).then((orders) => {
    let totalPrice = 0;
    if (orders.length > 0) {
      orders.forEach((order) => {
        if (order.deleted == false) {
          updatedOrders.push(order);
        }
        order.products.forEach((prod) => {
          totalPrice += prod.quantity * prod.product.price;
        })
        Payment.find({'userId': order.user.userId})
        .then(payment => {
        payments_list.push(...payment);
        })
        .then(result => {
          res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders: updatedOrders,
            payList: payments_list,
            payment: payments_list[payments_list.length - 1],
            totalSum: totalPrice.toFixed(2),
          })
        })
      });
    } else {
      res.render('shop/orders', {
        pageTitle: 'Your Orders',
        path: '/orders',
        orders: orders,
      })
    }
  });
};

exports.getDelOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findOne({_id: orderId})
  .then(order => {
    order.deleted = true;
    return order.save();
  })
  .then(order => {
    res.redirect('/orders');
  })
  .catch(err => {next(new Error(err))});
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findOne({_id: orderId})
    .then((order) => {
      if (!order) {
        console.log('ERROR@ ', 'Order Not found');
        return next(new Error('Order Not Found!'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        console.log('ERROR#: ', 'You are unauthorized');
        return next(new Error('You Are Unauthorized!'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);
      // Now for small files & if file already exists//
      // ============================================//
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      //   res.send(data);
      // });
      // ========================================================================================//
      // For Large Files & if the file already exists //
      // =============================================//
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      // file.pipe(res);
      // =========================================================================================//
      // To create files on the fly according to the orders placed //
      // First of all, npm install --save pdfkit then: //
      // ==========================================================//
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(35).text('SHOP APP', {
        underline: true,
      });
      if (order.status == 'successful') {
        pdfDoc.fontSize(15).text('Payment for your Order Id ' + orderId + ' is successful!');
      } else if (order.status == 'pending' && order.pod == true) {
        pdfDoc.fontSize(15).text('Payment mode for your Order Id ' + orderId + ' is Pay On Delivery!');
      }
      pdfDoc.text('_____________________________________________');
      pdfDoc.fontSize(26).text('Invoice:', {
        underline: true,
      });
      pdfDoc.text('---------------------------------------------');
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(12)
          .text(prod.product.title + ' - ' + prod.quantity + ' X $' + prod.product.price.toFixed(2));
      });
      pdfDoc.text('______________________________________');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice.toFixed(2));
      pdfDoc.text('______________________________________');
      if (order.status == 'successful') {
        pdfDoc.fontSize(15).text('Your Transaction Id: ' + order.txnId + '. Date of payment: ' + order.txnDate + ', your Bank Name: ' + order.bankName + ' & your Bank Transaction Id: ' + order.bankTxnId + '.');
      } else if (order.status == 'pending' && order.pod == true) {
        pdfDoc.fontSize(15).text('On delivery you can pay in cash or can use any Card for payment');
      }
      pdfDoc
        .fontSize(08)
        .text('*You can cancel your order immediately within 1 hour of placing it.');
      pdfDoc
        .fontSize(08)
        .text(
          '*If you find anything wrong with the product/products delivered to you, you can return the same and ask for a refund within 7 days from the delivery date.'
        );
      pdfDoc.end();
    })
    .catch((err) => next(new Error(err)));
};