const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const db = require("./config/connection");

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
  res.locals.message = ""; // Set a default value
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
    // Handle the error, such as shutting down the server or displaying an error message.
  } else {
    // Proceed with your application logic that depends on the database connection.
  }
});
let otpCollection = db.getDatabase().collection(collection.OTP_CollECTION);

app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", { error: res.locals.error }); // Pass the error object to the error.ejs template
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at ${PORT} successfully`);
});
module.exports = app;
