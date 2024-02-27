
const verifyLogin = (req, res, next) => {
  try {
    console.log("verifyLogin middleware called");
    if (req.session.authorized) {
      next();
    } else {
      console.log("Redirecting to login page from verifyLogin middleware");
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in verifyLogin middleware:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = verifyLogin;
