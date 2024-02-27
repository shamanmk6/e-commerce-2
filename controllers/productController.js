const multer = require("multer");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const upload = require("../middlewares/upload");

const getProducts = (req, res, next) => {
  try {
    const admin = req.session.admin;
    console.log(admin);
    productHelpers.getAllProducts().then((products) => {
      console.log("admin page products are: " + JSON.stringify(products));
      res.render("admin/view-products", { admin, products });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const addProducts = (req, res, next) => {
  try {
    productHelpers.getAllCategories().then((categories) => {
      res.render("admin/add-products", { admin: true, categories });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
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

      res.redirect("/admin/add-products");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
      
    }
  });
};

const deleteProduct = (req, res, next) => {
  try {
    const proId = req.params.id;
    console.log(proId);
    productHelpers
      .deleteProduct(proId)
      .then((response) => {
        res.json({ success: true });
      })
      .catch((error) => {
        
        res
          .status(500)
          .json({ success: false, message: "Failed to delete product." });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const restoreProduct = (req, res, next) => {
  try {
    const proId = req.params.id;
  console.log(proId);
  productHelpers
    .restoreProduct(proId)
    .then((response) => {
      res.json({ success: true });
    })
    .catch((error) => {
      
      res
        .status(500)
        .json({ success: false, message: "Failed to restore product." });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
  
};
const editProduct = async (req, res, next) => {
  try {
    const admin = req.session.admin;
  productHelpers.getAllCategories().then(async (categories) => {
    let product = await productHelpers.getProductDetails(req.params.id);
    console.log(product);
    res.render("admin/edit-products", { admin, product, categories });
  });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
  
};

const updateProduct = (req, res, next) => {
  const admin = req.session.admin;
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
      res.redirect("/admin/view-products");
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
    const products = await productHelpers.getAllProducts();
    const categories = await productHelpers.getAllCategories();

    
    products.forEach((product) => {
      let finalDiscount = 0;

      if (product.category) {
        const category = categories.find(
          (cat) => cat.category.toLowerCase() === product.category.toLowerCase()
        );
        if (
          category &&
          category.offer !== "0" &&
          category.offerStart &&
          category.offerEnd
        ) {
          const currentDateCategory = new Date();
          const offerStartDateCategory = new Date(category.offerStart);
          const offerEndDateCategory = new Date(category.offerEnd);
          if (
            currentDateCategory >= offerStartDateCategory &&
            currentDateCategory <= offerEndDateCategory
          ) {
            finalDiscount = Math.max(finalDiscount, category.offer);
          }
        }
      }

      if (product.offer !== "0" && product.offerStart && product.offerEnd) {
        const currentDate = new Date();
        const offerStartDate = new Date(product.offerStart);
        const offerEndDate = new Date(product.offerEnd);
        if (currentDate >= offerStartDate && currentDate <= offerEndDate) {
          finalDiscount = Math.max(finalDiscount, product.offer);
        }
      }

      product.finalDiscount = finalDiscount;
    });

    if (req.session.user) {
      try {
        cartCount = await userHelpers.getCartCount(req.session.user._id);
        console.log("Cart Count:", cartCount);
      } catch (cartError) {
        console.error("Error fetching cartCount:", cartError);
      }
    }

    res.locals.cartCount = cartCount;

    res.render("user/view-products", {
      products,
      admin: false,
      user,
      cartCount,
      categories,
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
      const categories = await productHelpers.getAllCategories();
      console.log("proId:", proId);
      let cartCount = await userHelpers.getCartCount(req.session.user._id);
      let product = await userHelpers.productDetails(proId);

      console.log("product:", product);

      let finalDiscount = 0;
      
      if (product.category) {
          const category = categories.find(cat => cat.category.toLowerCase() === product.category.toLowerCase());
          if (category && category.offer !== "0" && category.offerStart && category.offerEnd) {
              const currentDateCategory = new Date();
              const offerStartDateCategory = new Date(category.offerStart);
              const offerEndDateCategory = new Date(category.offerEnd);
              if (currentDateCategory >= offerStartDateCategory && currentDateCategory <= offerEndDateCategory) {
                  finalDiscount = Math.max(finalDiscount, category.offer);
              }
          }
      }

      
      if (product.offer !== "0" && product.offerStart && product.offerEnd) {
          const currentDate = new Date();
          const offerStartDate = new Date(product.offerStart);
          const offerEndDate = new Date(product.offerEnd);
          if (currentDate >= offerStartDate && currentDate <= offerEndDate) {
              finalDiscount = Math.max(finalDiscount, product.offer);
          }
      }

    
      product.finalDiscount = finalDiscount;

      if (product && product.images && Array.isArray(product.images)) {
          res.render("user/product-details", {
              admin: false,
              product,
              user,
              categories,
              cartCount,
          });
      } else {
          console.error("Invalid product data:", product);
          res.status(404).send("Product not found");
      }
  } catch (error) {
      console.error(error);
      next(error);
  }
};
;

const deleteProductImage = async (req, res) => {
  try {
    let proId = req.params.id;
    console.log("pro Id is: ", proId);
    let imageName = req.body.imageName;
    console.log("image name is : ", imageName);
    await productHelpers.deleteImage(proId, imageName);
    res.json({ status: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: false, message: "Failed to mark order as delivered." });
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
  deleteProductImage,
};
