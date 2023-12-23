const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin.js");
const {
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
} = require("../controllers/adminController");

const {
  adminLogin,
  getProducts,
  addProducts,
  productAdding,
  deleteProduct,
  restoreProduct,
  editProduct,
  updateProduct,
} = require("../controllers/productController");

/* GET home page. */
router.get("/", adminLogin);
router.get("/view-products", isAdmin, getProducts);
router.post("/login", verifyAdminLogin);
router.get("/logout", adminLogout);

router.get("/add-products", addProducts);
router.post("/add-products", productAdding);

router.get("/delete-product/:id", deleteProduct);
router.get("/restore-product/:id", restoreProduct);

router.route("/edit-product/:id").get(editProduct).post(updateProduct);

router.get("/users", isAdmin, getUsers);

router.get("/block-user/:id", blockUser);
router.get("/unblock-user/:id", unBlockUser);

router.get("/category", isAdmin, category);

router.route("/add-category").get(addCategory).post(categoryAdding);

router.get("/orders", isAdmin, getOrders);

router.get("/cancel-order/:id", cancelOrder);

module.exports = router;
