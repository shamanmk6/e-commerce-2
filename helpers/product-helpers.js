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
      offer: product.offer,
      offerStart: product.offerStart,
      offerEnd: product.offerEnd,
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
      try {
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
          offer: product.offer,
          offerStart: product.offerStart,
          offerEnd: product.offerEnd,
          description: product.description,
          images: product.images || [],
          isDeleted: product.isDeleted,
        }));
        resolve(products);
      } catch (error) {
        reject(error);
      }
    });
  },

  getTotalProductsCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const totalProductsCount = await db
          .getDatabase()
          .collection(collection.PRODUCT_COLLECTION)
          .countDocuments();
        resolve(totalProductsCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  getProductsForPage: (skip, limit) => {
    return new Promise(async (resolve, reject) => {
      try {
        const products = await db
          .getDatabase()
          .collection(collection.PRODUCT_COLLECTION)
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
        resolve(products);
      } catch (error) {
        reject(error);
      }
    });
  },
  //   deleteProduct: (proId) => {
  //     return new Promise((resolve, reject) => {
  //         console.log("Deleting product with _id:", proId);
  //         const productId = new objectId(proId);

  //         db.getDatabase()
  //             .collection(collection.PRODUCT_COLLECTION)
  //             .findOneAndUpdate(
  //                 { _id: productId, isDeleted: false },
  //                 { $set: { isDeleted: true } },
  //                 { returnDocument: 'after' } // Returns the updated document
  //             )
  //             .then((result) => {
  //                 if (result && result.value) {
  //                     console.log("Product deleted:", result.value);
  //                     resolve(result.value);
  //                 } else {
  //                     console.log("Product not found or already deleted");
  //                     resolve(null);
  //                 }
  //             })
  //             .catch((error) => {
  //                 console.error("Error during product deletion:", error);
  //                 reject(error);
  //             });
  //     });
  // },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      console.log(proId);
      console.log(new objectId(proId));
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: new objectId(proId) }, { $set: { isDeleted: true } })
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  // restoreProduct: (proId) => {
  //   return new Promise((resolve, reject) => {
  //       console.log("Deleting product with _id:", proId);
  //       const productId = new objectId(proId);

  //       db.getDatabase()
  //           .collection(collection.PRODUCT_COLLECTION)
  //           .findOneAndUpdate(
  //               { _id: productId, isDeleted: true },
  //               { $set: { isDeleted: false } },
  //               { returnDocument: 'after' } // Returns the updated document
  //           )
  //           .then((result) => {
  //               if (result && result.value) {
  //                   console.log("Product restores:", result.value);
  //                   resolve(result.value);
  //               } else {
  //                   console.log("Product not found or already restored");
  //                   resolve(null);
  //               }
  //           })
  //           .catch((error) => {
  //               console.error("Error during product deletion:", error);
  //               reject(error);
  //           });
  //   });
  // },
  restoreProduct: (proId) => {
    return new Promise((resolve, reject) => {
      console.log(proId);
      console.log(new objectId(proId));
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: new objectId(proId) }, { $set: { isDeleted: false } })
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((error) => {
          reject(error);
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
            product.images = product.images || [];
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
        const productCollection = db
          .getDatabase()
          .collection(collection.PRODUCT_COLLECTION);

        // Check if new images are uploaded
        const updateData = {
          name: proDetails.name,
          description: proDetails.description,
          price: proDetails.price,
          category: proDetails.category,
          quantity: proDetails.quantity,
          offer: proDetails.offer,
          offerStart: proDetails.offerStart,
          offerEnd: proDetails.offerEnd,
        };

        if (images.length > 0) {
          updateData.images = images;
        }

        const response = await productCollection.updateOne(
          { _id: new objectId(proId) },
          { $set: updateData }
        );

        if (response.modifiedCount > 0) {
          resolve();
        } else {
          resolve("no document updated");
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

        let userIds = orders.map((order) => order.userId);

        let users = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .find({ _id: { $in: userIds } })
          .toArray();

        let ordersWithUserDetails = orders.map((order) => {
          let user = users.find((user) => user._id.equals(order.userId));

          return {
            ...order,
            userName: user ? user.name : "Unknown",
          };
        });

        resolve(ordersWithUserDetails);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrdersByDateRange: (fromDate, toDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        fromDateObj.setHours(0, 0, 0, 0);
        toDateObj.setHours(23, 59, 59, 999);
        console.log("fromDateObj", fromDateObj);
        console.log("toDateObj", toDateObj);

        const orders = await db
          .getDatabase()
          .collection(collection.ORDER_COLLECTION)
          .find({
            date: {
              $gte: fromDateObj,
              $lte: toDateObj,
            },
          })
          .toArray();
        console.log("orders with date: ", orders);

        const userIds = orders.map((order) => order.userId);

        const users = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .find({ _id: { $in: userIds } })
          .toArray();

        const ordersWithUserDetails = orders.map((order) => {
          const user = users.find((user) => user._id.equals(order.userId));

          return {
            ...order,
            userName: user ? user.name : "Unknown",
          };
        });

        resolve(ordersWithUserDetails);
      } catch (error) {
        reject(error);
      }
    });
  },
  cancelRequest: (orderIds, message) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: new objectId(orderIds) })
        .then((order) => {
          if (!order) {
            reject(new Error("Order not found"));
            return;
          }

          const { totalAmount, userId ,orderId} = order;
          console.log("total amount of cancelled order is: ", totalAmount);
          db.getDatabase()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: new objectId(orderIds) },
              { $set: { status: "Cancelled", cancelReason: message } }
            )
            .then((orderUpdateResponse) => {
              db.getDatabase()
                .collection(collection.WALLET_COLLECTION)
                .findOne({
                  userId: new objectId(userId),
                  "cancelledOrders.orderId": new objectId(orderIds),
                })
                .then((existingWalletOrder) => {
                  if (!existingWalletOrder) {
                    db.getDatabase()
                      .collection(collection.WALLET_COLLECTION)
                      .updateOne(
                        { userId: new objectId(userId) },
                        {
                          $inc: { totalAmountWallet: totalAmount },
                          $push: {
                            cancelledOrders: {
                              orderId: new objectId(orderIds),
                              order:orderId,
                              totalAmount,
                            },
                          },
                        },
                        { upsert: true }
                      )
                      .then((walletUpdateResponse) => {
                        resolve({
                          orderUpdateResponse,
                          walletUpdateResponse,
                        });
                      })
                      .catch((walletUpdateError) => {
                        reject(walletUpdateError);
                      });
                  } else {
                    resolve();
                  }
                })
                .catch((existingWalletOrderError) => {
                  reject(existingWalletOrderError);
                });
            })
            .catch((orderUpdateError) => {
              reject(orderUpdateError);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  cancelOrder: (orderIds, message) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: new objectId(orderIds) })
        .then((order) => {
          if (!order) {
            reject(new Error("Order not found"));
            return;
          }
         console.log("order: ",order);
          const { totalAmount, userId,orderId } = order;
          console.log("odrer id is: ",orderId);
          console.log("total amount of cancelled order is: ", totalAmount);
          db.getDatabase()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: new objectId(orderIds) },
              { $set: { status: "Cancelled", adminCancelReason: message } }
            )
            .then((orderUpdateResponse) => {
              db.getDatabase()
                .collection(collection.WALLET_COLLECTION)
                .findOne({
                  userId: new objectId(userId),
                  "cancelledOrders.orderId": new objectId(orderIds),
                })
                .then((existingWalletOrder) => {
                  if (!existingWalletOrder) {
                    db.getDatabase()
                      .collection(collection.WALLET_COLLECTION)
                      .updateOne(
                        { userId: new objectId(userId) },
                        {
                          $inc: { totalAmountWallet: totalAmount },
                          $push: {
                            cancelledOrders: {
                              orderId: new objectId(orderId),
                              totalAmount,
                            },
                          },
                        },
                        { upsert: true }
                      )
                      .then((walletUpdateResponse) => {
                        resolve({
                          orderUpdateResponse,
                          walletUpdateResponse,
                        });
                      })
                      .catch((walletUpdateError) => {
                        reject(walletUpdateError);
                      });
                  } else {
                    resolve();
                  }
                })
                .catch((existingWalletOrderError) => {
                  reject(existingWalletOrderError);
                });
            })
            .catch((orderUpdateError) => {
              reject(orderUpdateError);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  returnRequest: (orderId, message) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          {
            $set: {
              returnReason: message,
              status: "Return Request Placed",
            },
          }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  returnOrder: (orderId, message) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          { $set: { status: message } }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  deliveredOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          { $set: { status: "Delivered" } }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  shippedOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          { $set: { status: "Shipped" } }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
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
          .findOne({ email: email });

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
  },
  deleteImage: (proId, imageName) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: new objectId(proId) },
          { $pull: { images: imageName } }
        )
        .then((response) => {
          if (response.modifiedCount > 0) {
            console.log("Image deleted successfully");
            resolve();
          } else {
            console.log("No documents updated");
            resolve("No documents updated");
          }
        })
        .catch((error) => {
          console.error("Error deleting image:", error);
          reject(error);
        });
    });
  },
};
