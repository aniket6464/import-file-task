import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    industry:{
        type:String,
        trim:true
    },
    location:{
        type:String,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    phone:{
        type:Number,
        trim:true
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
})

const Company = mongoose.model('Company',CompanySchema);

export default Company;