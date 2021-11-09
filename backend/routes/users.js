var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const upload = require("../middleware/imageUpload");

const auth = require("../middleware/auth");

// Create user for the first time
router.post(
  "/add-profile-picture",
  upload.single("image"),
  auth,
  async function (req, res) {
    console.log("HIHIIHI");
    var id = req.user._id;
    var userType;
    const user = await User.findById(req.user._id);

    let update = { profilePicture: req.file.location };
    User.findByIdAndUpdate(id, update, { new: true })
      .then((user) =>
        res.status(200).json({ success: true, picURL: user.profilePicture })
      )
      .catch((err) => res.status(400).json({ success: false, error: err }));
  }
);
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
          _id: newUser._id,
          token: token,
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

module.exports = router;
