const { response } = require("../app");
const db = require("../config/connection");
const collection = require("../config/collections");
const objectId = require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const User = require("../model/userModel");
const UserOTPVerification = require("../model/userOTPVerificationModel");
const nodeMailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const moment = require("moment");
const SMTP_PASS = process.env.SMTP_PASSWORD;

const sendVerifyEmail = async (name, email, user_id, response) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "mohammedshaman83@gmail.com",
        pass: SMTP_PASS,
      },
    });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const mailOptions = {
      from: "mohammedshaman83@gmail.com",
      to: email,
      subject: "For verification mail",
      text: `Your otp is: ${otp}`,
    };

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    await userHelpers.otpStore(user_id, hashedOTP);

    const info = await transporter.sendMail(mailOptions);
    console.log("Email has been sent:- ", info.response);

    response.redirect(`/enter-otp?userId=${user_id}`);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      status: "ERROR",
      message: "Internal server error",
    });
  }
};

const sendResetEmail = async (user, response) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "mohammedshaman83@gmail.com",
        pass: SMTP_PASS,
      },
    });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const mailOptions = {
      from: "mohammedshaman83@gmail.com",
      to: user.email,
      subject: "For verification mail",
      text: `Your otp is: ${otp}`,
    };
    const userId = user._id;

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    await userHelpers.otpStore(userId, hashedOTP);

    const info = await transporter.sendMail(mailOptions);
    console.log("Forgot password Email has been sent:- ", info.response);

    response.redirect(`/enter-otp-forgot?userId=${userId}`);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      status: "ERROR",
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res, next) => {
  try {
    if (req.session.authorized) {
      res.redirect("/");
    } else {
      req.session.loginErr = false;
      res.render("user/login-user", {
        admin: false,
        loginErr: req.session.loginErr,
        req: req,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { errorMessage: "Internal Server Error" });
  }
};

const signupUser = async (req, res, next) => {
  try {
    res.render("user/signup-user", { admin: false });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { errorMessage: "Internal Server Error" });
  }
};

const registerUser = async (req, res, next) => {
  try {
    const result = await userHelpers.doSignup(req.body);

    if (result.status === "error") {
      res.render("user/signup-user", { errorMessage: result.message });
    } else {
      console.log(result.name);
      console.log(result.email);
      sendVerifyEmail(result.name, result.email, result.Id, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { errorMessage: "Internal Server Error" });
  }
};

const validateLogin = async (req, res, next) => {
  try {
    const response = await userHelpers.doLogin(req.body);

    if (response.status) {
      req.session.authorized = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr = response.message || "Invalid Username or password";
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { errorMessage: "Internal Server Error" });
  }
};

const logOut = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { errorMessage: "Internal Server Error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const userId = req.query.id;
    userHelpers.verifyEmail(userId).then((response) => {
      res.redirect("/login");
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgotPassword = (req, res) => {
  res.render("user/forgot-password");
};

const resetPassword = (req, res) => {
  userHelpers
    .resetPassword(req.body)
    .then((user) => {
      sendResetEmail(user, res);
    })
    .catch((error) => {
      const message = error.message || "Internal Server Error";
      res.render("user/forgot-password", { message });
    });
};

const changePassword = (req, res) => {
  const userId = req.query.userId;
  console.log("userID:", userId);
  res.render("user/change-password", { userId });
};

const addNewPassword = (req, res) => {
  const userId = req.body.userId;
  console.log("userId from body:", userId);
  userHelpers.changePassword(req.body).then((message) => {
    res.render("user/login-user", { message });
  });
};




const getProfile = async (req, res) => {
  const user = req.session.user;
  const categories = await productHelpers.getAllCategories();
  let userDetails = await userHelpers.getUserDetails(req.session.user._id);

  res.render("user/profile", { user, userDetails ,categories});
};

const editProfile = async (req, res) => {
  const user = req.session.user;
  const categories = await productHelpers.getAllCategories();
  console.log(req.params.id);
  let userDetails = await userHelpers.getUserDetails(req.params.id);
  console.log(userDetails);
  res.render("user/edit-profile", { user, userDetails,categories });
};

const changeProfile = async (req, res) => {
  try {
    const user = req.session.user;
    console.log(req.body);
    await userHelpers
      .changeProfile(req.params.id, req.body)
      .then((response) => {
        console.log(response);
        res.redirect("/profile");
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const enterOTP = (req, res) => {
  const userId = req.query.userId;
  console.log("userId at enter otp is: " + userId);
  res.render("user/enter-otp", { userId });
};
const enterOTPForgot = (req, res) => {
  const userId = req.query.userId;
  console.log("userId at enter otp forgot is: " + userId);
  res.render("user/enter-otp-forgot", { userId });
};

const verifyOTP = async (req, res) => {
  try {
    const otp = req.body.otp;
    const userId = req.body.userId;
    console.log("otp is: " + otp);
    console.log("userId is: " + userId);
    const verificationResult = await userHelpers.otpVerify(otp, userId);
    if (verificationResult.status) {
      res.redirect("/login");
    } else {
      res.render("user/enter-otp", {
        userId,
        errorMessage: verificationResult.message,
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Internal Server Error" });
  }
};
const verifyOTPForgot = async (req, res) => {
  try {
    const otp = req.body.otp;
    const userId = req.body.userId;
    console.log("otp is: " + otp);
    console.log("userId is: " + userId);
    const verificationResult = await userHelpers.otpVerify(otp, userId);
    if (verificationResult.status) {
      res.redirect(`/resetPassword?userId=${userId}`);
    } else {
      res.render("user/enter-otp-forgot", {
        userId,
        errorMessage: verificationResult.message,
      });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Internal Server Error" });
  }
};
const resendOTP = async (req, res) => {
  const userId = req.query.userId;
  const user = await db
    .getDatabase()
    .collection(collection.USER_COLLECTION)
    .findOne({ _id: new ObjectId(userId) });

  if (user) {
    await sendVerifyEmail(user.name, user.email, userId, res);
  } else {
    res.status(404).send("User not found.");
  }
};
const resendOTPForgot = async (req, res) => {
  const userId = req.query.userId;
  const user = await db
    .getDatabase()
    .collection(collection.USER_COLLECTION)
    .findOne({ _id: new ObjectId(userId) });

  if (user) {
    await sendVerifyEmail(user.name, user.email, userId, res);
  } else {
    res.status(404).send("User not found.");
  }
};

const verifyPayment = (req, res) => {
  console.log(req.body);
  let orderId = req.body["order[receipt]"];
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(orderId).then(() => {
        res.json({ status: true, orderId });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
};
const getWallet =async (req,res)=>{
  const user = req.session.user;
  const categories = await productHelpers.getAllCategories();
  res.render("user/wallet",{user,categories})
}

module.exports = {
  loginUser,
  signupUser,
  registerUser,
  validateLogin,
  logOut,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  addNewPassword,
  getProfile,
  editProfile,
  changeProfile,
  enterOTP,
  enterOTPForgot,
  verifyOTP,
  verifyOTPForgot,
  resendOTP,
  resendOTPForgot,
  verifyPayment,
  getWallet,
};
