
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
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
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

    //delete user
    app.post('/deleteUser',urlencodedParser,(req, res)=>{
        mysqlConnection.query('DELETE FROM user_tb WHERE house_number='+req.body.userid,(err, rows, fields)=>{
            if(!err){
                mysqlConnection.query("SELECT * FROM room_tb WHERE house_number="+req.body.userid,(err, rows, fields)=>{
                    if(err){
                        console.log(err);
                    }else{ 
                        for(var i in rows){
                            mysqlConnection.query('DELETE FROM status_tb WHERE room_id='+rows[i].room_id, (err, rows, fields)=>{
                                if(!err){
                                    mysqlConnection.query("DELETE FROM room_tb WHERE house_number="+req.body.userid,(err, rows, fields)=>{
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }
                                else{
                                    console.log(err);
                                }
                            });
                        }
                    }
                });
                res.redirect('/home');
            }
            else{
                console.log(err);
            }
        });
    });

    //delete room
    app.post('/deleteroom',urlencodedParser,(req, res)=>{
        mysqlConnection.query("DELETE FROM room_tb WHERE room_id="+req.body.rid,(err, rows, fields)=>{
            if(!err){
                mysqlConnection.query('DELETE FROM status_tb WHERE room_id='+req.body.rid, (err, rows, fields)=>{
                    if(!err){
                        var url = '/profile_home?h_id='+req.body.hid;                       
                        res.redirect(url);
                    }
                    else{
                        console.log(err);
                    }
                });
            }else{
                console.log(err);
            }
        });   
    });

    //delete component
    app.post('/deleteCom',urlencodedParser,(req, res)=>{
        mysqlConnection.query('DELETE FROM status_tb WHERE component_id='+req.body.cid, (err, rows, fields)=>{
            if(!err){
                var url = '/profile_room?room_id='+req.body.rid;                       
                res.redirect(url);
            }
            else{
                console.log(err);
            }
        });
    });

    //Update User
    app.post('/updateUser',urlencodedParser,(req, res)=>{
        mysqlConnection.query("SELECT house_number FROM user_tb WHERE user_id="+req.body.user_id,(err, rows, fields)=>{
            if(!err){
                var hid;
                for(var i in rows){
                    hid = rows[i].house_number;
                }
                let sql = "UPDATE user_tb SET user_name= ?, email=?, location=?, house_number=? WHERE user_id = ?";
                let values = [req.body.user_name, req.body.email, req.body.location, req.body.house_number, req.body.user_id];
                mysqlConnection.query(sql, values,(error, results, fields) => {
                    if (error){
                        return console.log(error.message);
                    }else{
                        mysqlConnection.query("SELECT room_id FROM room_tb WHERE house_number="+hid,(err, rows, fields)=>{
                            if(err){
                                console.log(err);
                            }else{ 
                                for(var i in rows){
                                    let sql = "UPDATE room_tb SET house_number= ? WHERE room_id = ?";
                                    let values = [req.body.house_number, rows[i].room_id];
                                    mysqlConnection.query(sql, values,(error, results, fields) => {
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }
                            }
                        });
                        res.redirect('/home');
                    } 
                });
            }else{

            }
        });
    });

    //Update Room
    app.post('/updateRoom',urlencodedParser,(req, res)=>{
        
        let sql = "UPDATE room_tb SET room_name= ? WHERE room_id = ?";
        let values = [req.body.room_name, req.body.room_id];
        mysqlConnection.query(sql, values,(error, results, fields) => {
            if (error){
                return console.log(error.message);
            }else{
                var url = '/profile_home?h_id='+req.body.hid;                       
                res.redirect(url);
            } 
        });
    });

    //Update Component
    app.post('/updateCom',urlencodedParser,(req, res)=>{
        
        let sql = "UPDATE status_tb SET component_name= ?, used_for= ?, output_pin= ? WHERE component_id = ?";
        let values = [req.body.component_name, req.body.used_for, req.body.output_pin, req.body.cid];
        mysqlConnection.query(sql, values,(error, results, fields) => {
            if (error){
                return console.log(error.message);
            }else{
                var url = '/profile_room?room_id='+req.body.room_id;                       
                res.redirect(url);
            } 
        });
    });
};