const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");

const category = async (req, res) => {
    try {
      const admin = req.session.admin;
      let categories = await userHelpers.getCategory();
      res.render("admin/view-category", { admin, categories });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", { message: "Internal Server Error" });
    }
  };
  const addCategory = (req, res) => {
    const admin = req.session.admin;
    res.render("admin/add-category", { admin });
  };
  const categoryAdding = async (req, res) => {
    const admin = req.session.admin;
    try {
      console.log(req.body.title);
      console.log(req.body.category);
      const categoryData = {
        title: req.body.title,
        category: req.body.category,
      };
  
      const result = await userHelpers.categoryAdding(categoryData);
  
      if (result.success) {
        res.redirect("/admin/category");
      } else {
        res.render("admin/add-category", { error: result.message, admin });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };

  module.exports={
    category,
    addCategory ,
    categoryAdding,
  }