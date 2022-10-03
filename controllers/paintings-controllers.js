const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Expiry_date = require("../middleware/expiration");
const Painting = require("../models/painting");
const User = require("../models/user");
const Sess = require("../models/sess");
const date = require("../middleware/get_date");
const user = require("../models/user");

const fetchPainting = async (req, res, next) => {
  console.log("start fetch");
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not fetch users",
      500
    );
    return next(error);
  }
  let lists = {};

  try {
    lists.nora = await Painting.find({ user: users[0].id }).limit(10).sort( { "created_date": -1 } )
  }catch(err){
    console.log(err)
  }
  try {
    lists.elaine = await Painting.find({ user: users[1].id }).limit(10).sort( { "created_date": -1 } )
  }catch(err){
    console.log(err)
  }

  res.json({lists:lists})
};

const createPainting = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const {
    token,
    id,
    name,
    created_date,
    category,
    content,
    key_word_1,
    key_word_2,
  } = req.body;
  // console.log(req.body);

  let session;
  try {
    console.log("start finded session");
    session = await Sess.findOne({ sess: token });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not fetch session",
      500
    );
    return next(error);
  }

  if (
    session === null ||
    !Expiry_date.compare_expiry_date(session.expiry_date)
  ) {
    const error = new HttpError("session is not exist", 404);
    return next(error);
  }

  let user;
  // console.log(id);
  try {
    user = await User.findOne({ _id: id }, "-password");
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User is not exist", 404);
    return next(error);
  }

  // console.log(user);

  // if (
  //   session.username !== user._id
  // ) {
  //   console.log("sss")
  //   const error = new HttpError("Please relogin", 500);
  //   return next(error);
  // }

  const createdPainting = new Painting({
    user: user._id,
    creator: user.creator,
    name: name,
    created_date,
    upload_date: date(),
    category,
    content,
    image: req.files.image[0].path,
    imagePreview: req.files.imagePreview[0].path,
    key_word_1,
    key_word_2,
  });

  console.log(createdPainting);

  try {
    console.log("start save");
    const sess = await mongoose.startSession();
    sess.startTransaction();
    console.log("start tranction");
    await createdPainting.save({ session: sess });
    console.log("place saved");
    user.paintings.push(createdPainting);
    console.log("place pushed");
    await user.save({ session: sess });
    console.log("user saved");
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating painting failed, please try again.",
      500
    );
    return next(error);
  }
  res.status(201).json({ painting: createdPainting });
};

exports.createPainting = createPainting;
exports.fetchPainting = fetchPainting;
