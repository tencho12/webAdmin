//use path module
const path = require('path');
//use express module
const express = require('express');
//use ejs view engine
const ejs = require('ejs');
//use bodyParser middleware
const bodyParser = require('body-parser');
//use mysql database
const mysql = require('mysql');
const app = express();

const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password: '',
    database: 'home_automation_db'
});

//set views file
app.set('views',path.join(__dirname,'/views'));
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set folder public as static folder for static file
app.use(express.static(path.join(__dirname + '/public')));

//connecting to database
mysqlConnection.connect((err) =>{
    if(!err)
    console.log('DB connection successful');
    else
    console.log('connection failed \n Error: '+JSON.stringify(err, undefined, 2));
});
var lightController = require('./controllers/lightController');
//to fire the controller
lightController(app,mysqlConnection);

//server listening
app.listen(3000, () => {
  console.log('Server is running at port 3000');
});
