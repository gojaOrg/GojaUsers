var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const auth = require("../middleware/auth");
const Post = require("../models/postModel");
const mongoose = require("mongoose");
const upload = require("../middleware/imageUpload");
const ObjectId = mongoose.Types.ObjectId;
var axios = require("axios");

router.get(
  "/",
  /*auth,*/ async (req, res) => {
    axios({
      method: "get",
      url: process.env.POSTS_SERVICE_URL + "/posts",
    }).then(function (response) {
      res.json(response.data);
    });
  }
);

router.get("/:id", auth, async (req, res) => {
  var id = req.params.id;
  var jobs = await Products.find(
    { user: id },
    {
      desc: 1,
      photos: 1,
    }
  );
  res.json(jobs);
});

router.post(
  "/add-jobpictures",
  upload.array("photos", 12),
  function (req, res) {
    var fileLocations = [];
    console.log(req.files);
    for (i = 0; i < req.files.length; i++) {
      fileLocations.push(req.files[i].location);
    }
    res.json(fileLocations);
  }
);
router.post(
  "/add-audio",
  upload.single("audio"),
  auth,
  async function (req, res) {
    var id = req.user._id;
    res.json(req.file.location);
  }
);
router.post("/", auth, async (req, res, next) => {
  console.log(req.body);
  const form = req.body;
  console.log(req.user._id);

  try {
    const post = new Post({
      text: form.text,
      audio: form.audioUrl,
      inReplyToID: form.replyPostId,
      inReplpyToUser: form.replyUserId,
      "user.id": form.user.id,
      "user.friendsCount": form.user.friendsCount,
      "user.profilePicture": form.user.profilePicture,
      "user.following": form.user.following,
    });
    await post.save();
    res.status(200).json(post);
    console.log("Post posted to database");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
