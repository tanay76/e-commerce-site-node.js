const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {type: String,  required: true},
  mid: {type: String, required: true},
  txnId: {type: String, required: true},
  txnAmt: {type: Number, required: true},
  paymentMode: {type: String},
  currency: {type: String},
  txnDate: {type: String},
  txnStatus: {type: String, required: true},
  respCode: {type: String, required: true},
  respMsg: {type: String, required: true},
  gatewayName: {type: String},
  bankTxnId: {type: String, required: true},
  bankName: {type: String, required: true},
  checksumHash: {type: String, required:true},
});

module.exports = mongoose.model('Payment', paymentSchema);