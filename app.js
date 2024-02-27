const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const db = require("./config/connection");
const userHelpers = require("./helpers/user-helpers")
const middleware = require("./middlewares/middleware");
const flash = require("express-flash-message");
const expressLayouts = require("express-ejs-layouts");

const collection = require("./config/collections");

const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");

const app = express();

// view engine setup

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout/layout");
app.use(logger("dev"));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "Key",
    cookie: { maxAge: 600000 },
    resave: false,
    saveUninitialized: true,
  })
);

// app.use(flash())

app.use((req, res, next) => {
  res.locals.message = ""; 
  next();
});

app.use((req, res, next) => {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});
app.use(middleware.setRequestVariable);

db.connectToDatabase((err) => {
  if (err) {
    console.log("Error connecting to the database:", err);
    
  } else {

  }
});
// let otpCollection = db.getDatabase().collection(collection.OTP_CollECTION)
// console.log("collection:",otpCollection);
// otpCollection.dropIndex("expiresAt_1", function(err, result) {
//   if (err) {
//       console.error("Error dropping index:", err);
//   } else {
//       console.log("Existing index dropped successfully");
//       // Create a new TTL index on the 'expiresAt' field
//       otpCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 60 }, function(err, result) {
//           if (err) {
//               console.error("Error creating index:", err);
//           } else {
//               console.log("TTL index created successfully");
//           }
//       });
//   }
// });


app.use("/", userRouter);
app.use("/admin", adminRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
// error handler
app.use(async function (err, req, res, next) {
  let categories = await userHelpers.getCategory();
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log("got category:",categories);
  
  res.status(err.status || 500);
  res.render("error", { error: res.locals.error, categories });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at ${PORT} successfully`);
});
module.exports = app;
