const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const productsController = require("../controllers/productsController");
const { productUpload, upload } = require("../middlewares/multer");
const { isAdminLoggedIn } = require("../middlewares/authMiddleware");

router.use(isAdminLoggedIn);

/*get dashboard */

router.get("/dashboard", adminController.getAdmin);

/* Category management*/

router.route("/category").get(adminController.getAllCategory);

router
  .route("/addCategory")
  .get(adminController.getAddCategory)
  .post(adminController.addCategory);

router
  .route("/editCategory/:id")
  .get(adminController.getEditCategory)
  .post(adminController.editCategory);

//product management

router.route("/products").get(productsController.getProducts);

router
  .route("/addProduct")
  .get(productsController.getAddProducts)
  .post(
    productUpload.fields([
      { name: "images", maxCount: 3 },
      { name: "primaryImage" },
    ]),
    productsController.addProducts
  );

router
  .route("/editProduct/:id")
  .get(productsController.getEditProducts)
  .post(
    productUpload.fields([
      { name: "primaryImage" },
      { name: "secondaryImages", maxCount: 1 },
      { name: "secondaryImages1", maxCount: 1 },
    ]),
    productsController.editProduct
  );

//delete image
router.route("/deleteImage").delete(productsController.deleteImage);

//get userlist

router.route("/userList").get(adminController.getUser);

router.route("/userList/block-user/:id").patch(adminController.userList);

router.route("/coupon").get(adminController.getCoupon);

module.exports = router;
