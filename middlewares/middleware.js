
const setRequestVariable = (req, res, next) => {
  try {
    res.locals.req = req;
    next();
  } catch (error) {
    
    console.error("Error in setRequestVariable middleware:", error);
    next(error);
  }
};

module.exports = {
  setRequestVariable,
};
