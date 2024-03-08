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
  removeCoupon,
}=require('../controllers/couponController.js');
const{
  cancelOrder,
  placeOrder,
  orderSuccess,
  getOrderedProductList,
  getOrderedProducts,
  returnRequest,
  cancelRequest
}=require('../controllers/orderController.js')
const{
  getCart,
  addToCart,
  changeProductQuantity,
  checkout,
  deleteCartItem,
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
router.post("/delete-item",verifyLogin, deleteCartItem);
router.get("/place-order/:totalValue", verifyLogin, placeOrder);

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
  resendOTPForgot(req, res, "/enter-otp-forgot")
);

router.post("/verify-payment",verifyPayment)

router.post("/apply-coupon",verifyLogin,applyCoupon)
router.post("/remove-coupon",verifyLogin,removeCoupon)

router.post("/cancel-order/:id",verifyLogin,cancelRequest);
router.post("/return-order/:id",verifyLogin,returnRequest);

router.get("/wallet",verifyLogin,getWallet)

module.exports = router;
