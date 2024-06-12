const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

//model

const User = require("../model/userSchema");
const { sendOtpEmail } = require("../helper/userVerificationHelper");
const OTP = require("../model/otpSchema");

module.exports = {
  getUserLogin: async (req, res) => {
    console.log(req.locals);
    res.render("auth/user/login");
  },
  getUserProfile: async (req, res) => {
    res.render("auth/user/userProfile");
  },
  getUserRegister: async (req, res) => {
    console.log(req.locals);
    res.render("auth/user/register");
  },
  userRegister: async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    console.log(req.body);

    const existUser = await User.findOne({ email });
    if (existUser) {
      req.flash("success", "Email already in use");
      return res.redirect("/register");
    }
    if (password !== confirmPassword) {
      req.flash("error", "Password not matching");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password,
      confirmPassword,
    });

    try {
      const savedUser = await user.save();
      if (!savedUser) {
        req.flash("error", "user registered unsuccessfully");
        return res.redirect("/register");
      } else {
        req.session.verifyToken = savedUser._id;
        const isOtpSent = sendOtpEmail(savedUser, res);
        if (isOtpSent) {
          req.flash(
            "success",
            "user registered successfully, please verify your email"
          );
          return res.redirect("/otp-verify");
        } else {
          req.flash(
            "error",
            "User registration unsuccessfull, please try to logged in"
          );
          return res.redirect("/login");
        }
      }
    } catch (error) {
      console.log(error), req.flash("error", "user registered unsuccessfully");
      return res.redirect("/register");
    }
  },

  userLogin: async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email, isAdmin: false });
    if (!user) {
      req.flash("error", "User does not exit or invalid credentials");
      return res.redirect("/login");
    }

    isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      req.flash("error", "invalid credential");
      return res.redirect("/login");
    }
    req.session.user = user;
    req.flash("success", "user successfully logged in");
    return res.redirect("/");
  },
  getForgetPassword: async (req, res) => {
    res.render("auth/user/forget-pass.ejs");
  },
  getResetPassword: async (req, res) => {
    res.render("auth/user/reset-pass.ejs");
  },
  getForgetPasswordverify: async (req, res) => {
    if (!req.session.forgetToken) {
      return res.redirect("/");
    }
    res.render("auth/user/forgetOtp.ejs");
  },
  getVerifyOtp: async (req, res) => {
    if (!req.session.verifyToken) {
      return res.redirect("/");
    }
    res.render("auth/user/otp-verify.ejs");
  },
  verifyOtp: async (req, res) => {
    console.log(req.body);
    try {
      // Check if verifyToken exists in session
      if (!req.session.verifyToken) {
        // return res.status(401).json({ message: "Verification token not found" });
        req.flash("error", "verification token not found");
        return res.redirect("/");
      }

      const userId = req.session.verifyToken;
      const otpData = await OTP.findOne({ userId: userId });

      // Check if OTP data exists
      if (!otpData) {
        // return res.status(404).json({ message: "OTP data not found" });
        req.flash("error", "OTP data not found");
        return res.redirect("/otp-verify");
      }

      // Compare OTP
      const validOtp = await bcrypt.compare(req.body.otp, otpData.otp);

      // Check if OTP is valid
      if (!validOtp) {
        // return res.status(400).json({ message: "Invalid OTP" });
        req.flash("error", "Invalid OTP");
        return res.redirect("/otp-verify");
      }

      // Update user verification status
      let user = await User.findOne({ _id: otpData.userId });
      user.isVerified = true;
      await user.save();

      // Success response
      req.flash("success", "User verification successful");
      delete req.session.verifyToken; // Clear the verification token from session
      return res.redirect("/login");
    } catch (error) {
      console.error(error); // Log the error for debugging purposes
      // return res.status(500).json({ message: "Internal server error" });
      req.flash("error", "Internal server error");
      return res.redirect("/otp-verify");
    }
  },
  forgetPassword: async (req, res) => {
    console.log(req.body);
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "User email does not exist");
        return res.redirect("/forgetPass");
      } else {
        const isOtpSent = sendOtpEmail(user, res);
        req.session.forgetToken = user._id;
        return res.redirect("/forget-otp-verify");
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "An error occurred");
      return res.redirect("/forgetPass");
    }
  },
  resetPassword: async (req, res) => {
    console.log(req.body);
    try {
      const { password, confirmPassword } = req.body;
      if (password !== confirmPassword) {
        req.flash("error", "password doesnot match");
        return res.redirect("/resetPass");
      }
      const userId = req.session.forgetToken;
      const hashPass = await bcrypt.hash(password, 10);
      const user = await User.updateOne(
        { _id: userId },
        { $set: { password: hashPass } }
      );
      if (user) {
        req.flash("success", "Password successfully reset");
        return res.redirect("/login");
      } else {
        req.flash("error", "password not reseted please try again");
        return res.redirect("/resetPass");
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "An error occurred");
      return res.redirect("/resetPass");
    }
  },
  forgetOtpVerify: async (req, res) => {
    try {
      // Check if verifyToken exists in session
      if (!req.session.forgetToken) {
        // return res.status(401).json({ message: "Verification token not found" });
        req.flash("error", "session timed out");
        return res.redirect("/forget-otp-verify");
      }

      const userId = req.session.forgetToken;
      const otpData = await OTP.findOne({ userId: userId });

      // Check if OTP data exists
      if (!otpData) {
        // return res.status(404).json({ message: "OTP data not found" });
        req.flash("error", "OTP data not found");
        return res.redirect("/forget-otp-verify");
      }

      // Compare OTP
      const validOtp = await bcrypt.compare(req.body.otp, otpData.otp);

      // Check if OTP is valid
      if (!validOtp) {
        // return res.status(400).json({ message: "Invalid OTP" });
        req.flash("error", "Invalid OTP");
        return res.redirect("/forget-otp-verify");
      }

      // Success response
      req.flash(
        "success",
        "OTP verification successful, please change your password"
      );
      delete req.session.verifyToken; // Clear the verification token from session
      return res.redirect("/resetPass");
    } catch (error) {
      console.error(error); // Log the error for debugging purposes
      // return res.status(500).json({ message: "Internal server error" });
      req.flash("error", "Internal server error");
      return res.redirect("/forget-otp-verify");
    }
  },
  getAdminRegister: async (req, res) => {
    res.render("auth/admin/register.ejs");
  },
  getAdminLogin: async (req, res) => {
    res.render("auth/admin/login.ejs");
  },
  adminRegister: async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    console.log(req.body);
    const exist = await User.findOne({ email });
    if (exist) {
      req.flash("error", "Email already exist");
      return res.render("/admin/register");
    }
    if (password !== confirmPassword) {
      req.flash("error", "password doesnot match");
      return res.render("/admin/register");
    }
    const user = new User({
      username,
      email,
      password,
      isAdmin: true,
    });

    const adminSave = await user.save();
    if (adminSave) {
      req.flash("success", "admin registered successfully, please login");
      return res.redirect("/admin/login");
    } else {
      req.flash("error", "admin registeration failed");
      return res.redirect("/admin/register");
    }
  },
  adminLogin: async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    const adminExist = await User.findOne({ email, isAdmin: true });
    if (!adminExist) {
      req.flash("error", "Invalid credential");
      return res.redirect("/admin/login");
    }
    const isPassValid = await bcrypt.compare(password, adminExist.password);
    if (!isPassValid) {
      req.flash("error", "password not matching");
      return res.redirect("/admin/login");
    }

    req.session.admin = adminExist;
    req.flash("success", "admin successfully logged in");
    return res.redirect("/admin/dashboard");
  },
  resendOtp: async (req, res) => {
    try {
      let userId;
      if (req.session.verifyToken) {
        userId = req.session.verifyToken;
      }
      if (req.session.forgetToken) {
        userId = req.session.forgetToken;
      }
      const user = await User.findOne({
        _id: userId,
        isBlocked: false,
        isAdmin: false,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "user not found",
        });
      }

      const isOtpSent = sendOtpEmail(user, res);
      if (isOtpSent) {
        return res.status(200).json({
          success: true,
          message: "otp send to mail",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  logout: async (req, res) => {
    delete req.session.user;
    req.flash("success", "logout successfull");
    return res.redirect("/");
  },
};
