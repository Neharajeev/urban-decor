const mongoose =  require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
        },
        password: {
            type: String,
            required: true,
          },
        isAdmin:{
            type:Boolean,
            default:false,
        },
        joinedDate:{
            type:Date,
            default:Date.now,
            immutable:true
        },
        isVerified:{
            type:Boolean,
            default:false,
        },
        isBlocked:{
            type:Boolean,
            default:false,
        }
        
    },
    {
        timestamps: true,
        strict: false,
      },
)

userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        next()
    }
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password,salt)

})
module.exports = mongoose.model('User',userSchema)