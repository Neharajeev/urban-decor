require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const flash = require("connect-flash");
const nocache = require("nocache");
const csrf = require("csurf");
const expressLayouts = require("express-ejs-layouts");
const otpGenerator = require("otp-generator");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "http://server-auth-41acc.firebaseio.com",
});

const csrfMiddleware = csrf({ cookie: true });
const connectDB = require("./src/config/db");

const indexRouter = require("./src/routes/auth");
const usersRouter = require("./src/routes/users");
const adminRouter = require("./src/routes/admin");
const shopRouter = require("./src/routes/shop");

const { checkUserBlock } = require("./src/middlewares/authMiddleware");

const app = express();

//connectdb
connectDB();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("layout", "./layouts/user-layouts.ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);
app.use(nocache());
otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

//session

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      MaxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(flash());
// app.use(checkUserBlock);

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

// app.all("*", (req, res, next) => {
//   res.cookie("XSRF_TOKEN", req.csrfToken());
//   next();
// });

//routes

app.use("/users", usersRouter);
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/", shopRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
