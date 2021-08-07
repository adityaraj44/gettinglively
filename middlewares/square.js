const { Client, Environment } = require("square");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const config = {
  environment: Environment.Production,
  accessToken: process.env.SQUARE_PROD_ACCESS_TOKEN,
};

const defaultClient = new Client(config);
module.exports = defaultClient;
