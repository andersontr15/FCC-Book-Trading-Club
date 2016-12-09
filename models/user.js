var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Books'
    }]
});

UserSchema.pre('save', function(next) {
    console.log('Saving document');
    next()
})

var Model = mongoose.model('User', UserSchema);

module.exports = Model;