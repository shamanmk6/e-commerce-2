const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

const getUsers = (req, res, next) => {
  const admin=req.session.admin
  userHelpers.getAllUsers().then((users) => {
    res.render("admin/view-users", { admin , users });
  });
};

const blockUser = (req, res, next) => {
  let userId = req.params.id;
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
  let userId = req.params.id;
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
  const admin=req.session.admin
  try {
    let categories = await userHelpers.getCategory();
    res.render("admin/view-category", { admin, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const addCategory = (req, res) => {
  const admin=req.session.admin
  res.render("admin/add-category", { admin });
};
const categoryAdding = async (req, res) => {
  const admin=req.session.admin
  try {
      console.log(req.body.title);
      console.log(req.body.category);
      const categoryData = {
          title: req.body.title,
          category: req.body.category,
      };
      
      // Call categoryAdding function and wait for the result
      const result = await userHelpers.categoryAdding(categoryData);

      if (result.success) {
          // Category added successfully
          res.redirect("/admin/category");
      } else {
          // Category addition failed, display the message in the EJS file
          res.render("admin/add-category", { error: result.message, admin});
      }
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
};


const getOrders = async (req, res) => {
  const admin=req.session.admin
  let orders = await productHelpers.getAllOrders();
  console.log(orders);
  res.render("admin/orders-list", { admin, orders });
};

const cancelOrder = async (req, res) => {
  console.log(req.params.id);
  let orderId = req.params.id;
  productHelpers.cancelOrder(orderId).then((response) => {
    res.redirect("/admin/orders");
  });
};
const verifyAdminLogin=(req,res)=>{
     const { email, password } = req.body;
     console.log("admin details is: "+email+password);
     productHelpers.doAdminLogin(email, password).then((response) => {
      if (response.status) {
        req.session.authorized = true;
        req.session.admin = response.admin;
        res.redirect("/admin/view-products");
      } else {
        req.session.loginErr = response.message || "Invalid Username or password";
        res.redirect("/admin");
      }
    });
}
const adminLogout=(req,res)=>{
  req.session.destroy();
  res.redirect("/admin");
}
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
  adminLogout
};
