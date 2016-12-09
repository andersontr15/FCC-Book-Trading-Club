var port = process.env.PORT || 3000;
var db = "mongodb://localhost:27017/fcc-book-trading-club";
var router = require('./routes/api');
var dotenv = require('dotenv').config({verbose: true});
var express = require('express');
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var app = express();


mongoose.connect(db, function(err) {
    if(err) {
        console.log(err)
    }
});

mongoose.connection.on('connected', function() {
    console.log('Successfully opened a connection to ' + db);
});

mongoose.connection.on('disconnected', function() {
    console.log('Successfully disconnected from ' + db);
});

mongoose.connection.on('error', function() {
    console.log('An error occured making a connection to ' + db);
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use('/api', router);
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.get("*", function(request, response) {
    response.sendFile(__dirname + '/public/index.html');
});

app.listen(port, function() {
    console.log('Listening on port ' + port);
});
console.log(process.env);
