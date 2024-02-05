const { Int32 } = require("mongodb");
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    unique:true,
 },
  cancelled_orders: {
    type: Date,
    required: true,
    amount:{
        type:Number,
        required:true,
    }
    
  },
  referalAmount: {
    type: Number,
    required: true
  },
  totalAmountWallet: {
    type: Number,
    required:true
  }
});

module.exports = mongoose.model("Wallet", walletSchema);
