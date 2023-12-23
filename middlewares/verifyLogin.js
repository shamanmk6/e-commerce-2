
const verifyLogin=(req,res,next)=>{
 if(req.session.authorized){
    next()
 }else{
    res.redirect("/login")
 }
}
module.exports=verifyLogin;