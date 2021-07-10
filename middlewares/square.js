const { Client } = require("square");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const config = {
  environment: "sandbox",
  accessToken:
    "EAAAECTLtAHQA0G4U_6DjHEoxAN6AlqP9ImZn5Ybt3l1Rr4xKhFG1pljhVbCFqMf",
};

const defaultClient = new Client(config);
module.exports = defaultClient;
