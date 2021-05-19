const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv");
const expressLayouts = require("express-ejs-layouts");

// dotenv
dotenv.config({
  path: "./config/config.env",
});

const app = express();

// body parser
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.json());

// static files server
app.use(express.static(`${__dirname}/public`));

// ejs view engine
app.use(expressLayouts);
app.set("layout", "layouts/layout");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("homepage");
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`.green.bold);
});
