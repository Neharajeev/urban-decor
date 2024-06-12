const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,
    },
    image:{
        type:String,
        required:true,
        default:false
    },
    isDeleted:{
         type:Boolean,
         required:true,
         default:false,

    },
    
},{timeStamp:true}
)
 
module.exports = mongoose.model("Category",categorySchema)