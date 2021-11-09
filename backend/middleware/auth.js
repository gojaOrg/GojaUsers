const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = async function (req, res, next) {
  try {
    let token = req.cookies["x-auth-token"];
    if (token) {
      const decode = jwt.verify(token, process.env.MY_KEY);
      req.user = decode;
      req.token = token;
      next();
    } else {
      // cookie not found redirect to login
      //return res.redirect("/login");
      console.log("cookie not found");
      res.status(400).send("You are not logged in");
    }
  } catch (e) {
    console.error(e.message);
    res.status(401).send("Expired token");
  }
};
