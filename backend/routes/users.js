var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const upload = require("../middleware/imageUpload");

const auth = require("../middleware/auth");

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

module.exports = router;
