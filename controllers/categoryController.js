const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const moment = require('moment')
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
  try {
    const admin = req.session.admin;
  res.render("admin/add-category", { admin });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
  
};
const categoryAdding = async (req, res) => {
  const admin = req.session.admin;
  try {
   
    console.log(req.body.category);
    console.log(req.body.offer);
    console.log(req.body.offerStart);
    const offerStart = moment(req.body.offerStart).format('YYYY-MM-DDTHH:mm');
    const offerEnd = moment(req.body.offerEnd).format('YYYY-MM-DDTHH:mm');
     console.log("offerstart after converting: ",offerStart);
     console.log("offerEndafter converting: ",offerEnd);
    const categoryData = {
      category: req.body.category,
      offer: req.body.offer,
      offerStart: offerStart,
      offerEnd: offerEnd ,
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
const editCategory = async (req, res) => {
  try {
    const admin = req.session.admin;
    let category = await userHelpers.getCategoryDetails(req.params.id);
    res.render("admin/edit-category",{admin,category})
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
 
};
const updateCategory = async (req, res)=>{
  try {
    let categoryId= req.params.id;
    const admin = req.session.admin;
    let category = await userHelpers.getCategoryDetails(req.params.id)
    const message= await userHelpers.updateCategory(req.body,categoryId)
    if (!message) {
      res.redirect('/admin/category');
      return;
    }
    res.render('admin/edit-category',{error:message,admin,category});
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
 
}

module.exports = {
  category,
  addCategory,
  categoryAdding,
  editCategory,
  updateCategory,
};
