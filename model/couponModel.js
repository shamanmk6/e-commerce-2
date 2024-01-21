const { Int32 } = require("mongodb");
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique:true,
    upperCase:true,
  },
  expiry: {
    type: Date,
    required: true,
    
  },
  discount: {
    type: Number,
    required:true
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
