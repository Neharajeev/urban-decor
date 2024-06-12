const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

//model

const Category = require("../model/cateorySchema");
const OTP = require("../model/otpSchema");
const layout = "./layouts/admin-layouts.ejs";
const User = require("../model/userSchema");

module.exports = {
  getAdmin: async (req, res) => {
    res.render("admin", {
      layout,
    });
  },

  getAllCategory: async (req, res) => {
    const categories = await Category.find();
    res.render("admin/category/category", {
      categories,
      layout,
    });
  },
  getAddCategory: async (req, res) => {
    res.render("admin/category/addCategory", {
      layout,
    });
  },
  addCategory: async (req, res) => {
    console.log(req.body);
    const name = req.body.categoryName.trim().toLowerCase();
    const category = await Category.findOne({ name: name });
    if (category) {
      req.flash("error", "category already exist");
      return res.redirect("/admin/addCategory");
    }
    const addCategory = new Category({
      name,
    });
    await addCategory.save();

    return res.redirect("/admin/category");
  },
  getEditCategory: async (req, res) => {
    const category = await Category.findById(req.params.id);
    res.render("admin/category/editCategory", {
      layout,
      category,
    });
  },
  editCategory: async (req, res) => {
    try {
      console.log(req.body);
      let name = req.body.name.toLowerCase();
      const { id } = req.params;
      let duplicateCategory = await Category.findOne({
        name: name,
        _id: { $ne: id },
      });
      if (duplicateCategory) {
        req.flash("error", "Category already exist");
        return res.redirect(`/admin/editCategory/${id}`);
      }
      let editCategory = {
        name: name,
        isDeleted: req.body.status === "true" ? true : false,
      };

      let category = await Category.findByIdAndUpdate(id, editCategory, {
        new: true,
      });
      if (category) {
        req.flash("success", "edited successfully");
        return res.redirect("/admin/category");
      }
    } catch (error) {
      console.error(error);
    }
  },
  getUser: async (req, res) => {
    const userList = await User.find({ isAdmin: false });
    res.render("admin/userlist/userList", {
      layout,
      userList,
    });
  },
  userList: async (req, res) => {
    try {
      console.log(req.params);
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.isBlocked = !user.isBlocked;
      await user.save();
      res.status(200).json({
        message: user.isBlocked
          ? "user Blocked successfully"
          : "user unblocked succesfully",
      });
    } catch (error) {
      console.error(error);
    }
  },
  getCoupon: async (req, res) => {
    res.render("admin/coupon/coupon.ejs");
  },
};
