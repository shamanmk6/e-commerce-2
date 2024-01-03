const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const moment = require("moment");

const getUsers = (req, res, next) => {
  const admin = req.session.admin;
  console.log("admin is: ",admin);
  userHelpers.getAllUsers().then((users) => {
    res.render("admin/view-users", { admin, users });
  });
};

const blockUser = (req, res, next) => {
  const userId = req.params.id;
  console.log(userId);
  userHelpers
    .blockUser(userId)
    .then((response) => {
      res.json({ success: true });
    })
    .catch((error) => {
      // Handle error, e.g., send an error response
      res
        .status(500)
        .json({ success: false, message: "Failed to block user." });
    });
};
const unBlockUser = (req, res, next) => {
  const userId = req.params.id;
  console.log(userId);
  userHelpers
    .unBlockUser(userId)
    .then((response) => {
      res.json({ success: true });
    })
    .catch((error) => {
      // Handle error, e.g., send an error response
      res
        .status(500)
        .json({ success: false, message: "Failed to unblock user." });
    });
};
const category = async (req, res) => {
  const admin = req.session.admin;
  try {
    let categories = await userHelpers.getCategory();
    res.render("admin/view-category", { admin, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const addCategory = (req, res) => {
  const admin = req.session.admin;
  res.render("admin/add-category", { admin });
};
const categoryAdding = async (req, res) => {
  const admin = req.session.admin;
  try {
    console.log(req.body.title);
    console.log(req.body.category);
    const categoryData = {
      title: req.body.title,
      category: req.body.category,
    };

    const result = await userHelpers.categoryAdding(categoryData);

    if (result.success) {
      res.redirect("/admin/category");
    } else {
      res.render("admin/add-category", { error: result.message, admin });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getOrders = async (req, res) => {
  const admin = req.session.admin;
  let orders = await productHelpers.getAllOrders();
  console.log(orders);
  res.render("admin/orders-list", { admin, orders ,moment });
};

const cancelOrder = async (req, res) => {
  console.log(req.params.id);
  let orderId = req.params.id;
  productHelpers.cancelOrder(orderId).then((response) => {
    res.redirect("/admin/orders");
  });
};
const deliveredOrder = async (req, res) => {
  console.log(req.params.id);
  let orderId = req.params.id;
  productHelpers.deliveredOrder(orderId).then((response) => {
    res.redirect("/admin/orders");
  });
};
const shippedOrder = async (req, res) => {
  console.log(req.params.id);
  let orderId = req.params.id;
  productHelpers.shippedOrder(orderId).then((response) => {
    res.redirect("/admin/orders");
  });
};
const verifyAdminLogin = (req, res) => {
  const { email, password } = req.body;
  console.log("admin details is: " + email + password);
  productHelpers.doAdminLogin(email, password).then((response) => {
    if (response.status) {
      req.session.admin = true;
      const admin=req.session.admin
      res.redirect("/admin/view-products?admin=" + admin);
    } else {
      req.session.loginErr = response.message || "Invalid Username or password";
      res.redirect("/admin");
    }
  });
};
const adminLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
};
module.exports = {
  getUsers,
  blockUser,
  unBlockUser,
  category,
  addCategory,
  categoryAdding,
  getOrders,
  cancelOrder,
  verifyAdminLogin,
  adminLogout,
  deliveredOrder,
  shippedOrder,
};
