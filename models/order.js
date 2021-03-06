const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      product: {type: Object, required: true},
      quantity: {type: Number, required: true}
    }
  ],
  user: {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required:true},
    email: {type: String, required: true}
  },
  status: {
    type: String,
    required: true
  },
  pod: {type: Boolean, required: true},    // pay on delivery
  txnId: {type: String},
  txnDate: {type: String},
  bankName: {type: String},
  bankTxnId: {type: String},
  deleted: {type: Boolean, required: true},
  payment_tried_but_failed: {type: Boolean}
});

module.exports = mongoose.model('Order', orderSchema);