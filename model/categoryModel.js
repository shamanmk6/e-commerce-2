const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  offer: {
    type: String,
    required: true,
  },
  offerStart: {
    type: String,
    required: true,
  },
  offerEnd: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);
