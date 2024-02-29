const mongoose=require("mongoose")

const imgSchema=new mongoose.Schema({
    name:String,
    img:{
        data:Buffer,
        contentType:String
    }
})

exports.module=ImageModel=mongoose.model("Image",imgSchema)