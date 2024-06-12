const User = require("../model/userSchema");

module.exports = {
  isLoggedIn: (req, res, next) => {
    if (req.session && req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  },
  isLoggedOut: (req, res, next) => {
    if (req.session && req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
  },
  isAdminLoggedIn: (req, res, next) => {
    if (req.session && req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  },
  isAdminLoggedOut: (req, res, next) => {
    if (req.session && req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
  },
  checkUserBlock: async (req, res, next) => {
    if (req.session.user) {
      const user = await User.findById({ _id: req.user.id });
      if (user.isBlocked) {
        delete req.session.user;
        req.flash("error", "user is blocked ");
        return res.redirect("/login");
      }
    }
    next();
  },
};
