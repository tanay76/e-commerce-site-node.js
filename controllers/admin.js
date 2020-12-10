const { validationResult } = require('express-validator');
const { Mongoose } = require('mongoose');

const Product = require('../models/product');
const User = require('../models/user');
const fileHelper = require('../util/file');

const ITEMS_PER_PAGE = 2;

exports.getAddProducts = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle:'Add Product', 
    path:'/admin/add-product', 
    editing:false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};


exports.getProducts = (req, res, next) => {
  const page = Number(req.query.page) || 1;
  let totalItems;
  let lastPage;
  Product.find({userId: req.user._id})        // ==> Authorization
    // Product.find()
  .countDocuments()
  .then(productsNum => {
    totalItems = productsNum;
    lastPage = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return Product.find({userId: req.user._id})
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then(products => {
    res.render('admin/products', {
      pageTitle:'Admin Products', 
      path:'/admin/products', 
      prods:products,
      userId: req.user._id,
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

exports.postAddProducts = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  // if (!image) {
  //   return res.status(422).render(
  //     'admin/edit-product', {
  //       pageTitle: 'Add Product',
  //       path: 'admin/add-product',
  //       hasError: true,
  //       editing: false,
  //       product: {
  //         title: title,
  //         price: price,
  //         description: description
  //       },
  //       errorMessage: 'Image should be of .png, .jpg or .jpeg formats only!',
  //       validationErrors: []
  //     }
  //   );
    // return res.json({
    //   errorMessage: 'Image should be of .png, .jpg or .jpeg formats only!',
    //   validationErrors: []
    // });
    // console.log(errors.array());
    // return res.status(422).render(
    //   'admin/edit-product', {
    //     pageTitle: 'Add Product',
    //     path: 'admin/add-product',
    //     hasError: true,
    //     editing: false,
    //     product: {
    //       title: title,
    //       price: price,
    //       description: description
    //     },
    //     errorMessage: errors.array()[0].msg,
    //     validationErrors: errors.array()
    //   }
    // );

  const imageUrl = image.path;
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: req.user
  });
  product.save()
  .then(() => {
    res.redirect('/admin/products');
  })
  .catch(err => {
    // console.log('Error in saving product');
    return next(new Error(err));
  });
};

exports.getEditProduct = (req, res, next) => {    
  const editMod = req.query.edit;
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
    res.render('admin/edit-product', {
      pageTitle: product.title,
      path:'edit-product',
      editing:editMod,
      hasError: false,
      product: product,
      errorMessage: null,
      validationErrors: []
    });
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};

exports.postEditProduct = (req, res, next) => {         
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImage = req.file;
    const updatedPrice = req.body.price;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render(
        'admin/edit-product', {
          pageTitle: 'Add Product',
          path: 'admin/edit-product',
          hasError: true,
          editing: true, 
          product: {
            _id: prodId,
            title: updatedTitle,
            price: updatedPrice,
            description: updatedDesc
          },
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array()
        }
      );
    }
    Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {  // ==> Authorization
        return res.redirect('/');
      }
      product.title = updatedTitle;
      if (updatedImage) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = updatedImage.path;
      }
      product.price = updatedPrice;
      product.description = updatedDesc;
      return product.save()
      .then(() => {
        res.redirect('/admin/products');
      })
    })
    .catch(err => {
      return next(new Error(err));
    }); 
};

exports.postDeleteProduct = (req, res, next) => {  
  const prodId = req.body.prodId;
  const userId = req.body.userId;
  // console.log('1: ', prodId);

  Product.findById(prodId)
  .then(product => {
    if (!product) {
      // console.log('Product not Found!');
      // console.log('User1 ID: ', userId);
      return next(new Error('Product not Found.'));
    }
    ///////////////////////////////////////////////////////////////////////////////////
    //  This code is for                                                             //
    //  ⏬    deletion of the said product from the products collection             //
    //  ⏬                                                                          //
    //////////////////////////////////////////////////////////////////////////////////
    // console.log('User ID: ', userId);
    fileHelper.deleteFile(product.imageUrl);
    return Product.deleteOne({_id: prodId, userId: userId})  // ==> Authorization
    .then(() => {
      ///////////////////////////////////////////////////////////////////////////////////
      //  To remove the Cart Item having the 'productId' same as the prodId on         //
      //  🔻    deletion of the said product from the products collection             //
      //  🔻                                                                          //
      //////////////////////////////////////////////////////////////////////////////////
      User.find()
      .then(users => {
        let usersArr = [];
        for(let user of users) {
          for (let item of user.cart.items) {
            if (item.productId.toString() === prodId.toString()) {
              usersArr.push(user);
            }
          }
        }
        for (let u of usersArr) {
          u.deleteCartItem(prodId);        //◀--- This is declared in User Model
        }
      })
      ///////////////////////////////////////////////////////////////////////////////////
      // OR To remove the Cart Item having the 'productId' same as the prodId on       //
      //  ⏬    deletion of the said product from the products collection             //
      //  ⏬                                                                          //
      //////////////////////////////////////////////////////////////////////////////////
      // User.find()
      // .then(users => {
        // console.log('Users: ', users);
      //   for (let user of users) {
      //     const updatedCartItems = user.cart.items.filter(i =>{
      //       return i.productId.toString() !== prodId;
      //     });
          // console.log('Updated Cart Items: ', updatedCartItems);
      //     user.cart.items = updatedCartItems;
      //     return user.save();
      //   }
      // })
      // return res.redirect('/admin/products');
      // console.log('Deleted Successfully!');
      return res.json({
        message: 'Successfully Deleted.'
      });
    })
  })
  .catch(err => {
    return next(new Error(err));
  }); 
};