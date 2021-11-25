const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcrypt");

const FollowersSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  followers: {
    type: [
      {
        id: mongoose.Schema.Types.ObjectId,
        profileAudio: String,
        profilePicture: String,
        userName: String,
      },
    ],
  },
});

module.exports = Followers = mongoose.model("followers", FollowersSchema);
