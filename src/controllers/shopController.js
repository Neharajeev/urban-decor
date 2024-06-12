const Products = require("../model/productSchema");
const Categories = require("../model/cateorySchema");

module.exports = {
  getHome: async (req, res) => {
    let locals = {
      title: "UrbanDecor - Home",
      description: "Home Page",
    };
    res.render("index", {
      locals,
    });
  },
  getShop: async (req, res) => {
    let perPage = 6;
    let page = req.query.page || 1;
    const product = await Products.aggregate([{ $sort: { updatedAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
    const count = await Products.countDocuments();

    const products = await Products.find({ isDeleted: false });
    const categories = await Categories.find({ isDeleted: false });
    console.log(products);

    res.render("shop/shop", {
      products,
      categories,
      current: page,
      pages: Math.ceil(count / perPage),
    });
  },
  getProduct: async (req, res) => {
    console.log(req.params);
    const product = await Products.findById(req.params.id).populate("category");
    console.log(product);
    const relatedProducts = await Products.find({
      category: product.category._id,
      isDeleted: false,
    }).limit(10);
    res.render("shop/product", {
      product,
      relatedProducts,
    });
  },
};
