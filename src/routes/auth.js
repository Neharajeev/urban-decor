const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const authController = require("../controllers/authController");

const {
  isLoggedOut,
  isAdminLoggedOut,
} = require("../middlewares/authMiddleware");

/* GET home page. */
router.get("/", shopController.getHome);

/*GET user login */

router.get("/profile", authController.getUserProfile);

router
  .route("/login")
  .get(isLoggedOut, authController.getUserLogin)
  .post(authController.userLogin);

/*GET user register */

router
  .route("/register")
  .get(isLoggedOut, authController.getUserRegister)
  .post(authController.userRegister);

/*GET verifyotp */

router
  .route("/otp-Verify")
  .get(authController.getVerifyOtp)
  .post(authController.verifyOtp);

/*GET forgetpassword */

router
  .route("/forgetpass")
  .get(authController.getForgetPassword)
  .post(authController.forgetPassword);

/*GET ForgetPassotp */

router
  .route("/forget-otp-verify")
  .get(authController.getForgetPasswordverify)
  .post(authController.forgetOtpVerify);

/*GET ResetPass */

router
  .route("/resetPass")
  .get(authController.getResetPassword)
  .post(authController.resetPassword);

/* GET admin register */

router
  .route("/admin/register")
  .get(isAdminLoggedOut, authController.getAdminRegister)
  .post(authController.adminRegister);

/* GET admin login */

router
  .route("/admin/login")
  .get(isAdminLoggedOut, authController.getAdminLogin)
  .post(authController.adminLogin);

router.get("/resend-otp", authController.resendOtp);

router.get("/logout", authController.logout);

module.exports = router;
