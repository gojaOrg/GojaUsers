const jwt = require("jsonwebtoken");
const Followers = require("../models/followers");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

module.exports = async function (req, res, next) {
  try {
    var follows = await Followers.find({
      "user._id": ObjectId(req.params.me),
      "follows._id": ObjectId(req.params.id),
    });
    if (follows.length > 0) {
      req.isFollowing = true;
    } else {
      req.isFollowing = false;
    }
    console.log(follows);
    next();
  } catch (e) {
    console.error(e.message);
    res.status(401).send("Something went wrong");
  }
};
