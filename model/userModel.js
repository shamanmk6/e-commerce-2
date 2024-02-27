const { Int32 } = require("mongodb");
const mongoose = require("mongoose");
const { array } = require("../middlewares/upload");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  pincode: {
    type: String,
    default: null,
  },
  mobile: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  appliedCoupons: {
    type: Array,
    unique: true,
    default:null,
  },
  referalCode: {
    type: String,
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  addresses:{
    type:Array,
    default:false,
  }
});

module.exports = mongoose.model("user", userSchema);
