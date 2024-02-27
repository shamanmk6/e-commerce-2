const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin.js");
const {
  getUsers,
  blockOrUnblockUser,
  verifyAdminLogin,
  adminLogout,
  adminLogin,
  getSales,
  getSalesReport,
  getOrdersReport,
  getOrdersReportXLXS,
  getSalesReportXLXS,

} = require("../controllers/adminController");

const {
  getProducts,
  addProducts,
  productAdding,
  deleteProduct,
  restoreProduct,
  editProduct,
  updateProduct,
  deleteProductImage,
} = require("../controllers/productController");
const{
  getCoupons,
  addCoupons,
  createCoupon,
  editCoupon,
  updateCoupon
}=require('../controllers/couponController.js')

const{
    category,
    addCategory ,
    categoryAdding,
    editCategory,
    updateCategory,
}=require('../controllers/categoryController.js')
const{
  getOrders,
  cancelOrder,
  deliveredOrder,
  shippedOrder,
  orderedItems,
  returnOrder,
}=require('../controllers/orderController.js')

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

router.get("/:action-user/:id", blockOrUnblockUser);

router.get("/category", isAdmin, category);

router.route("/add-category").get(isAdmin,addCategory).post(isAdmin,categoryAdding);

router.get("/edit-category/:id", isAdmin, editCategory);
router.post("/edit-category/:id", isAdmin, updateCategory);

router.get("/orders", isAdmin, getOrders);

router.post("/cancel-order/:id",isAdmin, cancelOrder);
router.post("/return-order/:id",isAdmin, returnOrder);
router.get("/delivered-order/:id",isAdmin, deliveredOrder);

router.get("/shipped-order/:id",isAdmin, shippedOrder);

router.get("/ordered-items/:id",isAdmin, orderedItems);

router.get("/coupons",isAdmin,getCoupons)
router.get("/sales/:year?",isAdmin,getSales)

router.get("/add-coupons",isAdmin,addCoupons)
router.post("/add-coupons",isAdmin,createCoupon)

router.get("/edit-coupon/:id",isAdmin,editCoupon);
router.post("/edit-coupon/:id",isAdmin,updateCoupon);

router.post("/delete-image/:id",isAdmin,deleteProductImage);

router.get('/sales-report',isAdmin,getSalesReport)
router.get('/sales-reportxlsx',isAdmin,getSalesReportXLXS)
router.get('/orders-report',isAdmin,getOrdersReport)
router.get('/orders-reportxlsx',isAdmin,getOrdersReportXLXS)

module.exports = router;
