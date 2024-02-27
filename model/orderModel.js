const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  userId: {
    type: ObjectId,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  products: [{
    item: {
      type: ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    required: true
  },
  appliedCoupon:{
    type: String,
    required: true
  },
  deliveryDetails: {
    name: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  date: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("Order", orderSchema);

