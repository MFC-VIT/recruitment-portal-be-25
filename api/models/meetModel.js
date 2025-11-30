const mongoose = require('mongoose')
Schema = new mongoose.Schema
const MeetSchema = new Schema(
    {
        user_id:{
            type:mongoose.Schema.Types.ObjectId,
            required: true,
            ref:"User"
        },
        intervieweremail:{
            type : String,
            default : 'adithyanachiyappan.2024@vitstudent.ac.in'
            },
        scheduledTime:{
            type : Date,
            required: true
        },
        gmeetLink:{
            type: String,
        },
        status:{
            type:String,
            enum:['scheduled','underway','completed','cancelled'],
            default:'scheduled'
        }

    }
)
module.exports = mongoose.model("MeetDetails", MeetSchema);