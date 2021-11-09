var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const upload = require("../middleware/imageUpload");

const auth = require("../middleware/auth");

module.exports = router;
