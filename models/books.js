var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BooksSchema = new Schema({
    owner: {
       name: {
           type: String,
           required: true
       },
       id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'User',
          required: true   
       }
    },
    requests: {
        borrower: { type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
        status: { type: Number, default: 0 }
    },
    title: {
        type: String, 
        required: true
    },
    description: {
        type: String,
    },
    cover: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    comments: [
        {
            comment: {
                type: String,
                required: true
            },
            stars: {
                type: Number,
                default: 1
            },
            user: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now()
            }
        }
    ]
});

var Model = mongoose.model('Books', BooksSchema);

module.exports = Model;