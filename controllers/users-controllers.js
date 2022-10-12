const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const HttpError = require("../models/http-error");
const Expiry_date = require("../middleware/expiration");
const User = require("../models/user");
const Sess = require("../models/sess");

const saltRounds = 10;

const getUsers = async (req, res, next) => {
  console.log('a')
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
  res.json({users: users.map((user)=>user.toObject({ getters: true}))});
  // res.json({ users: users.toObject({ getters: true }) });
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors)
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { creator, password, birth, username, intro } = req.body;

  const hash = bcrypt.hashSync(password, saltRounds);

  const createdUser = new User({
    username,
    creator,
    password: hash,
    birth,
    icon: req.file.path,
    // icon: "temp",
    intro
  });
  // console.log(createdUser)

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating Users failed, please try again.",
      500
    );
    return next(error);
  }
  const loginInfo = await CreateSess(username);

  res.status(201).json({ loginInfo });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }
  const { username, password } = req.body;

  let user;
  try {
    user = await User.findOne({ username: username });
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  if (bcrypt.compareSync(password, user.password)) {
    loginInfo = await CreateSess(user)
    res.status(201).json({ loginInfo});
  } else {
    res.status(404).json({ message: "username or password invalid" })
  }

};

const CreateSess = async (username) => {
  console.log(username)
  const expiry_date = Expiry_date.generate_expiry_date(10);
  let user;
  if (typeof username === "string") {
    try {
      user = await User.findOne({ username: username }, "-password");
    } catch (err) {
      const error = new HttpError("Something went wrong", 500);
      return next(error);
    }
  }else{
    user = username;
  }
  const sessCode = uuidv4();
  const createdSess = new Sess({
    username: user,
    sess: sessCode,
    expiry_date
  });
  console.log(createdSess)  

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdSess.save({ session: sess });
    await sess.commitTransaction();
    loginInfo = {
      username:user.username,
      user:user.creator,
      user_id: user._id,
      icon:user.icon,
      intro:user.intro,
      birth:user.birth,
      token:sessCode
    }
    return loginInfo;
  } catch (err) {
    const error = new HttpError("Creating sess failed, please try again.", 500);
    return next(error);
  }

};

const CkeckUser = async(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }
  const { token } = req.body;
  console.log(token)
  let session
  try {
    session = await Sess.findOne({sess:token})
  }catch(err) {
    const error = new HttpError(
      "Something went wrong, could not fetch session",
      500
    );
    return next(error);
  }
  console.log(session)
  
  if(session!== null && Expiry_date.compare_expiry_date(session.expiry_date)){
    try {
      user = await User.findOne({_id:session.username})
      console.log(user)
      loginInfo = {
        username:user.username,
        user:user.creator,
        user_id: user._id,
        icon:user.icon,
        intro:user.intro,
        birth:user.birth,
      }
      res.json({loginInfo: loginInfo})
    }catch(err) {
    const error = new HttpError(
      "Something went wrong, could not fetch user",
      500
    );
    return next(error);
  }
  }else{
    res.json({loginInfo: false})
  }
}

exports.createUser = createUser;
exports.getUsers = getUsers;
exports.login = login;
exports.CkeckUser = CkeckUser;
