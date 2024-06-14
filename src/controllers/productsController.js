const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
//model
const Product = require("../model/productSchema");
const Category = require("../model/cateorySchema");
const { Deserializer } = require("v8");

const layout = "./layouts/admin-layouts.ejs";

module.exports = {
  getProducts: async (req, res) => {
    const product = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });
    console.log(product);
    res.render("admin/products/products.ejs", {
      layout,
      product,
    });
  },
  getAddProducts: async (req, res) => {
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/products/addProduct.ejs", {
      layout,
      categories,
    });
  },
  addProducts: async (req, res) => {
    console.log(req.body);
    try {
      const existProduct = await Product.findOne({
        name: req.body.productName.toLowerCase(),
      });
      if (existProduct) {
        return res
          .status(400)
          .json({ success: false, message: "Product already exist" });
      }

      // Ensure req.files is defined and contains the expected fields
      if (!req.files || !req.files.images || !req.files.primaryImage) {
        return res
          .status(400)
          .json({ success: false, message: "Images are required" });
      }

      let secondaryImages = [];
      req.files.images.forEach((e) => {
        secondaryImages.push({
          name: e.filename,
          path: e.path,
        });
      });

      secondaryImages.forEach(async (e) => {
        await sharp(
          path.join(__dirname, "../../public/uploads/product-images/") + e.name
        )
          .resize(500, 500)
          .toFile(
            path.join(__dirname, "../../public/uploads/product-images/crp/") +
              e.name
          );
      });

      let primaryImage;
      req.files.primaryImage.forEach((e) => {
        primaryImage = {
          name: e.filename,
          path: e.path,
        };
      });

      await sharp(
        path.join(__dirname, "../../public/uploads/product-images/") +
          primaryImage.name
      )
        .resize(500, 500)
        .toFile(
          path.join(__dirname, "../../public/uploads/product-images/crp/") +
            primaryImage.name
        );

      const product = new Product({
        name: req.body.productName.toLowerCase(),
        category: req.body.categoryName,
        description: req.body.productDespt,
        details: req.body.productDetails,
        stock: req.body.productStock,
        price: req.body.price,
        primaryImages: primaryImage,
        secondaryImages: secondaryImages,
      });
      await product.save();
      req.flash("success", "Product added successfully");
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error);
      // res.status(500).json({ message: 'Server error' });
      req.flash("error", error.message);
      return res.redirect("/admin/addProduct");
    }
  },
  getEditProducts: async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category");
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/products/editProduct.ejs", {
      layout,
      product,
      categories,
    });
  },
  editProduct: async (req, res) => {
    try {
      console.log(req.body, req.files);
      const productId = req.params.id;
      let product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let primaryImage = product.primaryImages;
      if (req.files.primaryImage) {
        primaryImage = [
          {
            name: req.files.primaryImage[0].filename,
            path: req.files.primaryImage[0].path,
          },
        ];

        await sharp(req.files.primaryImage[0].path)
          .resize(500, 500)
          .toFile(
            path.join(__dirname, "../../public/uploads/product-images/crp/") +
              req.files.primaryImage[0].filename
          );
      }
      let secondaryImages = product.secondaryImages;
      for (let i = 0; i < 3; i++) {
        if (req.files[`images${i}`]) {
          await sharp(req.files[`images${i}`][0].path)
            .resize(500, 500)
            .toFile(
              path.join(__dirname, "../../public/uploads/product-images/crp/") +
                req.files[`images${i}`][0].filename
            );
          secondaryImages.push({
            name: req.files[`images${i}`][0].filename,
            path: req.files[`images${i}`][0].path,
          });
        }
      }

      const updateProduct = {
        name: req.body.productName,
        category: req.body.categoryName,
        description: req.body.productDespt,
        details: req.body.productDetails,
        price: req.body.price,
        isDeleted: req.body.status === "true" ? true : false,
        stock: req.body.productStock,
        // primaryImages:primaryImage,
        // secondaryImages:secondaryImages,
      };
      const { id } = req.params;
      await Product.findByIdAndUpdate(id, updateProduct, { new: true });
      req.flash("success", "product edited successfully");
      res.redirect("/admin/products");
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "server error" });
    }
  },
  deleteImage: async (req, res) => {
    try {
      console.log(req.body);
      const { productId, imageId } = req.body;
      let product = await Product.findById(productId);
      console.log(product);
      if (product.primaryImages[0].name === imageId) {
        product.primaryImages[0].name = "";
        await fs.unlink(
          path.join(__dirname, "../../public/uploads/product-images/crp/") +
            imageId
        );
        await product.save();
        return res
          .status(200)
          .json({ success: true, message: "Image deleted successfully" });
      }
      let secondaryImageIndex = product.secondaryImages.findIndex(
        (image) => image.name === imageId
      );
      let secondaryImage = product.secondaryImages.find(
        (image) => image.name === imageId
      );
      console.log(secondaryImageIndex, secondaryImage);
      if (secondaryImageIndex >= 0) {
        product.secondaryImages[secondaryImageIndex].name = "";
        await fs.unlink(
          path.join(__dirname, "../../public/uploads/product-images/crp/") +
            imageId
        );
        await product.save();
        return res
          .status(200)
          .json({ success: true, message: "Image deleted successfully" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
