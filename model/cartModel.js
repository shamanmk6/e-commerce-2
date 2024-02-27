const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type:ObjectId,
    required: true
  },
  products: [{
    item: {
      type:ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  }]
});

module.exports = mongoose.model("Cart", cartSchema);
