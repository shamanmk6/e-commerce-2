const multer = require("multer");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const upload = require("../middlewares/upload");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/product-images"); // Correct typo in 'pubic'
//   },
//   filename: function (req, file, cb) {
//     const fileName = file.originalname.split(" ").join("-");
//     cb(null, fileName + "-" + Date.now() + ".jpg");
//   },
// });

// const upload = multer({ storage: storage });

const adminLogin = (req, res) => {
  res.render("admin/admin-login", { admin: true });
};
const getProducts = (req, res, next) => {
  const admin = req.session.admin;
  console.log(admin);
  productHelpers.getAllProducts().then((products) => {
    console.log("admin page products are: " + JSON.stringify(products));
    res.render("admin/view-products", { admin, products });
  });
};
const addProducts = (req, res, next) => {
  productHelpers.getAllCategories().then((categories) => {
    res.render("admin/add-products", { admin: true, categories });
  });
};

const productAdding = (req, res, next) => {
  upload.array("image")(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: err.message });
    }

    console.log(req.body);
    req.files.forEach((image) => {
      console.log(image.filename);
    });
    try {
      const id = await productHelpers.addProduct(req.body, req.files);

      let images = req.files;

      if (!images || images.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Process each image
      // images.forEach((image) => {
        
      // });

      res.redirect("/admin/add-products");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

// const deleteProduct = (req, res, next) => {
//   let proId = req.params.id;
//   console.log(proId);
//   productHelpers.deleteProduct(proId).then((response) => {
//     res.redirect("/admin/view-products");
//   });
// };
const deleteProduct = (req, res, next) => {
  const proId = req.params.id;
  console.log(proId);
  productHelpers
    .deleteProduct(proId)
    .then((response) => {
      res.json({ success: true });
    })
    .catch((error) => {
      // Handle error, e.g., send an error response
      res
        .status(500)
        .json({ success: false, message: "Failed to delete product." });
    });
};
// const restoreProduct = (req, res, next) => {
//   let proId = req.params.id;
//   console.log(proId);
//   productHelpers.restoreProduct(proId).then((response) => {
//     res.redirect("/admin/view-products");
//   });
// };
const restoreProduct = (req, res, next) => {
  const proId = req.params.id;
  console.log(proId);
  productHelpers
    .restoreProduct(proId)
    .then((response) => {
      res.json({ success: true });
    })
    .catch((error) => {
      // Handle error, e.g., send an error response
      res
        .status(500)
        .json({ success: false, message: "Failed to restore product." });
    });
};
const editProduct = async (req, res, next) => {
  productHelpers.getAllCategories().then(async (categories) => {
    let product = await productHelpers.getProductDetails(req.params.id);
    console.log(product);
    res.render("admin/edit-products", { admin: true, product, categories });
  });
};

const updateProduct = (req, res, next) => {
  console.log(req.params.id);
  let id = req.params.id;
  upload.array("image")(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: err.message });
    }

    console.log(req.body);
    req.files.forEach((image) => {
      console.log(image.filename);
    });

    try {
      await productHelpers.updateProduct(
        id,
        req.body,
        req.files.map((file) => file.filename)
      );
      res.redirect("/admin");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
const viewProducts = async (req, res, next) => {
  try {
    const user = req.session.user;
    console.log(user);

    let cartCount = 0;

    if (req.session.user) {
      try {
        cartCount = await userHelpers.getCartCount(req.session.user._id);
        console.log("Cart Count:", cartCount);
      } catch (cartError) {
        console.error("Error fetching cartCount:", cartError);
      }
    }

    const products = await productHelpers.getAllProducts();

    
    res.locals.cartCount = cartCount;

    
    res.render("user/view-products", {
      products,
      admin: false,
      user,
      cartCount,
    });
  } catch (error) {
    console.error(error);
    
    next(error);
  }
};
const productDetails = async (req, res, next) => {
  const user = req.session.user;
  console.log("user:", user);
  try {
    const proId = req.params.id;
    console.log("proId:", proId); 
    let product = await userHelpers.productDetails(proId);
    console.log("product:", product); 
    if (product && product.images && Array.isArray(product.images)) {
      res.render("user/product-details", { admin: false, product, user });
    } else {
      
      console.error("Invalid product data:", product);
      
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error(error);
    next(error); 
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


module.exports = {
  getProducts,
  addProducts,
  productAdding,
  deleteProduct,
  restoreProduct,
  editProduct,
  updateProduct,
  productDetails,
  viewProducts,
  adminLogin,
  orderedItems,
};
