const multer = require("multer");

const { v4: uuid } = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg"
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(file.fieldname);
      // file.fieldname === "image";
      switch (file.fieldname) {
        case "image":
          console.log('a')
          cb(null, "upload/images/paintings");
          console.log('b')
          break;
        case "imagePreview":
          cb(null, "upload/images/paintings/preview");
          break;
        case "icon":
          cb(null, "upload/images/icons");
          break;
        default:
          cb(null, "upload/images/painting");
          break;
      }
      // cb(null, "upload/images");
    },
    filename: (req, file, cb) => {
      console.log('c')
      const ext = MIME_TYPE_MAP[file.mimetype];
      console.log('d')
      console.log(cb)
      cb(null, uuid() + "." + ext);
      console.log("e")
    }
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  }
});

module.exports = fileUpload;
