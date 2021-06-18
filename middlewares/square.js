const { Client } = require("square");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const config = {
  environment: "sandbox",
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
};

const defaultClient = new Client(config);
module.exports = defaultClient;
