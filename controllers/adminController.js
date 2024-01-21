const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const moment = require("moment");

const getUsers = async (req, res, next) => {
  try {
    const admin = req.session.admin;
    console.log("admin is: ", admin);
    const users = await userHelpers.getAllUsers();
    res.render("admin/view-users", { admin, users });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const blockUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await userHelpers.blockUser(userId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to block user." });
  }
};
const unBlockUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await userHelpers.unBlockUser(userId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to unblock user." });
  }
};






const adminLogin = (req, res) => {
  res.render("admin/admin-login", { admin: true });
};





const verifyAdminLogin = (req, res) => {
  const { email, password } = req.body;
  console.log("admin details is: " + email + password);
  productHelpers.doAdminLogin(email, password).then((response) => {
    if (response.status) {
      req.session.admin = true;
      const admin = req.session.admin;
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
  verifyAdminLogin,
  adminLogin,
  adminLogout,
 
  
};
