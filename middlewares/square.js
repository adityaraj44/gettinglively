const { Client } = require("square");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const config = {
  environment: "production",
  accessToken: process.env.SQUARE_PROD_ACCESS_TOKEN,
};

const defaultClient = new Client(config);
module.exports = defaultClient;
