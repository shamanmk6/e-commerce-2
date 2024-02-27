const db = require("../config/connection");
const collection = require("../config/collections");
const {v4 : uuidv4} = require('uuid')
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const User = require("../model/userModel");
const Category = require("../model/categoryModel");
const Coupon = require("../model/couponModel");
const Order = require("../model/orderModel");
const UserOTPVerification = require("../model/userOTPVerificationModel");
const nodeMailer = require("nodemailer");
const { response } = require("../app");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { error } = require("console");
const { rejects } = require("assert");
// const { applyCoupon } = require("../controllers/couponController");
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;
var instance = new Razorpay({
  key_id: "rzp_test_pwhvE482E5y8F4",
  key_secret: "yEURCf7rlGOsDvHhLOE6uFqm",
});
const generateReferralCode = () => {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let referralCode = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
};
function isOfferValid(startDate, endDate) {
  let currentDate = new Date();
  return currentDate >= startDate && currentDate <= endDate;
}

function calculateDiscountedPrice(price, offer) {
  console.log("price:", price);
  let discountPrice = price - price * (offer / 100);
  console.log("discount price: ", discountPrice);
  return discountPrice;
}
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { name, email, password, confirmPwd, referal } = userData;
        console.log("referral: ", referal);

        let existingUser = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .findOne({ email: email });

        if (existingUser) {
          resolve({
            status: "error",
            message: "User with this email already exists",
          });
          return; 
        }

        if (password !== confirmPwd) {
          resolve({ status: "error", message: "Password Not Matching" });
          return; 
        }

        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          isVerified: 0,
          referalCode: generateReferralCode(),
          addresses:"",
        });
        const insertedUserData = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .insertOne(newUser);
        const userId = insertedUserData.insertedId;

        
        await db
          .getDatabase()
          .collection(collection.WALLET_COLLECTION)
          .insertOne({
            userId: userId,
            cancelledOrders: [],
            referalAmount: referal ? 200 : 0,
            totalAmountWallet: referal ? 200 : 0,
          });

        const user = {
          name: newUser.name,
          email: newUser.email,
          Id: userId,
          referal: newUser.referalCode,
        };

        resolve(user);
      } catch (error) {
        console.error("Error in doSignup:", error);
        reject(error);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });

      try {
        if (user && user.isVerified && !user.isBlocked) {
          const status = await bcrypt.compare(userData.password, user.password);
          if (status) {
            console.log("Login-success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        } else {
          console.log("User is not verified or is blocked");
          resolve({
            status: false,
            message: "User is not verified or is blocked",
          });
        }
      } catch (error) {
        console.error("Error during login:", error);
        resolve({ status: false, message: "An error occurred during login" });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .find()
          .toArray();
        resolve(users);
      } catch (error) {
        reject(error);
      }
    });
  },
  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      console.log(userId);
      console.log(new objectId(userId));
      db.getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: new objectId(userId) }, { $set: { isBlocked: true } })
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  unBlockUser: (userId) => {
    return new Promise((resolve, reject) => {
      console.log(userId);
      console.log(new objectId(userId));
      db.getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          { $set: { isBlocked: false } }
        )
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  verifyEmail: (userId) => {
    return new Promise((resolve, reject) => {
      console.log(userId);
      db.getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          { $set: { isVerified: true } }
        )
        .then((response) => {
          console.log(response);
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  productDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: new objectId(proId) })
        .then((product) => {
          resolve(product);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let categories = await db
          .getDatabase()
          .collection(collection.CATEGORY_COLLECTION)
          .find()
          .toArray();
        resolve(categories);
      } catch (error) {
        reject(error);
      }
    });
  },
  categoryAdding: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!categoryData.category.trim()) {
          resolve({
            success: false,
            message: "Category cannot be empty or contain only whitespace.",
          });
          return;
        }

        const existingCategory = await db
          .getDatabase()
          .collection(collection.CATEGORY_COLLECTION)
          .findOne({
            category: { $regex: new RegExp(`^${categoryData.category}$`, "i") },
          });

        if (existingCategory) {
          resolve({ success: false, message: "Category must be unique." });
          return;
        }

        const newCategory = new Category({
          category: categoryData.category,
          offer: categoryData.offer,
          offerStart: categoryData.offerStart,
          offerEnd: categoryData.offerEnd,
        });

        let data = await db
          .getDatabase()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(newCategory);

        resolve({ success: true, message: "Category added successfully." });
      } catch (error) {
        reject(error);
      }
    });
  },
  resetPassword: (data) => {
    let mail = data.email;
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: mail })
        .then((user) => {
          // Check if a user with the specified email was found
          if (user) {
            resolve(user);
          } else {
            reject(new Error("User not found"));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  changePassword: (user) => {
    return new Promise(async (resolve, reject) => {
      const { userId, password, confirmPwd } = user;
      if (password === confirmPwd) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("User ID to update:", userId);

        db.getDatabase()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: new objectId(userId) },
            { $set: { password: hashedPassword } }
          )
          .then((data) => {
            if (data.modifiedCount > 0) {
              resolve("Password Changed Successfully");
            } else {
              reject(new Error("Failed to update password"));
            }
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve("Password Not Matching");
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: new objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try {
        let userCart = await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: new objectId(userId) });
        if (userCart) {
          let proExist = userCart.products.findIndex(
            (product) => product.item.toString() === proId
          );

          console.log(proExist);
          if (proExist != -1) {
            db.getDatabase()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                {
                  user: new objectId(userId),
                  "products.item": new objectId(proId),
                },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              )
              .then(() => {
                resolve();
              });
          } else {
            db.getDatabase()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: new objectId(userId) },
                {
                  $push: { products: proObj },
                }
              )
              .then((response) => {
                resolve();
              });
          }
        } else {
          let cartObj = {
            user: new objectId(userId),
            products: [proObj],
          };

          db.getDatabase()
            .collection(collection.CART_COLLECTION)
            .insertOne(cartObj)
            .then((response) => {
              resolve();
            });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: new objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])

          .toArray();

        resolve(cartItems);
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartCount: async (userId) => {
    try {
      let count = 0;
      let cart = await db
        .getDatabase()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });

      if (cart) {
        count = cart.products.length;
      }

      return count;
    } catch (error) {
      console.error("Error in getCartCount:", error);
      throw error;
    }
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count === -1 && details.quantity === 1) {
        console.log("Removing product with ID:", details.product);
        db.getDatabase()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: new objectId(details.cart) },
            {
              $pull: { products: { item: new ObjectId(details.product) } },
            }
          )
          .then((response) => {
            console.log("Remove response:", response);
            resolve({ removedProduct: true });
          })
          .catch((error) => {
            console.error("Error removing product:", error);
            reject(error);
          });
      } else {
        db.getDatabase()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: new objectId(details.cart),
              "products.item": new objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          })
          .catch((error) => {
            console.error("Error updating product quantity:", error);
            reject(error);
          });
      }
    });
  },
  deleteCartItem: (details) => {
    let cartId = details.cart;
    let proId = details.product;
    let userId = details.user;
    return new Promise(async (resolve, reject) => {
      db.getDatabase()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new objectId(cartId) },
          {
            $pull: { products: { item: new ObjectId(proId) } },
          }
        )
        .then((response) => {
          console.log("Remove response:", response);
          resolve({ removedProduct: true });
        })
        .catch((error) => {
          console.error("Error removing product:", error);
          reject(error);
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: new objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "products.item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $lookup: {
                from: collection.CATEGORY_COLLECTION,
                localField: "product.category",
                foreignField: "category",
                as: "category",
              },
            },
            {
              $addFields: {
                quantity: "$products.quantity",
                product: { $arrayElemAt: ["$product", 0] },
                category: { $arrayElemAt: ["$category", 0] },
              },
            },
            {
              $addFields: {
                "product.price": { $toDouble: "$product.price" },
                "product.offer": { $toInt: "$product.offer" },
                "product.offerStart": {
                  $cond: {
                    if: { $ne: ["$product.offerStart", ""] },
                    then: { $toDate: "$product.offerStart" },
                    else: null,
                  },
                },
                "product.offerEnd": {
                  $cond: {
                    if: { $ne: ["$product.offerEnd", ""] },
                    then: { $toDate: "$product.offerEnd" },
                    else: null,
                  },
                },
                "category.offer": { $toInt: "$category.offer" },
                "category.offerStart": {
                  $cond: {
                    if: { $ne: ["$category.offerStart", ""] },
                    then: { $toDate: "$category.offerStart" },
                    else: null,
                  },
                },
                "category.offerEnd": {
                  $cond: {
                    if: { $ne: ["$category.offerEnd", ""] },
                    then: { $toDate: "$category.offerEnd" },
                    else: null,
                  },
                },
              },
            },
            {
              $addFields: {
                discountedPrice: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$product.offer", 0] },
                        { $gte: [new Date(), "$product.offerStart"] },
                        { $lte: [new Date(), "$product.offerEnd"] },
                      ],
                    },
                    then: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$category.offer", 0] },
                            { $gte: [new Date(), "$category.offerStart"] },
                            { $lte: [new Date(), "$category.offerEnd"] },
                            { $gt: ["$category.offer", "$product.offer"] },
                          ],
                        },
                        then: {
                          $multiply: [
                            "$quantity",
                            {
                              $subtract: [
                                1,
                                { $divide: ["$category.offer", 100] },
                              ],
                            },
                            "$product.price",
                          ],
                        },
                        else: {
                          $multiply: [
                            "$quantity",
                            {
                              $subtract: [
                                1,
                                { $divide: ["$product.offer", 100] },
                              ],
                            },
                            "$product.price",
                          ],
                        },
                      },
                    },
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$category.offer", 0] },
                            { $gte: [new Date(), "$category.offerStart"] },
                            { $lte: [new Date(), "$category.offerEnd"] },
                          ],
                        },
                        then: {
                          $multiply: [
                            "$quantity",
                            {
                              $subtract: [
                                1,
                                { $divide: ["$category.offer", 100] },
                              ],
                            },
                            "$product.price",
                          ],
                        },
                        else: {
                          $multiply: ["$quantity", "$product.price"],
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$discountedPrice" },
              },
            },
          ])
          .toArray();

        if (total.length > 0 && total[0].total !== undefined) {
          resolve(total[0].total);
        } else {
          resolve(0);
        }
      } catch (error) {
        console.error("Error in getTotalAmount:", error);
        reject(error);
      }
    });
  },

  // totalAmount: (userId) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const cart = await db
  //         .getDatabase()
  //         .collection(collection.CART_COLLECTION)
  //         .findOne({ user: new objectId(userId) });
  //       if (cart && cart.totalAmount !== undefined) {
  //         console.log("Cart amount is: ", cart.totalAmount);
  //         resolve(cart.totalAmount);
  //       } else {
  //         resolve(0);
  //       }
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // },
  // placeOrder: (order, products, total) => {
  //   return new Promise((resolve, reject) => {
  //     let status = order.payment === "COD" ? "placed" : "pending";
  //     let orderObj = {
  //       deliveryDetails: {
  //         name: order.name,
  //         mobile: order.mobile,
  //         address: order.address,
  //         pincode: order.pincode,
  //       },
  //       userId: new objectId(order.userId),
  //       paymentMethod: order.payment,
  //       products: products,
  //       totalAmount: total,
  //       status: status,
  //       date: new Date(),
  //     };
  //     db.getDatabase()
  //       .collection(collection.ORDER_COLLECTION)
  //       .insertOne(orderObj)
  //       .then((response) => {
  //         const orderId = new ObjectId(response.insertedId);
  //         db.getDatabase()
  //           .collection(collection.CART_COLLECTION)
  //           .deleteOne({ user: new objectId(order.userId) });
  //         resolve(orderId);
  //       });
  //   });
  // },
  placeOrder: (order, products, total, couponCode, user) => {
    return new Promise(async (resolve, reject) => {
      try {
        let status = order.payment === "COD" ? "placed" : "pending";
        let orderProducts = [];

        for (let item of products) {
          console.log("item: ", item);
          let product = await db
            .getDatabase()
            .collection(collection.PRODUCT_COLLECTION)
            .findOne({ _id: new ObjectId(item.item) });
          console.log("product:", product);
          let category = product.category;

          let categoryData = await db
            .getDatabase()
            .collection(collection.CATEGORY_COLLECTION)
            .findOne({ category: category });
          let categoryOffer = categoryData.offer;
          let categoryOfferStart = categoryData.offerStart;
          let categoryOfferEnd = categoryData.offerEnd;
          let productOffer = product.offer;
          let productOfferStart = product.offerStart;
          let productOfferEnd = product.offerEnd;
          console.log("category Offer: ", categoryOffer);
          console.log("category Offer: ", productOffer);

          let validCategoryOffer =
            categoryOffer &&
            isOfferValid(
              new Date(categoryOfferStart),
              new Date(categoryOfferEnd)
            );
          let validProductOffer =
            productOffer &&
            isOfferValid(
              new Date(productOfferStart),
              new Date(productOfferEnd)
            );

          if (validCategoryOffer && validProductOffer) {
            let applicableOffer =
              categoryOffer.offer > productOffer.offer
                ? categoryOffer
                : productOffer;
            console.log("aplicable: ", applicableOffer);

            let discountedPrice = calculateDiscountedPrice(
              product.price,
              applicableOffer
            );
            console.log("discoun ptice: ", discountedPrice);
            item.price = discountedPrice;
          } else if (validCategoryOffer) {
            item.price = calculateDiscountedPrice(product.price, categoryOffer);
          } else if (validProductOffer) {
            item.price = calculateDiscountedPrice(product.price, productOffer);
          } else {
            item.price = product.price;
          }

          orderProducts.push({
            item: product._id,
            quantity: item.quantity,
            price: item.price,
          });
        }
        const newId = uuidv4()
        console.log("newId is: ",newId);
        let orderObj = new Order({
          orderId:newId,
          userId: order.userId,
          paymentMethod: order.payment,
          products: orderProducts,
          deliveryDetails: {
            name: order.name,
            mobile: order.mobile,
            address: order.address,
            pincode: order.pincode,
          },
          status: status,
          appliedCoupon:couponCode,
          date: new Date(),
          totalAmount: total,
        });

        await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: new objectId(user._id) },
            { $addToSet: { appliedCoupons: couponCode } }
          );
        await db
          .getDatabase()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(orderObj)
          .then((response) => {
            const orderId = new ObjectId(response.insertedId);
            db.getDatabase()
              .collection(collection.CART_COLLECTION)
              .deleteOne({ user: new objectId(order.userId) });
            resolve(orderId);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cart = await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: new objectId(userId) });
        if (cart && cart.products) {
          resolve(cart.products);
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(userId);
        let orders = await db
          .getDatabase()
          .collection(collection.ORDER_COLLECTION)
          .find({ userId: new objectId(userId) })
          .toArray();
        console.log(orders);
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrderedProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderItems = await db
          .getDatabase()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: { _id: new objectId(orderId) },
            },
            {
              $unwind: "$products",
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "products.item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
                price: "$products.price",
                totalAmount: "$totalAmount",
                status: "$status",
                returnReason: "$returnReason",
                adminCancelReason: "$adminCancelReason",
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])
          .toArray();

        if (orderItems.length > 0) {
          let totalAmount = orderItems[0].totalAmount;
          let status = orderItems[0].status;
          let returnReason = orderItems[0].returnReason;
          let adminCancelReason = orderItems[0].adminCancelReason;
          let products = orderItems.map((item) => ({
            item: item.item,
            quantity: item.quantity,
            product: item.product,
            price: item.price,
          }));

          resolve({
            products,
            totalAmount,
            status,
            returnReason,
            adminCancelReason,
          });
        } else {
          resolve({ products: [], totalAmount: 0, status: "" });
        }
      } catch (error) {
        console.error("Error in aggregation pipeline:", error);
        reject(error);
      }
    });
  },
  getOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: new objectId(orderId) })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getUserDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: new objectId(userId) })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  updateProfile: async (userId, userDetails) => {
    try {
      const addresses = Object.keys(userDetails)
        .filter((key) => key.startsWith("address"))
        .map((key) => userDetails[key]);

      const updatedDetails = Object.keys(userDetails)
        .filter((key) => !key.startsWith("address") && key !== "newAddress")
        .reduce((acc, key) => {
          acc[key] = userDetails[key];
          return acc;
        }, {});

      await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          {
            $set: updatedDetails,
          }
        );

      if (userDetails.newAddress) {
        addresses.push(userDetails.newAddress);
      }

      await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          {
            $set: { addresses },
          }
        );

      return "Profile updated successfully";
    } catch (error) {
      throw error;
    }
  },
  otpStore: (userId, otp) => {
    return new Promise(async (resolve, reject) => {
      try {
        const currentTime = new Date();
        const expirationTime = new Date(currentTime.getTime() + 36000);
        console.log("Created At:", currentTime.toLocaleString());
        console.log("Expires At:", expirationTime.toLocaleString());
        const newotp = new UserOTPVerification({
          userId: userId,
          otp: otp,
          createdAt: currentTime,
          expiresAt: expirationTime,
        });
        await db
          .getDatabase()
          .collection(collection.OTP_CollECTION)
          .insertOne(newotp)
          .then((response) => {
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  },
  otpVerify: (otp, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("userId:", userId);
        console.log("otp:", otp);

        let user = await db
          .getDatabase()
          .collection(collection.OTP_CollECTION)
          .findOne({ userId: userId });

        console.log("User from the database:", user);

        if (user) {
          const status = await bcrypt.compare(otp, user.otp);
          if (status) {
            console.log("OTP is correct");
            await db
              .getDatabase()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: new ObjectId(userId) },
                { $set: { isVerified: true } }
              );
            await db
              .getDatabase()
              .collection(collection.OTP_CollECTION)
              .deleteOne({ userId: userId });
            console.log("OTP record deleted from the database");
            console.log("isVerified field updated to true");
            resolve({ status: true, message: "Verification successful" });
          } else {
            console.log("Incorrect OTP");
            resolve({ status: false, message: "Incorrect OTP" });
          }
        } else {
          console.log("User not found");
          resolve({ status: false, message: "User not found" });
        }
      } catch (error) {
        console.error("Error in otpVerify:", error);
        reject(error);
      }
    });
  },
  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      try {
        console.log("razorpay payment: ", orderId, totalPrice);
        const amountInPaisa = Math.round(totalPrice * 100);
        var options = {
          amount: amountInPaisa,
          currency: "INR",
          receipt: "" + orderId,
        };
        console.log("options is: ", options);
        instance.orders.create(options, function (err, order) {
          if (err) {
            console.error("Error creating Razorpay order:", err);
            reject(err);
          } else {
            console.log("payment is: ", order);
            resolve(order);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  verifyPayment: (paymentDetails) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");

      let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET);

      hmac.update(
        paymentDetails["payment[razorpay_order_id]"] +
          "|" +
          paymentDetails["payment[razorpay_payment_id]"]
      );

      let calculatedSignature = hmac.digest("hex");

      if (
        calculatedSignature === paymentDetails["payment[razorpay_signature]"]
      ) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: new objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getCoupons: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let coupons = await db
          .getDatabase()
          .collection(collection.COUPON_COLLECTION)
          .find()
          .toArray();
        resolve(coupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  couponAdding: (couponData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const existingCoupon = await db
          .getDatabase()
          .collection(collection.COUPON_COLLECTION)
          .findOne({
            name: { $regex: new RegExp(`^${couponData.name}$`, "i") },
          });

        if (existingCoupon) {
          resolve({ success: false, message: "Coupon must be unique." });
          return;
        }
        const newCoupon = new Coupon({
          name: couponData.name,
          expiry: couponData.expiry,
          discount: couponData.discount,
        });

        let data = await db
          .getDatabase()
          .collection(collection.COUPON_COLLECTION)
          .insertOne(newCoupon);

        resolve({ success: true, message: "Coupon added successfully." });
      } catch (error) {
        reject(error);
      }
    });
  },
  validCoupon: (coupon, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const couponDocument = await db
          .getDatabase()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ name: coupon });

        if (!couponDocument) {
          resolve({ valid: false, message: "Invalid Coupon" });
          return;
        }

        const user = await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .findOne({
            _id: new objectId(userId),
            appliedCoupons: { $regex: new RegExp(coupon, "i") },
          });

        if (user && user.appliedCoupons) {
          resolve({ valid: false, message: "Coupon already used" });
          return;
        }

        const currentDate = new Date();
        console.log("current date is: ", currentDate);
        if (couponDocument.expiry && couponDocument.expiry < currentDate) {
          resolve({ valid: false, message: "Coupon expired" });
          return;
        }
        resolve({ valid: true, couponDocument });
      } catch (error) {
        reject(error);
      }
    });
  },
  updateCartTotal: (userId, newTotal) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: new objectId(userId) },
          { $set: { totalAmount: parseFloat(newTotal.toFixed(2)) } }
        )
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getCoupon: (couponId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: new objectId(couponId) })
        .then((coupon) => {
          resolve(coupon);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  updateCoupon: (details, couponId) => {
    return new Promise((resolve, reject) => {
      const couponCollection = db
        .getDatabase()
        .collection(collection.COUPON_COLLECTION);

      couponCollection
        .findOne({ _id: new objectId(couponId) })
        .then((existingCoupon) => {
          if (!existingCoupon) {
            reject("Coupon not found");
            return;
          }

          if (existingCoupon.name !== details.name) {
            couponCollection
              .findOne({
                name: details.name,
                _id: { $ne: new objectId(couponId) },
              })
              .then((duplicateCoupon) => {
                if (duplicateCoupon) {
                  reject("Coupon with the same name already exists");
                } else {
                  couponCollection
                    .updateOne(
                      { _id: new objectId(couponId) },
                      {
                        $set: {
                          name: details.name,
                          expiry: details.expiry,
                          discount: details.discount,
                        },
                      }
                    )
                    .then(() => {
                      resolve();
                    })
                    .catch((error) => {
                      reject(error);
                    });
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            couponCollection
              .updateOne(
                { _id: new objectId(couponId) },
                {
                  $set: {
                    expiry: details.expiry,
                    discount: details.discount,
                  },
                }
              )
              .then(() => {
                resolve();
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
  getWallet: (userId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.WALLET_COLLECTION)
        .findOne({ userId: new objectId(userId) })
        .then((wallet) => {
          resolve(wallet);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getCategoryDetails: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: new objectId(categoryId) })
        .then((category) => {
          resolve(category);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  updateCategory: (categoryDetails, categoryId) => {
    return new Promise((resolve, reject) => {
      const categoryCollection = db
        .getDatabase()
        .collection(collection.CATEGORY_COLLECTION);

      categoryCollection
        .findOne({ _id: new objectId(categoryId) })
        .then((existingCategory) => {
          if (!existingCategory) {
            resolve("Category not found");
            return;
          }

          if (existingCategory.category !== categoryDetails.category) {
            categoryCollection
              .findOne({
                category: categoryDetails.category,
                _id: { $ne: new objectId(categoryId) },
              })
              .then((duplicateCategory) => {
                if (duplicateCategory) {
                  resolve("Category name already exists");
                } else {
                  categoryCollection
                    .updateOne(
                      { _id: new objectId(categoryId) },
                      {
                        $set: {
                          category: categoryDetails.category,
                          offer: categoryDetails.offer,
                          offerStart: categoryDetails.offerStart,
                          offerEnd: categoryDetails.offerEnd,
                        },
                      }
                    )
                    .then(() => {
                      resolve();
                    })
                    .catch((error) => {
                      reject(error);
                    });
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            categoryCollection
              .updateOne(
                { _id: new objectId(categoryId) },
                {
                  $set: {
                    offer: categoryDetails.offer,
                    offerStart: categoryDetails.offerStart,
                    offerEnd: categoryDetails.offerEnd,
                  },
                }
              )
              .then(() => {
                resolve();
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
};
