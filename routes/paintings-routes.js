const { Router } = require("express");
const paintingsControllers = require("../controllers/paintings-controllers");
const fileUpload = require("../middleware/file-upload");
const { check } = require("express-validator");

const router = Router();

router.get("/", paintingsControllers.fetchPainting);
router.get("/search/:content", paintingsControllers.fetchPaintingByCondition)
router.get("/keyword", paintingsControllers.fetchKeywordGroup)
router.get("/:uid", paintingsControllers.fetchPaintingByUser)

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

module.exports = router;
