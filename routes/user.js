const express = require("express");

const router = express.Router();
const { response } = require("../app");
const verifyLogin = require("../middlewares/verifyLogin.js");
const {
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
  
} = require("../controllers/userController.js");
const {
  productDetails,
  viewProducts,
} = require("../controllers/productController.js");
const{
  applyCoupon,
}=require('../controllers/couponController.js');
const{
  cancelOrder,
  placeOrder,
  orderSuccess,
  getOrderedProductList,
  getOrderedProducts,
  returnOrder,
}=require('../controllers/orderController.js')
const{
  getCart,
  addToCart,
  changeProductQuantity,
  checkout,
}=require('../controllers/cartController.js');

// const { verifyEmail } = require('../helpers/user-helpers');

// const checkLogin = (req, res, next) => {
//   if (req.session.loggedIn) {
//     // User is logged in, proceed to the next middleware or route handler
//     next();
//   } else {
//     // User is not logged in, redirect to the login page
//     res.redirect('/login');
//   }
// };

/* GET users listing. */
router.get("/", viewProducts);

router.route("/login").get(loginUser).post(validateLogin);

router.route("/signup").get(signupUser).post(registerUser);

router.get("/logout", logOut);
router.get("/verify", verifyEmail);

router.get("/details/:id",verifyLogin, productDetails);

router.get("/forgot-password", forgotPassword);

router.post("/forgot-password", resetPassword);

router.get("/resetPassword", changePassword);
router.post("/admin/resetPassword", addNewPassword);

router.get("/cart", verifyLogin, getCart);

router.get("/add-to-cart/:id",verifyLogin,addToCart);

router.post("/change-product-quantity",verifyLogin, changeProductQuantity);

router.get("/place-order", verifyLogin, placeOrder);

router.post("/place-order",checkout);

router.get("/order-success", verifyLogin, orderSuccess);

router.get("/view-ordered-product-list/:id",verifyLogin, getOrderedProductList);
router.get("/view-ordered-products/:id",verifyLogin,getOrderedProducts)

router.get("/profile", verifyLogin, getProfile);

router.get("/edit-profile/:id", verifyLogin,editProfile);

router.post("/edit-profile/:id", verifyLogin,changeProfile);

router.get("/enter-otp", enterOTP);
router.get("/enter-otp-forgot", enterOTPForgot);

router.post("/verify-otp", verifyOTP);
router.post("/verify-otp-forgot", verifyOTPForgot);

router.get("/resend-otp", async (req, res) =>
  resendOTP(req, res, "/enter-otp")
);
router.get("/resend-otp-forgot", async (req, res) =>
  resendOTP(req, res, "/enter-otp-forgot")
);

router.post("/verify-payment",verifyPayment)

router.post("/apply-coupon",verifyLogin,applyCoupon)

router.get("/cancel-order/:id",verifyLogin,cancelOrder);
router.get("/return-order/:id",verifyLogin,returnOrder);

router.get("/wallet",verifyLogin,getWallet)
module.exports = router;
