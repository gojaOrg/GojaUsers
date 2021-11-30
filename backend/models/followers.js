const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcrypt");

const FollowerSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  user: {
    type: {
      id: mongoose.Schema.Types.ObjectId,
      profileAudio: String,
      profilePicture: String,
      userName: String,
    },
  },
  follows: {
    type: {
      id: mongoose.Schema.Types.ObjectId,
      profileAudio: String,
      profilePicture: String,
      userName: String,
    },
  },
  isMutualFollowers: {
    type: Boolean,
    default: false,
  },
});

module.exports = Followers = mongoose.model("followers", FollowerSchema);
