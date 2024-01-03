
const verifyLogin = (req, res, next) => {
   console.log("verifyLogin middleware called");
   if (req.session.authorized) {
     // User is authenticated, proceed to the next middleware or route handler
     next();
   } else {
     // User is not authenticated, redirect to login page
     console.log("Redirecting to login page from verifyLogin middleware");
     res.redirect("/login");
   }
 };
module.exports=verifyLogin;