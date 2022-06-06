const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: process.env.S3_ACCESS_SECRET,
  accessKeyId: process.env.S3_ACCESS_KEY,
  region: "eu-north-1",
});

const s3 = new aws.S3();

// Validating the file type

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "audio/mp3") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
  }
};

// Multer proccesses the image and sends it to S3

const upload = multer({
  // fileFilter,
  storage: multerS3({
    acl: "public-read",
    s3,
    bucket: "goja-images",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: "TESTING_METADATA" });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

module.exports = upload;
