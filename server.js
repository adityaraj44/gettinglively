const express = require("express");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
const expressLayouts = require("express-ejs-layouts");
const connectDB = require("./config/db");
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const fileUpload = require("express-fileupload");
const algoliasearch = require("algoliasearch");

// dotenv
dotenv.config({
  path: "./config/config.env",
});

// passport config
require("./config/passport")(passport);

// config db
connectDB();

const app = express();

// file upload
app.use(fileUpload());

// express session
// express session
app.use(
  session({
    secret: "memyself",
    resave: false,
    saveUninitialized: false,

    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// flash message
app.use(flash());

// global var
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.warning_msg = req.flash("warning_msg");
  res.locals.loginError_msg = req.flash("loginError_msg");
  res.locals.upload_msg = req.flash("upload_msg");
  res.locals.errorupload_msg = req.flash("errorupload_msg");
  res.locals.user = req.user || null;
  next();
});

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

// morgan logger
// using morgan for logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// body parser
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.json());

// method overrride
app.use(
  methodOverride((req, res) => {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

// static files server
app.use(express.static(`${__dirname}/public`));

// ejs view engine
app.use(expressLayouts);
app.set("layout", "layouts/layout");
app.set("view engine", "ejs");

// routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.use("/emailupdates", require("./routes/emailsub"));
app.use("/admin", require("./routes/admin"));
app.use("/admincreate", require("./routes/create"));
app.use("/userreviews", require("./routes/reviews"));
app.use("/business", require("./routes/business"));
app.use("/edit", require("./routes/edit"));
app.use("/places", require("./routes/places"));
app.use("/payment", require("./routes/payment"));
app.use("/offers", require("./routes/offers"));
app.use("/gifting", require("./routes/gifting"));
app.use("/promotions", require("./routes/promotions"));
app.use((req, res) => res.render("errors/pagenotfound"));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${port}`.green.bold
  );
});
