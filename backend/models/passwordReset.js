const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PasswordReset = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  created_date: { type: Date, default: Date.now },
});

module.exports = PastJobs = mongoose.model("PasswordReset", PasswordReset);
