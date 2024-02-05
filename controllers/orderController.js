const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const moment = require("moment");
const getOrders = async (req, res) => {
    try {
      const admin = req.session.admin;
      let orders = await productHelpers.getAllOrders();
      console.log(orders);
      res.render("admin/orders-list", { admin, orders, moment });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", { message: "Internal Server Error" });
    }
  };
  const cancelRequest= async(req,res) => {
    try {
      
      console.log(req.params.id);
      let orderId = req.params.id;
      const cancelReasonMessage = req.body.message;
      console.log(cancelReasonMessage);
      await productHelpers.cancelRequest(orderId,cancelReasonMessage);
     
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Failed to cancel order." });
    }
  };
  const cancelOrder = async (req, res) => {
    try {
      console.log(req.params.id);
      let orderId = req.params.id;
      const cancelReasonMessage = req.body.message;
      console.log("admin cancel reason message: ",cancelReasonMessage);
      await productHelpers.cancelOrder(orderId,cancelReasonMessage);
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Failed to cancel order." });
    }
  };
  const deliveredOrder = async (req, res) => {
    try {
      console.log(req.params.id);
      let orderId = req.params.id;
      await productHelpers.deliveredOrder(orderId);
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Failed to mark order as delivered." });
    }
  };
  const shippedOrder = async (req, res) => {
    try {
      console.log(req.params.id);
      let orderId = req.params.id;
      await productHelpers.shippedOrder(orderId);
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: false, message: "Failed to mark order as shipped." });
    }
  };
  const orderedItems = async (req, res, next) => {
    try {
      
      const orderId = req.params.id;
      console.log("order id is : ", orderId);
  
      let orderDetails = await userHelpers.getOrderedProducts(orderId);
  
      let products = orderDetails.products;
      let totalAmount = orderDetails.totalAmount;
  
      console.log("Products is ", products);
      console.log("Total Amount is ", totalAmount);
  
      res.render("admin/view-order-products", {admin:true, products, totalAmount });
    } catch (error) {
      console.error("Error fetching ordered products:", error);
      res.redirect("/");
    }
  };
  const placeOrder = async (req, res) => {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    req.session.authorized = true;
    const isAuthorized = req.session.authorized;
    let total = await userHelpers.totalAmount(req.session.user._id);
    let userDetails = await userHelpers.getUserDetails(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    res.render("user/order", { total, user, isAuthorized, userDetails,categories,cartCount  });
  };
  const orderSuccess = async (req, res) => {
    const orderId = req.query.orderId;
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    console.log("order id is : ", orderId);
    // let products = await userHelpers.getOrderedProducts(orderId);
    // console.log("orderes products are: " + products);
    res.render("user/order-success-page", { user, orderId,categories });
    // const user = req.session.user;
    // let orders = await userHelpers.getUserOrders(req.session.user._id);
    // res.render("user/order-success", { user, orders });
  };
  const getOrderedProducts = async (req, res) => {
    try {
      const user = req.session.user;
      const orderId = req.params.id;
      const categories = await productHelpers.getAllCategories();
      console.log("order id is : ", orderId);
  
      let orderDetails = await userHelpers.getOrderedProducts(orderId);
      
      let products = orderDetails.products;
      let totalAmount = orderDetails.totalAmount;
      let orderStatus = orderDetails.status;
      let returnRequest = orderDetails.returnRequest;
      let adminCancelReason = orderDetails.adminCancelReason;
      
      console.log("order details is: ",orderDetails);
      console.log("Products is ", products);
      console.log("Total Amount is ", totalAmount);
  
      res.render("user/view-order-products", { user, products, totalAmount,orderStatus,orderId,returnRequest,adminCancelReason});
    } catch (error) {
      console.error("Error fetching ordered products:", error);
      res.redirect("/");
    }
  };
  const getOrderedProductList = async (req, res) => {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    // console.log(req.params.id);
    // let products = await userHelpers.getOrderedProducts(req.params.id);
    // console.log("orderes products are: " + products);
    // res.render("user/view-order-products", { user, products });
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    res.render("user/order-list", { user, orders, moment,categories });
  };
  const returnRequest= async(req,res) => {
    try {
      
      console.log(req.params.id);
      let orderId = req.params.id;
      const returnReasonMessage = req.body.message;
      console.log(returnReasonMessage);
      await productHelpers.returnRequest(orderId,returnReasonMessage);
     
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Failed to cancel order." });
    }
  };

  const returnOrder = async(req,res) => {
    try {
      
      console.log(req.params.id);
      let orderId = req.params.id;
      let returnStatus=req.body.message
      await productHelpers.returnOrder(orderId,returnStatus);
     
      res.json({ status: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Failed to cancel order." });
    }
  };
module.exports={
  getOrders,
  cancelOrder,
  deliveredOrder,
  shippedOrder,
  orderedItems,
  placeOrder,
  orderSuccess,
  getOrderedProductList,
  getOrderedProducts,
  returnRequest,
  returnOrder,
  cancelRequest,

}