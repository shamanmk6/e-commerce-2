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
const SMTP_PASSWORD =process.env.SMTP_PASS

const sendVerifyEmail = async (name, email, user_id, response) => {
  try {
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "mohammedshaman83@gmail.com",
        pass: SMTP_PASSWORD,
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
        pass: SMTP_PASSWORD,
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

const loginUser = (req, res, next) => {
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
};

const signupUser = (req, res, next) => {
  res.render("user/signup-user", { admin: false });
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
      // res.render("user/enter-otp", { message: "Please check your email for otp" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const validateLogin = (req, res, next) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.authorized = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr = response.message || "Invalid Username or password";
      res.redirect("/login");
    }
  });
};

const logOut = (req, res, next) => {
  req.session.destroy();
  res.redirect("/login");
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

const getCart = async (req, res) => {
  const user = req.session.user;
  let cartItems = await userHelpers.getCartProducts(req.session.user._id);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
  console.log("cartItems: ", cartItems);
  cartItems.forEach((cartItem) => {
    console.log("Images are:", cartItem.product.images);
  });
  res.render("user/cart", { user, cartItems, totalValue });
};
const addToCart = (req, res) => {
  const user = req.session.user;
  console.log("user:", user);
  console.log("api called");

  if (req.session.authorized) {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true, redirectToLogin: false });
    });
  } else {
    // Return status with information to redirect to login
    res.json({ status: false, redirectToLogin: true });
  }
};

const changeProductQuantity = (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log(response);
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
};

const placeOrder = async (req, res) => {
  const user = req.session.user;
  req.session.authorized = true;
  const isAuthorized = req.session.authorized;
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  let userDetails = await userHelpers.getUserDetails(req.session.user._id);
  res.render("user/order", { total, user, isAuthorized, userDetails });
};

const checkout = async (req, res) => {
  try {
    let selectedAddressGroup = req.body;
    console.log("payment is : ",req.body.payment);
    let products = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
    
    

    userHelpers
      .placeOrder(selectedAddressGroup, products, totalPrice)
      .then((orderId) => {
        console.log("Placed Order ID:", orderId);
        res.json({ status: true, orderId });
      })
      .catch((error) => {
        console.error("Error placing order:", error);
        res.json({ status: false, error: "Error placing order" });
      });

    if (req.body.payment == "COD") {

    }
    console.log("delivery detailsis : ",req.body);
  } catch (error) {
    console.error("Error in checkout:", error);
    res.json({ status: false, error: "Error in checkout" });
  }
};

const orderSuccess = async (req, res) => {
  const orderId = req.query.orderId;
  const user = req.session.user;
  console.log("order id is : ", orderId);
  // let products = await userHelpers.getOrderedProducts(orderId);
  // console.log("orderes products are: " + products);
  res.render("user/order-success-page", { user, orderId });
  // const user = req.session.user;
  // let orders = await userHelpers.getUserOrders(req.session.user._id);
  // res.render("user/order-success", { user, orders });
};

const getOrderedProducts = async (req, res) => {
  try {
    const user = req.session.user;
    const orderId = req.params.id;
    console.log("order id is : ", orderId);

    let orderDetails = await userHelpers.getOrderedProducts(orderId);

    let products = orderDetails.products;
    let totalAmount = orderDetails.totalAmount;

    console.log("Products is ", products);
    console.log("Total Amount is ", totalAmount);

    res.render("user/view-order-products", { user, products, totalAmount });
  } catch (error) {
    console.error("Error fetching ordered products:", error);
    res.redirect("/");
  }
};
const getOrderedProductList = async (req, res) => {
  const user = req.session.user;
  // console.log(req.params.id);
  // let products = await userHelpers.getOrderedProducts(req.params.id);
  // console.log("orderes products are: " + products);
  // res.render("user/view-order-products", { user, products });
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/order-list", { user, orders, moment });
};
const getProfile = async (req, res) => {
  const user = req.session.user;
  let userDetails = await userHelpers.getUserDetails(req.session.user._id);

  res.render("user/profile", { user, userDetails });
};

const editProfile = async (req, res) => {
  const user = req.session.user;
  console.log(req.params.id);
  let userDetails = await userHelpers.getUserDetails(req.params.id);
  console.log(userDetails);
  res.render("user/edit-profile", { user, userDetails });
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
  getCart,
  addToCart,
  changeProductQuantity,
  placeOrder,
  checkout,
  orderSuccess,
  getOrderedProductList,
  getProfile,
  editProfile,
  changeProfile,
  enterOTP,
  enterOTPForgot,
  verifyOTP,
  verifyOTPForgot,
  resendOTP,
  resendOTPForgot,
  getOrderedProducts,
};
