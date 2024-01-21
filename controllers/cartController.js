const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");


const getCart = async (req, res) => {
    const user = req.session.user;
    const categories = await productHelpers.getAllCategories();
    let cartItems = await userHelpers.getCartProducts(req.session.user._id);
    await userHelpers.getTotalAmount(req.session.user._id);
    let totalValue = await userHelpers.totalAmount(req.session.user._id);
    console.log("cartItems: ", cartItems);
    cartItems.forEach((cartItem) => {
      console.log("Images are:", cartItem.product.images);
    });
    res.render("user/cart", { user, cartItems, totalValue ,categories});
  };
  const addToCart = (req, res) => {
    const user = req.session.user;
    console.log("user:", user);
    console.log("api called");
  
    if (req.session.authorized) {
      userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true, redirectToLogin: false });
      });
    } else {
      // Return status with information to redirect to login
      res.json({ status: false, redirectToLogin: true });
    }
  };
  const changeProductQuantity = (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      console.log(response);
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    });
  };
  const checkout = async (req, res) => {
    try {
      let selectedAddressGroup = req.body;
      console.log("payment is : ", req.body.payment);
      let products = await userHelpers.getCartProductList(req.body.userId);
      let totalPrice = await userHelpers.totalAmount(req.body.userId);
  
      userHelpers
        .placeOrder(selectedAddressGroup, products, totalPrice)
        .then((orderId) => {
          console.log("Placed Order ID:", orderId);
          if (req.body.payment == "COD") {
            res.json({ codSuccess: true, orderId });
          } else {
            userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
              res.json(response);
            });
          }
        })
        .catch((error) => {
          console.error("Error placing order:", error);
          res.json({ status: false, error: "Error placing order" });
        });
  
      console.log("delivery detailsis : ", req.body);
    } catch (error) {
      console.error("Error in checkout:", error);
      res.json({ status: false, error: "Error in checkout" });
    }
  };
module.exports={
    getCart,
    addToCart,
    changeProductQuantity,
    checkout,
}