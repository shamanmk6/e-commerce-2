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
   
    console.log(req.body.category);
    console.log(req.body.offer);
    console.log(req.body.offerStart);
    const categoryData = {
      category: req.body.category,
      offer: req.body.offer,
      offerStart: req.body.offerStart,
      offerEnd: req.body.offerEnd,
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
  const admin = req.session.admin;
  let category = await userHelpers.getCategoryDetails(req.params.id);
  res.render("admin/edit-category",{admin,category})
};
const updateCategory = async (req, res)=>{
  let categoryId= req.params.id;
  const admin = req.session.admin;
  let category = await userHelpers.getCategoryDetails(req.params.id)
  const message= await userHelpers.updateCategory(req.body,categoryId)
  if (!message) {
    res.redirect('/admin/category');
    return;
  }
  res.render('admin/edit-category',{error:message,admin,category});
}

module.exports = {
  category,
  addCategory,
  categoryAdding,
  editCategory,
  updateCategory,
};
