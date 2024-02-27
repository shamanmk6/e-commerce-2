const { Int32, ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  cancelledOrders: {
    type: Date,
    required: true,
    orderId: {
      type: ObjectId,
      required: true,
    },
    order: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  referalAmount: {
    type: Number,
    required: true,
  },
  totalAmountWallet: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Wallet", walletSchema);
