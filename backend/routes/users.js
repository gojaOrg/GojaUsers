var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const Followed = require("../models/followed");
const Following = require("../models/following");

const upload = require("../middleware/imageUpload");

const auth = require("../middleware/auth");
const { response } = require("express");

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
        let user = await User.findOne({ email: email });
        if (user) return res.status(400).send("User already registered.");

        const newUser = new User({
          userName: form.userName,
          email: email,
          password: form.password,
        });
        newUser.password = await bcrypt.hash(newUser.password, 10);

        await newUser.save();
        const token = await newUser.generateAuthToken();

        res.send({
          token: token,
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
            res.send({
              token: token,
            });
          } else {
            res.status(401).send("email and password doesn't match");
          }
        } else {
          res.status(400).send("User doesn't exist");
        }
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

router.post("/follow", async (req, res, next) => {
  console.log(req.body);
  const form = req.body;

  try {
    // Set so that logged in user follows the selected user
    const following = await Following.findOneAndUpdate(
      {
        userId: form.userId,
      },
      { $push: { following: form.userToFollow } }
    );
    if (!following) {
      const following = new Following({
        userId: form.userId,
        following: [form.userToFollow],
      });
      await following.save();
    }

    // Set so that the selected user is followed by the logged in user

    const followed = await Followed.findOneAndUpdate(
      {
        userId: form.userToFollow,
      },
      { $push: { followed: form.userId } }
    );
    if (!followed) {
      const followed = new Followed({
        userId: form.userToFollow,
        followed: [form.userId],
      });
      await followed.save();
    }
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
    await Following.updateOne(
      {
        userId: form.userId,
      },
      { $pull: { following: form.userToUnfollow } }
    );

    // Set so that the selected user is no longer followed by the logged in user
    await Followed.updateOne(
      {
        userId: form.userToUnfollow,
      },
      { $pull: { followed: form.userId } }
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
    await User.find({ userName: regex }, (error, foundUsers) => {
      if (error) {
        console.log(error);
        res
          .status(500)
          .json({ message: "Something went wrong searching mongoDB" });
      } else {
        res.status(200).json(foundUsers);
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "You fucked up the server" });
  }
});

module.exports = router;
