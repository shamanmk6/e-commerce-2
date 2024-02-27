const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const path = require("path");
const fs = require("fs");

const moment = require("moment");
const excelJs = require("exceljs");
const ObjectsToCsv = require("objects-to-csv");
const getUsers = async (req, res, next) => {
  try {
    const admin = req.session.admin;
    console.log("admin is: ", admin);
    const users = await userHelpers.getAllUsers();
    res.render("admin/view-users", { admin, users });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};


const blockOrUnblockUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const action = req.params.action; 

    if (action === 'block') {
      await userHelpers.blockUser(userId);
    } else if (action === 'unblock') {
      await userHelpers.unBlockUser(userId);
    } else {
      throw new Error('Invalid action');
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to perform action." });
  }
};
const adminLogin = (req, res) => {
  try {
    res.render("admin/admin-login", { admin: true });
  } catch (error) {
    console.error("Error rendering admin login:", error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyAdminLogin = (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("admin details is: " + email + password);
    productHelpers.doAdminLogin(email, password).then((response) => {
      if (response.status) {
        req.session.admin = true;
        const admin = req.session.admin;
        res.redirect("/admin/view-products?admin=" + admin);
      } else {
        req.session.loginErr =
          response.message || "Invalid Username or password";
        res.redirect("/admin");
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const adminLogout = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getSales = async (req, res) => {
  try {
    const admin = req.session.admin;
    let categories = await userHelpers.getCategory();
    let orders = await productHelpers.getAllOrders();
    let ordersCount = orders.length;
    let codCount = 0;
    let onlineCount = 0;

    orders.forEach((order) => {
      if (order.paymentMethod === "COD") {
        codCount++;
      } else if (order.paymentMethod === "ONLINE") {
        onlineCount++;
      }
    });
    console.log("onlineCoun:", onlineCount);
    const onlinePercentage = ((onlineCount / ordersCount) * 100).toFixed(2);
    const codPercentage = ((codCount / ordersCount) * 100).toFixed(2);

    let totalSale = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    totalSale = totalSale.toFixed(2);
    let users = await userHelpers.getAllUsers();
    let userCount = users.length;
    console.log("ordersCOunt: ", ordersCount);
    console.log("hello");

    let productIds = orders.flatMap((order) =>
      order.products.map((product) => product.item)
    );
    let productDetails = await Promise.all(
      productIds.map((productId) => userHelpers.productDetails(productId))
    );

    
    let categoryQuantities = {};
    for (let i = 0; i < orders.length; i++) {
      let order = orders[i];
      let products = order.products;
      for (let j = 0; j < products.length; j++) {
        let product = products[j];
        let productDetail = productDetails.find((detail) =>
          detail._id.equals(product.item)
        );

        if (productDetail && productDetail.category) {
          const category = productDetail.category;
          const quantity = parseInt(product.quantity);

          if (!isNaN(quantity)) {
            if (category in categoryQuantities) {
              categoryQuantities[category] += quantity;
            } else {
              categoryQuantities[category] = quantity;
            }
          }
        }
      }
    }

    let chartData = {
      labels: Object.keys(categoryQuantities),
      datasets: [
        {
          label: "Products Sales for Each Category",
          data: Object.values(categoryQuantities),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
    const selectedYear = req.query.year || new Date().getFullYear();
    console.log("year: ", selectedYear);
    let monthlyOrders = {};
    let weeklyOrders = {};
    orders.forEach((order) => {
      const month = moment(order.date).format("MMMM");
      const week = moment(order.date).format("YYYY-[W]WW");

      
      if (!monthlyOrders[month]) {
        monthlyOrders[month] = 0;
      }
      monthlyOrders[month] += 1; 

      
      if (!weeklyOrders[week]) {
        weeklyOrders[week] = 0;
      }
      weeklyOrders[week] += 1; 
    });

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyData = months.map((month) => monthlyOrders[month] || 0);

    let yearlyOrders = {};
    orders.forEach((order) => {
      const year = moment(order.date).format("YYYY");
      if (!yearlyOrders[year]) {
        yearlyOrders[year] = {};
      }

      const month = moment(order.date).format("MMMM");
      if (!yearlyOrders[year][month]) {
        yearlyOrders[year][month] = 0;
      }
      yearlyOrders[year][month] += 1;
    });
    let yearlyChartData = {};
    for (const year in yearlyOrders) {
      const monthlyData = months.map((month) => yearlyOrders[year][month] || 0);
      yearlyChartData[year] = {
        labels: months,
        datasets: [
          {
            label: "Orders",
            data: monthlyData,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    console.log("yearlyChartData:", yearlyChartData);

    console.log("monthly Data: ", monthlyData);
    let chartDataMonthly = {
      labels: months,
      datasets: [
        {
          label: "Orders",
          data: monthlyData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    const weeklyLabels = Object.keys(weeklyOrders);
    const weeklyData = weeklyLabels.map((week) => weeklyOrders[week] || 0); 

    let chartDataWeekly = {
      labels: weeklyLabels,
      datasets: [
        {
          label: "Quantity",
          data: weeklyData,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
    const yearlyTotalAmount = {};

   
    for (const year in yearlyOrders) {
      yearlyTotalAmount[year] = {};
      months.forEach((month) => {
        yearlyTotalAmount[year][month] = 0;
      });
    }

   
    orders.forEach((order) => {
      const year = moment(order.date).format("YYYY");
      const month = moment(order.date).format("MMMM");
      yearlyTotalAmount[year][month] += order.totalAmount;
    });

    console.log("yearly total amount: ", yearlyTotalAmount);

    
    const chartDataYearlyTotalAmount = {};
    for (const year in yearlyOrders) {
      const monthlyData = months.map(
        (month) => yearlyTotalAmount[year][month] || 0
      );
      chartDataYearlyTotalAmount[year] = {
        labels: months,
        datasets: [
          {
            label: "Sale Amount",
            data: monthlyData,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    console.log("updated yearlyChartData:", chartDataYearlyTotalAmount);
    console.log("chart quantities:", chartData);
    console.log("chartDataMonthly quantities:", chartDataMonthly);
    console.log("chartDataWeekly quantities:", chartDataWeekly);

    res.render("admin/sales-report", {
      admin,
      categories,
      chartData,
      chartDataMonthly,
      chartDataWeekly,
      yearlyChartData,
      chartDataYearlyTotalAmount,
      ordersCount,
      totalSale,
      userCount,
      onlineCount,
      codCount,
      codPercentage,
      onlinePercentage,
    });
  } catch (error) {
    console.log(error);
  }
};

const getSalesReport = async (req, res) => {
  try {
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let dateRange = "";

    if (fromDate && toDate) {
      dateRange = `Sales Report from ${fromDate} to ${toDate}`;
    }
    console.log(" Date range ", dateRange);

    console.log("from Date", fromDate);
    console.log("to Date", toDate);

    let orders;

    if (fromDate && toDate) {
      orders = await productHelpers.getOrdersByDateRange(fromDate, toDate);
    } else {
      orders = await productHelpers.getAllOrders();
    }

    const productSales = {};

    for (const order of orders) {
      for (const product of order.products) {
        console.log("Processing product:", product);
        if (!productSales[product.item]) {
          productSales[product.item] = {
            productID: product.item, // Add productID field
            name: "",
            quantitySold: 0,
            totalAmount: 0,
            category: "",
          };
        }

        productSales[product.item].quantitySold += product.quantity;

        if (
          !productSales[product.item].name ||
          !productSales[product.item].category
        ) {
          const productDetails = await userHelpers.productDetails(product.item);
          console.log("product details", productDetails);
          if (productDetails) {
            productSales[product.item].name = productDetails.name;
            productSales[product.item].category = productDetails.category;
          }
        }

        const productTotal = product.quantity * product.price;

        productSales[product.item].totalAmount += productTotal;
      }
    }

    const salesData = [];
    let totalSalesAmount = 0;

    for (const item in productSales) {
      const product = productSales[item];
      salesData.push({
        "Product ID": product.productID, // Add productID field to the sales data
        "Product Name": product.name,
        "Total Quantity Sold": product.quantitySold,
        "Total Amount": product.totalAmount,
        Category: product.category,
      });
      totalSalesAmount += product.totalAmount;
    }

    salesData.push({
      "Product ID": "", // Placeholder for total
      "Product Name": "Total Sales Amount:",
      "Total Quantity Sold": "",
      "Total Amount": totalSalesAmount,
      Category: "",
    });

    const csv = new ObjectsToCsv(salesData);

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `SalesReport_${timestamp}.csv`;
    const filePath = path.join(__dirname, "..", "files", fileName);

  
    if (!fs.existsSync(filePath)) {
      await csv.toDisk(filePath, { append: true });
    }

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
};
const getSalesReportXLXS = async (req, res) => {
  try {
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let dateRange = "";

    if (fromDate && toDate) {
      dateRange = `Sales Report from ${fromDate} to ${toDate}`;
    }
    console.log(" Date range ", dateRange);

    console.log("from Date", fromDate);
    console.log("to Date", toDate);

    let orders;

    if (fromDate && toDate) {
      orders = await productHelpers.getOrdersByDateRange(fromDate, toDate);
    } else {
      orders = await productHelpers.getAllOrders();
    }

    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "SL no.", key: "s_no", width: 10 },
      { header: "Product ID", key: "product_id", width: 30 },
      { header: "Product Name", key: "product_name", width: 30 },
      { header: "Total Quantity Sold", key: "total_quantity_sold", width: 20 },
      { header: "Total Amount", key: "total_amount", width: 20 },
      { header: "Category", key: "category", width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };

    const productSales = {};

    let slNo = 1;
    for (const order of orders) {
      for (const product of order.products) {
        console.log("Processing product:", product);
        if (!productSales[product.item]) {
          productSales[product.item] = {
            id: product.item,
            name: "",
            quantitySold: 0,
            totalAmount: 0,
            category: "",
          };
        }

        productSales[product.item].quantitySold += product.quantity;

        if (
          !productSales[product.item].name ||
          !productSales[product.item].category
        ) {
          const productDetails = await userHelpers.productDetails(product.item);
          console.log("product details", productDetails);
          if (productDetails) {
            productSales[product.item].name = productDetails.name;
            productSales[product.item].category = productDetails.category;
          }
        }

        const productTotal = product.quantity * product.price;

        productSales[product.item].totalAmount += productTotal;
      }
    }

    for (const item in productSales) {
      const product = productSales[item];
      worksheet.addRow({
        s_no: slNo++,
        product_id: product.id,
        product_name: product.name,
        total_quantity_sold: product.quantitySold,
        total_amount: product.totalAmount,
        category: product.category,
      });
    }

    let totalSalesAmount = 0;
    for (const item in productSales) {
      totalSalesAmount += productSales[item].totalAmount;
    }
    const totalSalesRowNumber = worksheet.rowCount + 1;
    worksheet.addRow({
      s_no: "",
      product_name: "",
      total_quantity_sold: "",
      total_amount: "Total Sales Amount:",
      category: totalSalesAmount,
    });
    worksheet.getRow(totalSalesRowNumber).font = { bold: true };

    const dateRangeRowNumber = totalSalesRowNumber + 2;
    worksheet.getCell(`A${dateRangeRowNumber}`).value = dateRange;
    worksheet.mergeCells(`A${dateRangeRowNumber}:E${dateRangeRowNumber}`);
    worksheet.getRow(dateRangeRowNumber).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `SalesReport_${timestamp}.xlsx`;
    const filePath = path.join(__dirname, "..", "files", fileName);
    await workbook.xlsx.writeFile(filePath);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating sales report");
  }
};
const getOrdersReport = async (req, res) => {
  try {
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let dateRange = "";

    if (fromDate && toDate) {
      dateRange = `Orders Report from ${fromDate} to ${toDate}`;
    }
    console.log("Date range: ", dateRange);

    console.log("From Date: ", fromDate);
    console.log("To Date: ", toDate);

    let orders;

    if (fromDate && toDate) {
      orders = await productHelpers.getOrdersByDateRange(fromDate, toDate);
    } else {
      orders = await productHelpers.getAllOrders();
    }
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const csvData = [];
    csvData.push([
      "SL No.",
      "Order ID",
      "User Name",
      "User ID",
      "Order Amount",
      "Order Date",
    ]);

    let slNo = 1;
    for (const order of orders) {
      const user = await userHelpers.getUserDetails(order.userId);
      const userName = user ? user.name : "Unknown";

      csvData.push([
        slNo++,
        order._id,
        userName,
        order.userId,
        order.totalAmount,
        order.date.toISOString(),
      ]);
    }

    const csvContent = csvData.map((row) => row.join(",")).join("\n");

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `OrdersReport_${timestamp}.csv`;
    const filePath = path.join(__dirname, "..", "files", fileName);

    fs.writeFileSync(filePath, csvContent);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error generating orders report:", error);
    res.status(500).send("Error generating orders report");
  }
};

const getOrdersReportXLXS = async (req, res) => {
  try {
    let fromDate = req.query.fromDate;
    let toDate = req.query.toDate;
    let dateRange = "";

    if (fromDate && toDate) {
      dateRange = `Orders Report from ${fromDate} to ${toDate}`;
    }
    console.log("Date range: ", dateRange);

    console.log("From Date: ", fromDate);
    console.log("To Date: ", toDate);

    let orders;

    if (fromDate && toDate) {
      orders = await productHelpers.getOrdersByDateRange(fromDate, toDate);
    } else {
      orders = await productHelpers.getAllOrders();
    }
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    const workbook = new excelJs.Workbook();
    const worksheet = workbook.addWorksheet("Orders Report");

    worksheet.columns = [
      { header: "SL No.", key: "s_no", width: 10 },
      { header: "Order ID", key: "order_id", width: 30 },
      { header: "User Name", key: "user_name", width: 30 },
      { header: "User ID", key: "user_id", width: 30 },
      { header: "Order Amount", key: "order_amount", width: 20 },
      { header: "Order Date", key: "order_date", width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };

    let slNo = 1;
    for (const order of orders) {
      const user = await userHelpers.getUserDetails(order.userId); // Fetch user details
      const userName = user ? user.name : "Unknown"; // Use user's name or 'Unknown' if not found

      worksheet.addRow({
        s_no: slNo++,
        order_id: order._id,
        user_name: userName,
        user_id: order.userId,
        order_amount: order.totalAmount,
        order_date: order.date.toISOString(), // Adjust the format as needed
      });
    }

    const dateRangeRowNumber = worksheet.rowCount + 2;
    worksheet.getCell(`A${dateRangeRowNumber}`).value = dateRange;
    worksheet.mergeCells(`A${dateRangeRowNumber}:E${dateRangeRowNumber}`);
    worksheet.getRow(dateRangeRowNumber).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileName = `OrdersReport_${timestamp}.xlsx`;
    const filePath = path.join(__dirname, "..", "files", fileName);
    await workbook.xlsx.writeFile(filePath);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error generating orders report:", error);
    res.status(500).send("Error generating orders report");
  }
};

module.exports = {
  getUsers,
  blockOrUnblockUser,
  verifyAdminLogin,
  adminLogin,
  adminLogout,
  getSales,
  getSalesReport,
  getSalesReportXLXS,
  getOrdersReport,
  getOrdersReportXLXS,
};
