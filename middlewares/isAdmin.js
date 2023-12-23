const isAdmin=(req,res,next)=>{
    if(req.session.authorized){
       next()
    }else{
       res.redirect("/admin")
    }
   }
   module.exports=isAdmin;