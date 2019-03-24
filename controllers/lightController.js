
var bodyParser= require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var generator = require('generate-password');
var nodemailer = require('nodemailer');

module.exports= function(app,mysqlConnection){

    app.get('/index',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('index',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    // Displays all the users
    app.get('/home',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb ORDER BY user_name',(err, rows, fields)=>{
            if(!err){
                res.render('home',{data: rows});
            }     
            else
            console.log(err);
        });
    });    

    // Login controller
    app.post('/login',urlencodedParser,function(req,res){ 
        mysqlConnection.query("SELECT * FROM user_tb WHERE email='"+req.body.email+"' AND password='"+req.body.password+"'",(err, rows, fields)=>{
            if(!err){
                 if(rows.length){
                    app.get('/home',function(req,res){
                        mysqlConnection.query('SELECT * FROM user_tb ORDER BY user_name',(err, rows, fields)=>{
                            if(!err){
                                res.render('home',{data: rows});
                            }     
                            else
                            console.log(err);
                        });
                    });
                 }
                 else
                res.redirect('index');
            }     
            else
            console.log(err);
        });
    });

    // Adds the new user
    app.post('/home',urlencodedParser,function(req,res){ 
        // Generates Password 
        var password = generator.generate({
            length: 10,
            numbers: true
        });
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'finalyearit2019@gmail.com',
              pass: 'Final@2019'
            }
        });
          
        var mailOptions = {
            from: 'finalyearit2019@gmail.com',
            to: req.body.email,
            subject: 'Registration for Automated Home',
            text: 'Thank You \nYour password is '+password+'.'
        };
        
        mysqlConnection.query("INSERT INTO user_tb (user_name,email,password,location,house_number) VALUES ('"+req.body.username+"','"+req.body.email+"','"+password+"','"+req.body.location+"','"+req.body.house_number+"')",(err, rows, fields)=>{
            if(!err){
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                });
                res.redirect(req.originalUrl);
            }     
            else
                console.log(err);
        });
    });

    // List all users
    app.get('/profile',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('profile',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    // List all room of particular house
    app.get('/profile_home',function(req,res){
        if(req.query.h_id){
            mysqlConnection.query("SELECT * FROM room_tb WHERE house_number=? ORDER BY room_name",req.query.h_id,(err, rows, fields)=>{
                if(!err){
                    res.render('profile_home',{data: rows, h_id : req.query.h_id});
                }     
                else{
                    console.log(err);
                }
            });
        }
    });

    // Add rooms to a particular house
    app.post('/profile_home',urlencodedParser,function(req,res){
        if(req.query.h_id){
            mysqlConnection.query("INSERT INTO room_tb (room_name,automated,house_number) VALUES ('"+req.body.roomname+"','0','"+req.query.h_id+"')",(err, rows, fields)=>{
                if(!err){
                    res.redirect(req.originalUrl);
                }     
                else
                    console.log(err);
            });
        }
    });

    // List all components of a particular room
    app.get('/profile_room',function(req,res){
        if(req.query.room_id){
            mysqlConnection.query("SELECT * FROM status_tb WHERE room_id=? ORDER BY output_pin",req.query.room_id,(err, rows, fields)=>{
                if(!err){
                    res.render('profile_room',{data: rows, h_id : req.query.room_id});
                }     
                else{
                    console.log(err);
                }
            });
        }
    });

    // Add new components of a particular room
    app.post('/profile_room',urlencodedParser,function(req,res){
        if(req.query.room_id){
            mysqlConnection.query("INSERT INTO status_tb (component_name,used_for,status,output_pin,room_id) VALUES ('"+req.body.component_name+"','"+req.body.purpose+"','1','"+req.body.output_pin+"','"+req.query.room_id+"')",(err, rows, fields)=>{
                if(!err){
                    res.redirect(req.originalUrl);
                }     
                else
                    console.log(err);
            });
        }
    });
};