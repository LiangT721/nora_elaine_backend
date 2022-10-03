const path = require("path");
const fs = require('fs');
const env = require("./env")

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const paintingsRoutes = require("./routes/paintings-routes");
const userRoutes = require("./routes/users-routers");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accpet, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/upload/images", express.static(path.join("upload", "images")));

app.use("/api/paintings", paintingsRoutes);

app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if(req.file) {
    fs.unlink(req.file.path, err=>{
    })
  }
  if(req.files) {
    fs.unlink(req.files.image[0].path, err=>{
    })
    fs.unlink(req.files.imagePreview[0].path, err=>{
    })
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unkown error occured!" });
});

const url =
  `mongodb+srv://${env.DB.USER}:${env.DB.PASSWORD}@liangtangspace.t5eailr.mongodb.net/${env.DB.NAME}?retryWrites=true&w=majority`;
mongoose
  .connect(url)
  .then(() => {
    app.listen(env.DB.PORT);
  })
  .catch((err) => {
    console.log(err);
  });
