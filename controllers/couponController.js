const userHelpers = require("../helpers/user-helpers");
const Coupon = require("../model/couponModel");
const productHelpers = require("../helpers/product-helpers");
const moment = require("moment");

const getCoupons = async (req, res) => {
  const admin = req.session.admin;
  let coupons = await userHelpers.getCoupons();
  res.render("admin/view-coupons", { admin, coupons, moment });
};

const addCoupons = async (req, res) => {
  try {
    const admin = req.session.admin;
    res.render("admin/add-coupons", { admin });
  } catch (error) {
    throw new Error(error);
  }
};

const createCoupon = async (req, res) => {
  try {
    const admin = req.session.admin;
    console.log("coupon name is:", req.body.name);
    console.log("coupon expiry is:", req.body.expiry);
    console.log("coupon discount is:", req.body.discount);

    const couponData = {
      name: req.body.name,
      expiry: req.body.expiry,
      discount: req.body.discount,
    };

    const result = await userHelpers.couponAdding(couponData);

    if (result.success) {
      res.redirect("/admin/coupons");
    } else {
      res.render("admin/add-coupons", { error: result.message, admin });
    }
  } catch (error) {
    throw new Error(error);
  }
};
const applyCoupon = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("coupon is:", req.body.couponcode);
    const coupon = req.body.couponcode;
    const validCouponResponse = await userHelpers.validCoupon(coupon, user._id);

    if (!validCouponResponse.valid) {
      throw new Error(validCouponResponse.message || "Invalid Coupon");
    }

    let cartItems = await userHelpers.getCartProducts(req.session.user._id);

    let totalValue =
      req.session.discountedTotal ||
      (await userHelpers.totalAmount(req.session.user._id));

      if (validCouponResponse.couponDocument.discount) {
        
        const discountValue = parseFloat(validCouponResponse.couponDocument.discount);
        if (!isNaN(discountValue)) {
            totalValue = (discountValue / 100) * totalValue;
            req.session.discountedTotal = totalValue;
            await userHelpers.updateCartTotal(req.session.user._id, totalValue);
        } else {
            console.error('Invalid discount value:', validCouponResponse.couponDocument.discount);
            
        }
    }
    

    res.render("user/cart", { user, cartItems, totalValue });
  } catch (error) {
    const user = req.session.user;
    console.error("Error applying coupon:", error.message);
    const errorMessage = error.message || "Invalid Coupon. Please try again.";
    let cartItems = await userHelpers.getCartProducts(req.session.user._id);
    let totalValue =
      req.session.discountedTotal ||
      (await userHelpers.totalAmount(req.session.user._id));
    res.render("user/cart", { user, cartItems, totalValue, errorMessage });
  }
};

const editCoupon = async (req, res) => {
  const admin = req.session.admin;
  let coupon = await userHelpers.getCoupon(req.params.id);
  console.log("Coupon is: ", coupon);
  res.render("admin/edit-coupon", { coupon, admin });
};

const updateCoupon = async (req,res) => {
    let couponId= req.params.id;
   console.log("update Coupon:",req.body);
   await userHelpers.updateCoupon(req.body,couponId)
   res.redirect('/admin/coupons')
};

module.exports = {
  getCoupons,
  addCoupons,
  createCoupon,
  applyCoupon,
  editCoupon,
  updateCoupon,
};
