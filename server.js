const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv");
const expressLayouts = require("express-ejs-layouts");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

// sentry tracking
Sentry.init({
  dsn: "https://524ca26785ee4060a7ccd38662244927@o697793.ingest.sentry.io/5776578",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "First Test",
});

setTimeout(() => {
  try {
    foo();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);

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

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`.green.bold);
});
