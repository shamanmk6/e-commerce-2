// middleware.js
const setRequestVariable = (req, res, next) => {
    res.locals.req = req;
    next();
  };
  
  module.exports = {
    setRequestVariable,
  };
  