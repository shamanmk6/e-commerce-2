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
  deliveredOrder,
  shippedOrder,
  
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
  orderedItems,
} = require("../controllers/productController");

/* GET home page. */
router.get("/", adminLogin);
router.get("/view-products", isAdmin, getProducts);
router.post("/login", verifyAdminLogin);
router.get("/logout", adminLogout);

router.get("/add-products",isAdmin, addProducts);
router.post("/add-products",isAdmin, productAdding);

router.get("/delete-product/:id", deleteProduct);
router.get("/restore-product/:id", restoreProduct);

router.route("/edit-product/:id").get(isAdmin,editProduct).post(isAdmin,updateProduct);

router.get("/users", isAdmin, getUsers);

router.get("/block-user/:id", blockUser);
router.get("/unblock-user/:id", unBlockUser);

router.get("/category", isAdmin, category);

router.route("/add-category").get(isAdmin,addCategory).post(isAdmin,categoryAdding);

router.get("/orders", isAdmin, getOrders);

router.get("/cancel-order/:id",isAdmin, cancelOrder);

router.get("/delivered-order/:id",isAdmin, deliveredOrder);

router.get("/shipped-order/:id",isAdmin, shippedOrder);

router.get("/ordered-items/:id",isAdmin, orderedItems);
module.exports = router;
