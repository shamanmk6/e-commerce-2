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
    res.status(500).send("Internal Server Error");
  }
};

const signupUser = async (req, res, next) => {
  try {
    res.render("user/signup-user", { admin: false });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const registerUser = async (req, res, next) => {
  try {
    console.log("registering user is:", req.body);
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
      let loginErr = response.message || "Invalid Email or Password";
      res.render("user/login-user", { loginErr });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const logOut = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
    res.status(500).send("Internal Server Error");
  }
};

const forgotPassword = (req, res) => {
  try {
    res.render("user/forgot-password");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const resetPassword = (req, res) => {
  try {
    userHelpers
      .resetPassword(req.body)
      .then((user) => {
        sendResetEmail(user, res);
      })
      .catch((error) => {
        const message = error.message || "Internal Server Error";
        res.render("user/forgot-password", { message });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const changePassword = (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("userID:", userId);
    res.render("user/change-password", { userId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addNewPassword = (req, res) => {
  try {
    const userId = req.body.userId;
    console.log("userId from body:", userId);
    userHelpers.changePassword(req.body).then((message) => {
      res.render("user/login-user", { message });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    let userDetails = await userHelpers.getUserDetails(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(user._id);
    res.render("user/profile", { user, userDetails, categories, cartCount });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const editProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    let cartCount = await userHelpers.getCartCount(user._id);
    console.log(req.params.id);
    let userDetails = await userHelpers.getUserDetails(req.params.id);
    console.log(userDetails);
    res.render("user/edit-profile", {
      user,
      userDetails,
      categories,
      cartCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const changeProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let userDetails = req.body;
    console.log("userDetails: ", userDetails);

    await userHelpers.updateProfile(userId, userDetails);
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const enterOTP = (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("userId at enter otp is: " + userId);
    res.render("user/enter-otp", { userId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const enterOTPForgot = (req, res) => {
  try {
    const userId = req.query.userId;
    console.log("userId at enter otp forgot is: " + userId);
    res.render("user/enter-otp-forgot", { userId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyOTP = async (req, res) => {
  try {
    
    const otp = req.body.otp;
    const userId = req.body.userId;
    console.log("otp is: " + otp);
    console.log("userId is: " + userId);
    const verificationResult = await userHelpers.otpVerify(otp, userId);
    if (verificationResult.status === true) {
      res.json({status:true,redirectUrl:"/login"})
    } else if (verificationResult.status === false) {
      console.log("wrong otp");
      console.log("wrong userID is: ", userId);
      console.log("result: ", verificationResult.message);
      let errorMessage = verificationResult.message;
      res.json({status:false,message:errorMessage})
    } else {
      throw new Error("Unexpected verification result");
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
      res.json({status:true,redirectUrl:`/resetPassword?userId=${userId}`})
    } else {
      let errorMessage = verificationResult.message;
      res.json({status:false,message:errorMessage})
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Internal Server Error" });
  }
};
const resendOTP = async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await db
      .getDatabase()
      .collection(collection.USER_COLLECTION)
      .findOne({ _id: new ObjectId(userId) });
    await db
      .getDatabase()
      .collection(collection.OTP_CollECTION)
      .deleteOne({ userId: userId });
    if (user) {
      await sendVerifyEmail(user.name, user.email, userId, res);
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const resendOTPForgot = async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await db
      .getDatabase()
      .collection(collection.USER_COLLECTION)
      .findOne({ _id: new ObjectId(userId) });
    await db
      .getDatabase()
      .collection(collection.OTP_CollECTION)
      .deleteOne({ userId: userId });
    if (user) {
      await sendResetEmail(user,res);
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyPayment = (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const getWallet = async (req, res) => {
  try {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    const wallet = await userHelpers.getWallet(user._id);
    let cartCount = await userHelpers.getCartCount(user._id);
    wallet.cancelledOrders.reverse();

    console.log("Wallet Is: ", wallet);
    res.render("user/wallet", { user, categories, wallet, cartCount });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).send("Internal Server Error");
  }
};

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
