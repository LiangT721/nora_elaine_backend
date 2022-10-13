const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Expiry_date = require("../middleware/expiration");
const Painting = require("../models/painting");
const User = require("../models/user");
const Sess = require("../models/sess");
const { get_time } = require("../middleware/get_date");
const bcrypt = require("bcrypt");

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
    lists.nora = await Painting.find({ user: users[0].id })
      .limit(5)
      .sort({ created_date: -1 });
  } catch (err) {
    console.log(err);
  }
  try {
    lists.elaine = await Painting.find({ user: users[1].id })
      .limit(5)
      .sort({ created_date: -1 });
  } catch (err) {
    console.log(err);
  }

  res.json({ lists: lists });
};
const fetchPaintingByUser = async (req, res, next) => {
  console.log("start fetch by user");
  const param = req.params.uid;
  const paramArr = param.split("^");
  const userId = paramArr[0];
  const skip = paramArr[1];
  console.log(skip);

  let paintinglist;
  try {
    paintinglist = await Painting.find({ user: userId })
      .sort({ created_date: -1, _id: -1 })
      .limit(15)
      .skip(skip);
  } catch (err) {
    console.log(err);
  }

  res.status(200).json({ paintingList: paintinglist });
};

const fetchPaintingByCategory = async (req, res, next) => {
  const param = req.params.content;
  const paramArr = param.split("^");
  const user = paramArr[0];
  const condition = paramArr[1];
  console.log(user);
  console.log(condition);
  let painitingList;
  if (user) {
    console.log("try");
    try {
      painitingList = await Painting.find({
        $and: [
          { user: user },
          { category: { $regex: condition, $options: "<options>" } }
        ]
      });
      // painitingList = await Painting.find({ name:  { $regex: condition, $options: '<options>' } });
    } catch (err) {
      console.log(err);
    }
    res.status(200).json({ paintingList: painitingList });
  }
};

const fetchPaintingByCondition = async (req, res, next) => {
  const param = req.params.content;
  const paramArr = param.split("^");
  const user = paramArr[0];
  const condition = paramArr[1];
  console.log(user);
  console.log(condition);
  let painitingList;
  if (user) {
    try {
      painitingList = await Painting.find({
        $and: [
          { user: user },
          {
            $or: [
              { name: { $regex: condition, $options: "<options>" } },
              { content: { $regex: condition, $options: "<options>" } },
              { key_word_1: { $regex: condition, $options: "<options>" } },
              { key_word_2: { $regex: condition, $options: "<options>" } }
            ]
          }
        ]
      });
      // painitingList = await Painting.find({ name:  { $regex: condition, $options: '<options>' } });
      console.log(painitingList);
    } catch (err) {
      console.log(err);
    }
    res.status(200).json({ paintingList: painitingList });
  }
};

const fetchKeywordGroup = async (req, res, next) => {
  let keywordList = [];

  try {
    let keyword1 = await Painting.aggregate([
      { $group: { _id: "$key_word_1", count: { $count: {} } } }
    ]);
    let keyword2 = await Painting.aggregate([
      { $group: { _id: "$key_word_2", count: { $count: {} } } }
    ]);
    let name = await Painting.aggregate([
      { $group: { _id: "$name", count: { $count: {} } } }
    ]);
    let content = await Painting.aggregate([
      { $group: { _id: "$content", count: { $count: {} } } }
    ]);
    let list = [...keyword1, ...keyword2, ...name, ...content];
    keywordList = removeDuplicate(list);
    console.log(keywordList);
    res.status(200).json({ keywordList: keywordList });
  } catch (err) {
    console.log(err);
  }
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
    key_word_2
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
    upload_date: get_time(),
    category,
    content,
    // image: 111,
    // imagePreview: 222,
    image: req.files.image[0].path,
    imagePreview: req.files.imagePreview[0].path,
    key_word_1,
    key_word_2
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

const updatePainting = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { token, userid, id, name, category, content, key_word_1, key_word_2 } =
    req.body;
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

  let painting;
  try {
    painting = await Painting.findById(id);
  } catch (err) {
    const error = new HttpErrpr(
      "Something went wrong, Could not find painting.",
      500
    );
    return next(error);
  }

  if (painting.user.toString() !== userid) {
    const error = new HttpError(
      "You are not allowed to edit this painting.",
      401
    );
    return next(error);
  }

  painting.name = name;
  painting.category = category;
  painting.content = content;
  painting.key_word_1 = key_word_1;
  painting.key_word_2 = key_word_2;

  try {
    console.log("start save");
    await painting.save();
  } catch (err) {
    const error = new HttpError(
      "update painting failed, please try again.",
      500
    );
    return next(error);
  }
  res.status(201).json({ painting: painting });
};

const deletePainting = async (req, res, next) => {
  console.log("start delete");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { token, userid, id, password } = req.body;

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
  try {
    user = await User.findById(userid);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, Could not find user.",
      500
    );
    return next(error);
  }
  if (!user) {
    return next(
      new HttpError("Something went wrong, Could not find user.", 404)
    );
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return next(new HttpError("password invalid", 404));
  }

  let painting;
  try {
    painting = await Painting.findById(id);
  } catch (err) {
    const error = new HttpErrpr(
      "Something went wrong, Could not find painting.",
      500
    );
    return next(error);
  }

  if (painting.user.toString() !== userid) {
    const error = new HttpError(
      "You are not allowed to edit this painting.",
      401
    );
    return next(error);
  }

  const imagePath = painting.image;
  const imagePreviewPath = painting.imagePreview;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    console.log("start");
    await painting.remove({ session: sess });
    user.paintings.pull(painting);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, Could not delete painting.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  fs.unlink(imagePreviewPath, (err) => {
    console.log(err);
  });

  res.status(201).json({ message: "delete successfully" });
};

const removeDuplicate = (arr) => {
  let list = [];
  arr.map((el) => {
    let include = false;
    list.forEach((ob) => {
      if (ob._id === el._id) {
        ob.count += el.count;
        include = true;
      }
    });
    !include && el._id !== "" && list.push(el);
  });
  list.sort((a, b) => b.count - a.count);
  return list.slice(0, 15);
};

exports.createPainting = createPainting;
exports.fetchPainting = fetchPainting;
exports.fetchPaintingByUser = fetchPaintingByUser;
exports.fetchPaintingByCondition = fetchPaintingByCondition;
exports.fetchKeywordGroup = fetchKeywordGroup;
exports.fetchPaintingByCategory = fetchPaintingByCategory;
exports.updatePainting = updatePainting;
exports.deletePainting = deletePainting;
