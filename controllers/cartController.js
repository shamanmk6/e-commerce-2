const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

const getCart = async (req, res) => {
  const user = req.session.user;
  let cartItems = await userHelpers.getCartProducts(req.session.user._id);
  let categories = await userHelpers.getCategory();
  let cartCount = await userHelpers.getCartCount(req.session.user._id);

  cartItems.forEach((cartItem) => {
    const currentDate = new Date();

    // Check if the product has an offer and the offer is valid
    if (
      cartItem.product.offer !== "0" &&
      currentDate >= new Date(cartItem.product.offerStart) &&
      currentDate <= new Date(cartItem.product.offerEnd)
    ) {
      let discountedPriceProduct =
        cartItem.product.price -
        (cartItem.product.price * cartItem.product.offer) / 100;
      cartItem.product.discountedPriceProduct =
        discountedPriceProduct.toFixed(2);
    } else {
      cartItem.product.discountedPriceProduct = null;
    }

    // Check if the product has a category
    if (cartItem.product.category) {
      const category = categories.find(
        (cat) =>
          cat.category.toLowerCase() === cartItem.product.category.toLowerCase()
      );

      if (
        category &&
        category.offer !== "0" &&
        category.offerStart &&
        category.offerEnd &&
        currentDate >= new Date(category.offerStart) &&
        currentDate <= new Date(category.offerEnd)
      ) {
        let discountedPriceCategory =
          cartItem.product.price -
          (cartItem.product.price * category.offer) / 100;
        cartItem.product.discountedPriceCategory =
          discountedPriceCategory.toFixed(2);
      } else {
        cartItem.product.discountedPriceCategory = null;
      }
    } else {
      cartItem.product.discountedPriceCategory = null;
    }
    console.log("Debug - Product:", cartItem.product.name);
    console.log("Debug - Product Offer:", cartItem.product.offer);
    console.log("Debug - Category Offer:", categories ? categories.offer : null);
    // Choose the greater discounted price for each item
    const discountedPrices = [
      cartItem.product.discountedPriceProduct,
      cartItem.product.discountedPriceCategory,
    ].filter((price) => price !== null);

    if (discountedPrices.length > 0) {
      cartItem.product.discountedPrice = Math.min(
        ...discountedPrices.map((price) => parseFloat(price))
      ).toFixed(2);
    } else {
      // If no discounted prices, use the original price
      cartItem.product.discountedPrice = cartItem.product.price;

    }
    console.log("Debug - Discounted Price:", cartItem.product.discountedPrice);
  });

  await userHelpers.getTotalAmount(req.session.user._id);
  let totalValue = await userHelpers.totalAmount(req.session.user._id);

  console.log("cartItems: ", cartItems);
  cartItems.forEach((cartItem) => {
    console.log("Images are:", cartItem.product.images);
  });

  res.render("user/cart", { user, cartItems, totalValue ,cartCount });
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
module.exports = {
  getCart,
  addToCart,
  changeProductQuantity,
  checkout,
};
