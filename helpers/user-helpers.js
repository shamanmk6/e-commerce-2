const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const User = require("../model/userModel");
const Category = require("../model/categoryModel");
const Coupon = require("../model/couponModel");
const UserOTPVerification = require("../model/userOTPVerificationModel");
const nodeMailer = require("nodemailer");
const { response } = require("../app");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;
var instance = new Razorpay({
  key_id: "rzp_test_pwhvE482E5y8F4",
  key_secret: "yEURCf7rlGOsDvHhLOE6uFqm",
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const { name, email, password, confirmPwd } = userData;
      const existingUser = await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: email });
      if (existingUser) {
        resolve({
          status: "error",
          message: "User with this email already exists",
        });
      } else {
        if (password == confirmPwd) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: 0,
          });

          db.getDatabase()
            .collection(collection.USER_COLLECTION)
            .insertOne(newUser)
            .then((data) => {
              const user = {
                name: newUser.name,
                email: newUser.email,
                Id: data.insertedId,
              };
              resolve(user);
            });
        } else {
          resolve({ status: "error", message: "Password Not Matching" });
        }
      }

      // sendVerifyMail(req.body.name,req.body.email,data.insertedId);
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
      let users = await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
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
        // Check if category is empty or whitespace
        if (!categoryData.category.trim()) {
          resolve({
            success: false,
            message: "Category cannot be empty or contain only whitespace.",
          });
          return;
        }

        // Check if category is unique (case-insensitive)
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

        // If validations pass, proceed with insertion
        const newCategory = new Category({
          title: categoryData.title,
          category: categoryData.category,
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
            // Check if the document was updated successfully
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
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
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
      throw error; // Rethrow the error for handling in the calling code
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
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
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
            $project: {
              item: "$products.item",
              quantity: { $toInt: "$products.quantity" },
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
          {
            $project: {
              quantity: 1,
              "product.price": { $toDouble: "$product.price" }, // Convert to double
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])

        .toArray();
      if (total.length > 0 && total[0].total !== undefined) {
        console.log("total is:", total[0].total);
        await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: new objectId(userId) },
            { $set: { totalAmount: total[0].total } }
          );
        resolve(total[0].total);
      } else {
        console.log("Total not found or undefined");
        await db
          .getDatabase()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { user: new objectId(userId) },
            { $set: { totalAmount: 0 } }
          );
        resolve("Cart is Empty");
      }
    });
  },
  totalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cart = await db
        .getDatabase()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });
      if (cart && cart.totalAmount !== undefined) {
        console.log("Cart amount is: ", cart.totalAmount);
        resolve(cart.totalAmount);
      } else {
        resolve(0);
      }
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order.payment === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: new objectId(order.userId),
        paymentMethod: order.payment,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };
      db.getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          const orderId = new ObjectId(response.insertedId);
          db.getDatabase()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: new objectId(order.userId) });
          resolve(orderId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .getDatabase()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: new objectId(userId) });
      if (cart && cart.products) {
        resolve(cart.products);
      } else {
        resolve([]);
      }
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db
        .getDatabase()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: new objectId(userId) })
        .toArray();
      console.log(orders);
      resolve(orders);
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
                totalAmount: "$totalAmount",
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])
          .toArray();

        if (orderItems.length > 0) {
          let totalAmount = orderItems[0].totalAmount;

          let products = orderItems.map((item) => ({
            item: item.item,
            quantity: item.quantity,
            product: item.product,
          }));

          resolve({ products, totalAmount });
        } else {
          resolve({ products: [], totalAmount: 0 });
        }
      } catch (error) {
        console.error("Error in aggregation pipeline:", error);
        reject(error);
      }
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
        });
    });
  },
  changeProfile: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      await db
        .getDatabase()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: new objectId(userId) },
          {
            $set: {
              name: userDetails.name,
              email: userDetails.email,
              address: userDetails.address,
              mobile: userDetails.mobile,
              pincode: userDetails.pincode,
            },
          }
        );
    }).then((response) => {
      resolve(response);
    });
  },
  otpStore: (userId, otp) => {
    return new Promise(async (resolve, reject) => {
      const newotp = new UserOTPVerification({
        userId: userId,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      await db
        .getDatabase()
        .collection(collection.OTP_CollECTION)
        .insertOne(newotp)
        .then((response) => {
          resolve();
        });
    });
  },
  otpVerify: (otp, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Log the input parameters for debugging
        console.log("userId:", userId);
        console.log("otp:", otp);

        // Attempt to find the user in the database
        let user = await db
          .getDatabase()
          .collection(collection.OTP_CollECTION)
          .findOne({ userId: userId });

        // Log the user for debugging
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
          resolve(false);
        }
      } catch (error) {
        console.error("Error in otpVerify:", error);
        reject(error);
      }
    });
  },
  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("payment is: ", order);
        resolve(order);
      });
    });
  },
  verifyPayment: (paymentDetails) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");

      let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET);

      // Use the correct property names without quotes and square brackets
      hmac.update(
        paymentDetails["payment[razorpay_order_id]"] +
          "|" +
          paymentDetails["payment[razorpay_payment_id]"]
      );

      let calculatedSignature = hmac.digest("hex");

      // Compare calculatedSignature with the provided signature
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

        // If validations pass, proceed with insertion
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

        await db
          .getDatabase()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: new objectId(userId) },
            { $addToSet: { appliedCoupons: coupon } }
          );

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
          { $set: { totalAmount: newTotal } }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getCoupon: (couponId) => {
    return new Promise((resolve, reject) => {

      db.getDatabase().collection(collection.COUPON_COLLECTION).findOne({_id:new objectId(couponId)}).then((coupon)=>{
          resolve(coupon);
      })
    });
  },
  updateCoupon: (details, couponId) => {
    return new Promise((resolve, reject) => {
      db.getDatabase()
        .collection(collection.COUPON_COLLECTION)
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
        });
    });
  },
};
