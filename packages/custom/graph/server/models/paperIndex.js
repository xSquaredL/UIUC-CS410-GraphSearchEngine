/**
 * Created by xin on 4/25/16.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    id: { type: Number, required: true },
    index: { type: Number, required: true }
},{
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
});

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('PaperIndex', schema);
