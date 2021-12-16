var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const Followers = require("../models/followers");
const upload = require("../middleware/imageUpload");
const isFollowing = require("../middleware/isFollowing");

const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

router.get("/profile/:id/:me?", isFollowing, async (req, res) => {
  try {
    var user = await User.findById(req.params.id, {
      profileAudio: 1,
      profilePicture: 1,
      userName: 1,
      followerCount: 1,
      followingCount: 1,
      postCount: 1,
      email: 1,
    }).lean();
    if (user) {
      user.isFollowing = req.isFollowing;
      res.json(user);
    } else {
      res.status(401).send("Invalid token");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/followers/:id", async (req, res) => {
  try {
    var followers = await Followers.aggregate([
      {
        $match: {
          "follows._id": ObjectId(req.params.id),
        },
      },
      {
        $project: {
          _id: 0,
          profileAudio: "$user.profileAudio",
          profilePicture: "$user.profilePicture",
          userName: "$user.userName",
          userId: "$user._id",
          isMutualFollowers: 1,
        },
      },
    ]);
    res.json(followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/following/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    var followers = await Followers.aggregate([
      {
        $match: {
          "user._id": ObjectId(req.params.id),
        },
      },
      {
        $project: {
          _id: 0,
          profileAudio: "$follows.profileAudio",
          profilePicture: "$follows.profilePicture",
          userName: "$follows.userName",
          userId: "$follows._id",
          isMutualFollowers: 1,
        },
      },
    ]);
    res.json(followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/following-for-my-feed/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    var followers = await Followers.aggregate([
      {
        $match: {
          "user._id": ObjectId(req.params.id),
        },
      },
      {
        $project: {
          userId: "$follows._id",
        },
      },
    ]);
    res.json(followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/upload-image", upload.single("image"), async function (req, res) {
  res.json(req.file.location);
});

router.post(
  "/signup",
  [
    body("email", "Invalid input").trim().escape().isLength({
      min: 1,
    }),
  ],
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      // Error messages can be returned in an array using `errors.array()`.
      console.log("Found validation errors");
      return res.status(422).json({
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Store in database
      const form = req.body;

      try {
        //find an existing user
        var email = req.body.email.toLowerCase();
        var userName = req.body.userName.toLowerCase();
        let user = await User.findOne({ email: email });
        if (user) {
          return res.status(409).send("Email already registered.");
        }
        let userNameExist = await User.findOne({ userName: userName });
        if (userNameExist) {
          return res.status(409).send("UserName already registered.");
        }

        const newUser = new User({
          userName: form.userName,
          email: email,
          password: form.password,
        });
        newUser.password = await bcrypt.hash(newUser.password, 10);

        await newUser.save();
        const token = await newUser.generateAuthToken();

        res.json({
          token: token,
          user: newUser,
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);
router.post(
  "/login",
  [
    body("email", "Invalid input").trim().escape().isLength({
      min: 1,
    }),
  ],
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      // Error messages can be returned in an array using `errors.array()`.
      console.log("Found validation errors");
      return res.status(422).json({
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Store in database
      const form = req.body;

      try {
        var email = req.body.email.toLowerCase();
        const user = await User.findOne({ email: email });

        // Check if user exist
        if (user) {
          match = await user.comparePassword(user, req.body.password);

          // Check if password matches
          if (match) {
            const token = user.generateAuthToken();
            res.json({
              user: user,
              token: token,
            });
          } else {
            res.status(401).send("email and password doesn't match");
          }
        } else {
          res.status(404).send("User doesn't exist");
        }
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

router.post("/add-profile-picture", async (req, res, next) => {
  console.log(req.body);
  const form = req.body;

  try {
    await User.findByIdAndUpdate(form.userId, {
      profilePicture: form.url,
    });
    res.status(200).send("Profile picture added");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add-profile-audio", async (req, res, next) => {
  console.log(req.body);
  const form = req.body;

  try {
    await User.findByIdAndUpdate(form.userId, {
      profileAudio: form.url,
    });
    res.status(200).send("Profile audio added");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/update-post-count", async (req, res, next) => {
  console.log(req.body);
  const userId = req.body.id;
  try {
    await User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });
    res.status(200).send("Post count updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/follow", async (req, res, next) => {
  console.log(req.body);
  const form = req.body;

  var userToFollowObj = await User.findById(form.userToFollow, {
    profileAudio: 1,
    profilePicture: 1,
    userName: 1,
  });
  var myUserObj = await User.findById(form.userId, {
    profileAudio: 1,
    profilePicture: 1,
    userName: 1,
  });

  try {
    const isFollowingBack = await Followers.findOneAndUpdate(
      {
        "user._id": ObjectId(form.userToFollow),
        "follows._id": ObjectId(form.userId),
      },
      { isMutualFollowers: true },
      { new: true }
    );
    var isMutualFollowers = false;
    if (isFollowingBack) {
      isMutualFollowers = true;
    }
    const follower = new Followers({
      user: myUserObj,
      follows: userToFollowObj,
      isMutualFollowers: isMutualFollowers,
    });
    await follower.save();

    await User.findOneAndUpdate(
      { _id: form.userId },
      { $inc: { followingCount: 1 } }
    );

    await User.findOneAndUpdate(
      { _id: form.userToFollow },
      { $inc: { followerCount: 1 } }
    );
    res.status(200).send("user followed");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unfollow", async (req, res, next) => {
  console.log(req.body);
  const form = req.body;
  try {
    // Set so that logged in user unfollows the selected user
    console.log(form.userId);
    await Followers.deleteOne({
      "user._id": ObjectId(form.userId),
      "follows._id": ObjectId(form.userToUnfollow),
    });
    await Followers.findOneAndUpdate(
      {
        "user._id": ObjectId(form.userToUnfollow),
        "follows._id": ObjectId(form.userId),
      },
      { isMutualFollowers: false }
    );
    await User.findOneAndUpdate(
      { _id: form.userId },
      { $inc: { followingCount: -1 } }
    );
    await User.findOneAndUpdate(
      { _id: form.userToUnFollow },
      { $inc: { followerCount: -1 } }
    );
    res.status(200).send("user unfollowed");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get("/search", async (req, res) => {
  const searchString = req.query.search;
  const regex = new RegExp(escapeRegex(searchString), "gi");
  try {
    await User.find(
      { userName: regex },
      { userName: 1, profilePicture: 1, _id: 1 },
      (error, foundUsers) => {
        if (error) {
          console.log(error);
          res
            .status(500)
            .json({ message: "Something went wrong searching mongoDB" });
        } else {
          res.status(200).json(foundUsers);
        }
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "You fucked up the server" });
  }
});

module.exports = router;
