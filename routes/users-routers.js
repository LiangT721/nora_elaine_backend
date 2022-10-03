const { Router } = require("express");
const usersControllers = require("../controllers/users-controllers.js");
const fileUpload = require("../middleware/file-upload");
const { check } = require("express-validator");

const router = Router();

router.post(
  "/signup",
  fileUpload.single('icon'),
  [
    check("creator").not().isEmpty(),
    check("username").not().isEmpty(),
    check("password").not().isEmpty(),
    check("birth").not().isEmpty()
  ],
  usersControllers.createUser
);
router.post(
  "/login",
  [
    check("username").not().isEmpty(),
    check("password").not().isEmpty(),
  ],
  usersControllers.login
);
router.post(
  "/auth",
  [check("token").not().isEmpty()],
  usersControllers.CkeckUser
)

router.get("/", usersControllers.getUsers);

module.exports = router;
