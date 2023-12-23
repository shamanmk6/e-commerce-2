const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const Product = require("../model/productsModel");
module.exports = {
  addProduct: (product, images) => {
    console.log("Trying to insert product");
    console.log(product);

    const newProduct = new Product({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      quantity: product.quantity,
      images: [], // Initialize the images field as an empty array
    });

    return new Promise((resolve, reject) => {
      // Insert the product into the database
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(newProduct)
        .then((result) => {
          console.log(result);

          // Resolve with the inserted product ID and image filenames
          const productId = result.insertedId;

          if (!images || images.length === 0) {
            resolve({ productId, imageFilenames: [] }); // No images to process
          } else {
            // Extract and store image filenames in the product document
            const imageFilenames = images.map((image) => image.filename);

            // Update the product with the image filenames
            db.getDatabase()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: productId },
                { $set: { images: imageFilenames } }
              )
              .then(() => {
                resolve({ productId, imageFilenames });
              })
              .catch((error) => {
                reject(error);
              });
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getAllCategories: () => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray()
        .then((categories) => {
          resolve(categories);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      products = products.map((product) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity: product.quantity,
        description: product.description,
        images: product.images || [], // Assuming 'images' is an array field
      }));
      resolve(products);
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      console.log(proId);
      console.log(new objectId(proId));
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: new objectId(proId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: new objectId(proId) })
        .then((product) => {
          if (product) {
            product.images = product.images || []; // Assuming 'images' is an array field
            resolve(product);
          } else {
            reject(new Error("Product not found"));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  updateProduct: (proId, proDetails, images) => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await db.getDatabase()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                    { _id: new objectId(proId) },
                    {
                        $set: {
                            name: proDetails.name,
                            description: proDetails.description,
                            price: proDetails.price,
                            category: proDetails.category,
                            quantity: proDetails.quantity,
                            images: images, // Assuming 'images' is an array
                        },
                    }
                );

            if (response.modifiedCount > 0) {
                resolve();
            } else {
                reject(new Error("No document was updated."));
            }
        } catch (error) {
            reject(error);
        }
    });
},
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .getDatabase()
          .collection(collection.ORDER_COLLECTION)
          .find()
          .toArray();

        // Extract unique user IDs from the orders
        let userIds = orders.map((order) => order.userId);

        // Fetch user details for the obtained user IDs
        let users = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .find({ _id: { $in: userIds } })
          .toArray();

        // Map user details to orders
        let ordersWithUserDetails = orders.map((order) => {
          // Find the corresponding user details
          let user = users.find((user) => user._id.equals(order.userId));

          // Add user details (e.g., name) to the order
          return {
            ...order,
            userName: user ? user.name : "Unknown", // Change 'Unknown' to a default value if needed
          };
        });

        resolve(ordersWithUserDetails);
      } catch (error) {
        reject(error);
      }
    });
  },
  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          { $set: { status: "cancelled" } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  doAdminLogin: (email, password) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let admin = await db
          .getDatabase()
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ email: email }); // Use the email parameter
  
        if (admin && password === admin.password) {
          console.log("Login-success");
          response.admin = admin;
          response.status = true;
          resolve(response);
        } else {
          console.log("Login failed or not an admin");
          resolve({ status: false, message: "Login failed or not an admin" });
        }
      } catch (error) {
        console.error("Error during login:", error);
        resolve({ status: false, message: "An error occurred during login" });
      }
    });
  }
};
