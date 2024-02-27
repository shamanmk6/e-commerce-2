const isAdmin = (req, res, next) => {
   try {
     if (req.session.admin) {
       next();
     } else {
       res.redirect("/admin");
     }
   } catch (error) {
     console.error("Error in isAdmin middleware:", error);
     res.status(500).send("Internal Server Error");
   }
 };
 
 module.exports = isAdmin;
 