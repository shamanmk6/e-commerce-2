const multer = require('multer');



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/product-images')
  },
  filename: function (req, file, cb) {
    let ext=file.originalname.substr(file.originalname.lastIndexOf('.'))
    cb(null, file.originalname + '-' +Date.now()+ext)
  }
})

const upload = multer({ storage: storage })


module.exports = upload;



