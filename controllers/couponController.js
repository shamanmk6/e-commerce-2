const userHelpers = require("../helpers/user-helpers");
const Coupon = require("../model/couponModel");
const productHelpers = require("../helpers/product-helpers");
const moment = require("moment");

const getCoupons = async (req, res) => {
  try {
    const admin = req.session.admin;
    let coupons = await userHelpers.getCoupons();
    res.render("admin/view-coupons", { admin, coupons, moment });
  } catch (error) {
    console.log(error);
  }
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
    console.log("apply coupon called: ");
    const user = req.session.user;
    console.log("coupon is:", req.body.couponcode);
    const coupon = req.body.couponcode.toString();
    const validCouponResponse = await userHelpers.validCoupon(coupon, user._id);
    req.session.appliedCoupon = {
      code: req.body.couponcode,
    };
    const appliedCoupon = {
      code: req.body.couponcode,
    };
    if (!validCouponResponse.valid) {
      throw new Error(validCouponResponse.message || "Invalid Coupon");
    }

    let total = req.body.total
    console.log("Total @ apply coupon is: ",total);
    if (validCouponResponse.couponDocument.discount) {
      const discountValue = parseFloat(
        validCouponResponse.couponDocument.discount
      );
      if (!isNaN(discountValue)) {
        total = total-((discountValue / 100) * total)

        // await userHelpers.updateCartTotal(req.session.user._id, totalValue);
      } else {
        console.error(
          "Invalid discount value:",
          validCouponResponse.couponDocument.discount
        );
      }
    }
    let userDetails = await userHelpers.getUserDetails(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    // let total = await userHelpers.totalAmount(req.session.user._id);
    console.log("After apply coupon total: ",total);
    res.render("user/order", {
      user,
      total,
      cartCount,
      userDetails,
      appliedCoupon,
    });
  } catch (error) {
    const user = req.session.user;
    console.error("Error applying coupon:", error.message);
    const errorMessage = error.message || "Invalid Coupon. Please try again.";
    let total =
      req.session.discountedTotal ||
      req.body.total;
    let userDetails = await userHelpers.getUserDetails(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id);

    // let total = await userHelpers.totalAmount(req.session.user._id);
    res.render("user/order", {
      user,
      cartCount,
      total,
      errorMessage,
      userDetails,
    });
  }
};

const editCoupon = async (req, res) => {
  try {
    const admin = req.session.admin;
    let coupon = await userHelpers.getCoupon(req.params.id);
    console.log("Coupon is: ", coupon);
    res.render("admin/edit-coupon", { coupon, admin });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const updateCoupon = async (req, res) => {
  try {
    let coupon = await userHelpers.getCoupon(req.params.id);
    const admin = req.session.admin;
    let couponId = req.params.id;
    console.log("update Coupon:", req.body);

    const message = await userHelpers.updateCoupon(req.body, couponId);
    console.log("message is ", message);
    if (!message) {
      res.redirect("/admin/coupons");
      return;
    }
    console.log("rendering edit-coupon");
    res.render("admin/edit-coupon", { error: message, admin, coupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getCoupons,
  addCoupons,
  createCoupon,
  applyCoupon,
  editCoupon,
  updateCoupon,
};
