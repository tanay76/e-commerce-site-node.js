// const qs = require('querystring');
// const https = require('https');

// const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Payment = require('../models/payment');


exports.postCallback = (req, res, next) => {
  let payment;
  
  const trans_orderId = req.body.ORDERID;
  const trans_mid = req.body.MID;
  const trans_id = req.body.TXNID;
  const trans_amt = req.body.TXNAMOUNT;
  const trans_payment_mode = req.body.PAYMENTMODE;
  const trans_currency = req.body.CURRENCY;
  const trans_date = req.body.TXNDATE;
  const trans_status = req.body.STATUS;
  const trans_resp_code = req.body.RESPCODE;
  const trans_resp_msg = req.body.RESPMSG;
  const trans_gateway_name = req.body.GATEWAYNAME;
  const trans_bank_trans_id = req.body.BANKTXNID;
  const trans_bank_name = req.body.BANKNAME;
  const trans_checksumHash = req.body.CHECKSUMHASH;
  // console.log('Transaction Date: ',trans_date);
  Order.findOne({_id: trans_orderId}).then(order => {
    const userId = order.user.userId;
    payment = new Payment({
      userId: userId,
      orderId: trans_orderId,
      mid: trans_mid,
      txnId: trans_id,
      txnAmt: trans_amt,
      paymentMode: trans_payment_mode,
      currency: trans_currency,
      txnDate: trans_date,
      txnStatus: trans_status,
      respCode: trans_resp_code,
      respMsg: trans_resp_msg,
      gatewayName: trans_gateway_name,
      bankTxnId: trans_bank_trans_id,
      bankName: trans_bank_name,
      checksumHash: trans_checksumHash
    });
    if (trans_status === 'TXN_SUCCESS') {
      order.status = 'successful';
      order.txnId = trans_id.split('@').join('');
      order.txnDate = trans_date;
      order.bankName = trans_bank_name;
      order.bankTxnId = trans_bank_trans_id;
      order.save();
      // console.log('Product: ', order.products.product);
    }
    // console.log('USER_ID: ', userId);
    return payment.save()
    .then(result => {
      res.render('shop/payment-status', {
        pageTitle: 'Your Payment Status',
        path: '/payment-status',
        orderId: trans_orderId,
        bankName: trans_bank_name,
        date: trans_date,
        txnStatus: trans_status,
        msg: trans_resp_msg,
        txnId: trans_id,
        bankTxnId: trans_bank_trans_id,
        userId: userId,
      });
    })
  })
  .catch(err => {
    console.log('ERROR: ', err);
    // return next(new Error(err));
  });
};