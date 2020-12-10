const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

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
  .then(productsNum => {
    totalItems = productsNum;
    lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then(products => {
    res.render('shop/index', {
      pageTitle:'Shop', 
      path:'/',
      successMessage: message, 
      prods:products,
      totalProducts: totalItems,
      currentPage: page,
      hasNextPage: page < lastPage,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: lastPage
    });
  })
  .catch(err => {
    return next(new Error(err));
  }); 
}

exports.getAllProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  let totalItems;
  let lastPage;
  Product.find()
  .countDocuments()
  .then(productsNum => {
    totalItems = productsNum;
    lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then(products => {
    res.render('shop/product-list', {
      pageTitle:'Products', 
      path:'/products',
      prods:products,
      totalProducts: totalItems,
      currentPage: page,
      hasNextPage: page < lastPage,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: lastPage
    });
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.getSpecificProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
    res.render('shop/product-detail', {
      pageTitle: product.title, 
      path:'/products', 
      product:product
    });
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId')
  .execPopulate()
  .then(user => {
    res.render('shop/cart', {
      pageTitle: 'Your Cart',
      path: '/cart',
      products: user.cart.items
    });
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.postCart = (req, res, next) => { 
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    return req.user.addToCart(product);
  })
  .then(result => {
    res.redirect('/cart');
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.postDeleteCartItem = (req, res, next) => {    
  const prodId = req.body.productId;
  req.user.deleteCartItem(prodId)
  .then(() => {
    res.redirect('/cart');
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
  .then(orders => {
    res.render('shop/orders', {
      pageTitle:'Your Orders', 
      path:'/orders',
      orders: orders
    });
  })
};

exports.postOrders = (req, res, next) => {
  req.user.populate('cart.items.productId')
  .execPopulate()
  .then(_user => {
    const products = _user.cart.items.map(i => {
      return {product: {...i.productId._doc}, quantity: i.quantity}
    });
    const user = {userId: req.user._id , email: req.user.email};
    const order = new Order ({products: products, user: user});
    return order.save(); 
  })
  .then(result => {
    return req.user.clearCart();
  })
  .then(() => {
    res.redirect('/orders');
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if (!order) {
      return next(new Error('Order Not Found!'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
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
      underline: true
    });
    pdfDoc.text('_____________________________________________');
    pdfDoc.fontSize(26).text('Invoice:', {
      underline: true
    });
    pdfDoc.text('---------------------------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(12).text(prod.product.title + ' - ' + prod.quantity + ' X $' + prod.product.price);
    });
    pdfDoc.text('______________________________________');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
    pdfDoc.end();
  })
  .catch(err => next(new Error(err)));
};