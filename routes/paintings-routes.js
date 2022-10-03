const { Router } = require("express");
const paintingsControllers = require("../controllers/paintings-controllers");
const fileUpload = require("../middleware/file-upload");
const { check } = require("express-validator");

const router = Router();

router.post(
  "/",
  // fileUpload.single("image"),
  fileUpload.fields([
    {name:"image", maxCount:1},
    {name:"imagePreview", maxCount:1}
  ]),
  [
    check("id").not().isEmpty(),
    check('token').not().isEmpty(),
    check("created_date").not().isEmpty(),
    check("category").not().isEmpty(),
    check("content").not().isEmpty(),
    check("name").not().isEmpty()
  ],
  paintingsControllers.createPainting
);
router.get("/", paintingsControllers.fetchPainting);

module.exports = router;
