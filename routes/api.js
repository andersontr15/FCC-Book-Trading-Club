var express = require('express');
var httpRequest = require('request');
var User = require('../models/user');
var Books = require('../models/books');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
var router = express.Router({ caseSensitive: true });

router.get('/users', function(request, response) {
    console.log('in route');
    User.find({}).select('name').exec(function(err, users) {
        if(err) {
            return response.status(400).send(err)
        }
        console.log(users);
        return response.status(200).json(users)
    })
});

router.put('/accept/:id', function(request, response) {
    console.log('in accept route');
    var bookId = request.params.id;
    var borrower = request.body.borrower;
    var owner = request.body.owner; 
    Books.findOne({ _id: bookId }, function(err, book) {
        if(err) {
            return response.status(400).send(err);
        }
        if(!book) {
            return response.status(404).send('No book found with this id');
        }
        book.requests.borrower = borrower;
        book.requests.status = 2;
        book.save(function(err, res) {
            if(err) {
                return response.status(400).send(err)
            }
            User.findById(owner, function(err, user) {
                if(err) {
                    return response.status(400).send(err)
                }
                if(!user) {
                    return response.status(400).send('No user with this id exists');
                }
                for(var i = 0; i < user.trades.length; i++){
                    if(user.trades[i].book === book._id){
                        user.trades[i].book = book;
                        user.requests += 1;
                        user.save(function(err, res){
                            if(err){
                                return response.status(400).send(err)
                            }
                            User.findById(borrower, function(err, user){
                                if(err) {
                                    return response.status(400).send(err)
                                }
                                if(!user) {
                                    return response.status(404).send('No user exists with this id ')
                                }
                                user.trades.push(book);
                                user.requests += 1;
                                user.save(function(err, res){
                                    if(err) {
                                        return response.status(400).send(err)
                                    }
                                     console.log('trade went through');
                                     return response.status(204).send('Trade went through. status should be 2 and accepted')
                                })
                            })
                        });
                    }
                }
                return response.status(404).send('Trouble updating book');

            })
        })
    })
});

router.put('/borrow/:id', function(request, response) {
    var bookId = request.params.id;
    var borrower = request.body.borrower;
    var owner = request.body.owner;
    console.log(borrower, owner);
    Books.findOne({ _id: bookId }, function(err, book) {
        if(err) {
            return response.status(400).send(err);
        }
        if(!book) {
            return response.status(404).send('No book found with this id');
        }
        book.requests.borrower = borrower;
        book.requests.status = 1;
        book.save(function(err, res) {
            if(err) {
                return response.status(400).send(err)
            }
            User.findById(owner, function(err, user){
                if(err) {
                    return response.status(400).send(err)
                }
                if(!user) {
                    return response.status(404).send('No user exists with this id');
                }
                user.trades.push(book);
                user.requests += 1;
                user.save(function(err, res) {
                    if(err) {
                        return response.status(400).send(err)
                    }
                    User.findById(borrower, function(err, user){
                        if(err) {
                            return response.status(400).send(err)
                        }
                        if(!user) {
                            return response.status(404).send('No user exists with this id ')
                        }
                        user.trades.push(book);
                        user.requests += 1;
                        user.save(function(err, res){
                            if(err) {
                                return response.status(400).send(err)
                            }
                             console.log('trade went through');
                             return response.status(204).send('Trade went through. in request mode')
                        })
                    })
                })
            })
        })
    })
});

router.get('/users/:id', function(request, response) {
    User.findById(request.params.id).populate('books').populate('requests.borrower').exec(function(err, user) {
        if(err) {
            console.log(err);
            return response.status(400).send(err)
        }
        if(!user) {
            return response.status(400).send('No user with this id!')
        }
        console.log('User is ' + user);
        return response.status(200).send(user);
    })
});

router.delete('/books/:id', function(request, response) {
    Books.remove({_id: request.params.id}, function(err, book) {
        if(err) {
            return response.status(400).send(err)
        }
        return response.status(200).send('Successfully deleted book!')
    })
});

router.post('/books/comment', function(request, response) {
   var id = request.body.id;
   var comment = request.body.comment;
   var user = request.body.user;
   Books.findById(id, function(err, book) {
       if(err) {
           return response.status(400).send(err)
       }
       book.comments.push({
           comment: comment,
           user: user,
           stars: 1
       });
       book.save(function(err, res) {
           if(err) {
               return response.status(400).send(err)
           }
           return response.status(201).send(res)
       })
   })
})

router.get('/books/byUser/:id', function(request, response) {
    Books.find( { "owner.id": request.params.id })
         .populate('owner.id books requests.borrower')
         .exec(function(err, books) {
            if(err) {
                console.log(err);
                return response.status(400).send(err)
            }
            if(!books) {
                return response.status(400).send('No books for this user!')
            }
            return response.status(200).send(books)
        })
    });

router.get('/books', authenticate, function(request, response) {
    Books.find({}, function(err, books) {
        if(err || books.length < 1) {
            return response.status(400).send(err)
        }
        return response.status(200).send(books)
    })
});

router.get('/books/:id', function(request, response) {
    Books.findById(request.params.id, function(err, book) {
        if(err) {
            return response.status(400).send(err)
        }
        return response.status(200).send(book)
    })
});

//Search google books API to retrieve covers and title
router.post('/books/search', function(request, response) {
    if(!request.body.title) {
        return response.status(400).send('No title submitted!')
    }
    else {
        httpRequest('https://www.googleapis.com/books/v1/volumes?q=' + request.body.title + '&key=AIzaSyBBsIsaG1liRrYMOiO1EhrqBw_704DbVV0', function(err, responseCode, body) {
            if(err) {
                return response.status(400).send('No book found')
            }
            console.log(body);
            var data = JSON.parse(body);
            if(data.items[0].volumeInfo && data.items[0].volumeInfo.imageLinks && data.items[0].volumeInfo.imageLinks.smallThumbnail) {
                var cover = data.items[0].volumeInfo.imageLinks.smallThumbnail || null;
            }
            var title = data.items[0].volumeInfo.title || null;
            var description = data.items[0].volumeInfo.description || null;
            var bookInfo = {
                cover: cover,
                title: title,
                description: description,
                owner: {
                    name: request.body.owner.name,
                    id: request.body.owner.id
                }
            }
            var book = new Books();
            book.title = bookInfo.title || null;
            book.cover = bookInfo.cover || null;
            book.owner.name  = bookInfo.owner.name || null;
            book.owner.id = bookInfo.owner.id
            book.description = bookInfo.description || null;
            book.save(function(err, bookDoc) {
                if(err) {
                    console.log(err);
                    return response.status(400).send('Book could not be added! Pleas try again.')
                }
                User.findById(bookInfo.owner.id, function(err, user) {
                    if(err) {
                        return response.status(400).send(err)
                    }
                    user.books.push(book);
                    user.save(function(err, doc) {
                        if(err) {
                            return response.status(400).send(err)
                        }
                        return response.status(201).send(bookDoc)
                    })
                })
            })
        })
    }
});


router.post('/verify-token', function(request, response) {
    console.log('in verification route');
    if(!request.body.token) {
        return response.status(400).send({
            message: 'No token has been supplied'
        })
    }
    jwt.verify(request.body.token, process.env.secret, function(err, decoded){
        if(err) {
            return response.status(400).send(err)
        }
        return response.status(200).send({
            message: 'Token is valid from API verification'
        })
    })
});

router.post('/login', function(request, response) {
    console.log(request.body.password);
    if(!request.body.name || !request.body.password) {
        return response.status(400).send({
            message: 'Invalid credentials supplied!'
        })
    }
    User.findOne({ name: request.body.name  }, function(err, document) {
        if(err) {
            return response.status(400).send(err)
        }
        if(!document) {
            return response.status(400).send({
                message: 'No user with these credentials!'
            })
        }
        var result = bcrypt.compareSync(request.body.password, document.password);
        if(result === true) {
            var token = jwt.sign({
                data: document
            }, process.env.secret, { expiresIn: 3600 });
            return response.status(200).send(token)
        }
        else {
            return response.status(400).send({
                message: 'Password is invalid'
            })
        }
            
        
    })
});

router.post('/register', function(request, response) {
    if(!request.body.name || !request.body.password) {
        return response.status(400).send({
            message: 'Invalid credentials supplied'
        });
    }
    var user = new User();
    user.name = request.body.name;
    user.password = bcrypt.hashSync(request.body.password, bcrypt.genSaltSync(10));
    user.save(function(err, document) {
        if(err) {
            if(err.code === 11000) {
                return response.status(400).send('This username is already taken!');
            }
            else {
                return response.status(400).send('An error has occurred in registering your credentials!');
            }
        }
        else {
            var token = jwt.sign({
                data: document
            }, process.env.secret, { expiresIn: 3600});
            return response.status(201).send(token);
        }
    });

});

function authenticate(request, response, next) {
    var token = request.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.secret, function(err, decoded){
        if(err) {
            return response.status(400).send(err)
        }
        next();
    });
};

module.exports = router;