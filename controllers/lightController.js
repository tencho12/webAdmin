
var bodyParser= require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var generator = require('generate-password');
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

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
    app.get('/home', function (req, res) {
        
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
        mysqlConnection.query("SELECT * FROM admin_tb WHERE email='"+req.body.email+"' AND password='"+req.body.password+"'",(err, rows, fields)=>{
                if (rows.length>0) {
                    userProfil = { email: req.body.email, };
                    myCache.set("myKey", userProfil, function (err, success) {
                        if (!err && success) {
                        }
                    });
                     res.redirect('/home');
                }
                else
                    res.send(err)
        });
    });

    // Adds the new user
    app.post('/home',urlencodedParser,function(req,res){ 
        
        var password = generator.generateMultiple(3, {
            length: 10,
            uppercase: false
        });

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tenzinchophel944@gmail.com',
                pass: 'friendship74'
            }
        });
        const mailOptions = {
            from: 'tenzinchophel944@gmail.com', // sender address
            to: req.body.email, // list of receivers
            subject: 'your password', // Subject line
            html: '<b>Dear user</b>,<br> Thank you for using our service. Your current password is <i>'+password[1]+'</i>. You can always change from your profile page after you login.<br><br><br>Thank you.<br>'// plain text body
        };
        
        var sql = "SELECT * FROM user_tb WHERE user_name=? OR email=? OR house_number=?"; 
        var val=[req.body.user_name,req.body.email,req.body.house_number]
        mysqlConnection.query(sql, val, (err, rows, fields) => { 
            if (rows) {
                bcrypt.hash(password[1], 10, (err, hash) => {
                    var sql = "INSERT INTO user_tb (user_name,email,password,location,house_number) VALUES ('" + req.body.user_name + "','" + req.body.email + "','" + hash + "','" + req.body.location + "','" + req.body.house_number + "')";
                    mysqlConnection.query(sql, (err, rows, fields) => {
                        if (rows) {
                            transporter.sendMail(mailOptions, function (err, info) {
                                if (err)
                                    res.send('Err' + err)
                                else
                                    res.redirect(req.originalUrl);
                            });
                        }
                        else
                            res.send(err.sqlMessage)
                    });
                });
            } else {
                res.send({err:'similar data already exist in database.'})
            }
            
        })

       
        
    });
    
    
    // List all users
    var email;
    app.get('/profile', function (req, res) {
        
        myCache.get("myKey", function (err, value) {
            if (!err) {
                // console.log(value)
                email = value.email;
            }
        });
        var sql = "SELECT * FROM admin_tb WHERE email=?";
        var value = email
        mysqlConnection.query(sql, value, (err, rows, fields)=>{
            if (rows.length>0) {
                res.render('profile',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    app.post('/profile', function (req, res) {
        var email;
        myCache.get("myKey", function (err, value) {
            if (!err) {
                // console.log(value)
                email = value.email;
            }
        });
        
            var sql = "UPDATE admin_tb SET name=?, email=?, password=?, phone_no=? WHERE email=?";
            var values=[req.body.name, req.body.email, req.body.password, req.body.phone_no, email]
            mysqlConnection.query(sql, values, (err, rows, fields) => {
                if (rows.affectedRows==1) {
                     res.render('index');
                }
                else
                    console.log(err)
            });
    });

    // List all room of particular house
    app.get('/profile_home',function(req,res){
        if(req.query.h_id){
            mysqlConnection.query("SELECT * FROM room_tb WHERE house_number=? ORDER BY room_name",req.query.h_id,(err, rows, fields)=>{
                
                if (!err) {
                    res.render('profile_home',{data: rows, h_id : req.query.h_id});
                }     
                else{
                    console.log(err);
                }
            });
        }
    });

    // Add admin
    app.post('/addAdmin', urlencodedParser, function (req, res) {
        var password = 'pass';
            mysqlConnection.query("INSERT INTO admin_tb (name,email,phone_no,password) VALUES ('" + req.body.name + "','" + req.body.email + "','" + req.body.phone_no + "','" + password +"')", (err, rows, fields) => {
                if (!err) {
                    res.redirect('/home');
                }
                else
                    console.log(err);
            });
    });

    // Add rooms to a particular house
    app.post('/profile_home',urlencodedParser,function(req,res){
        if(req.query.h_id){
            mysqlConnection.query("INSERT INTO room_tb (room_name,automated,human_presence,house_number) VALUES ('"+req.body.roomname+"','0','0','"+req.query.h_id+"')",(err, rows, fields)=>{
                if(!err){
                    mysqlConnection.query("INSERT INTO sensor_tb (room_id,sensor_type,value) VALUES ('"+rows["insertId"]+"','temperature','0')",(err, rows1, fields)=>{
                        if(!err){
                            mysqlConnection.query("INSERT INTO sensor_tb (room_id,sensor_type,value) VALUES ('"+rows["insertId"]+"','light','0')",(err, rows, fields)=>{
                                if(!err){
                                    res.redirect(req.originalUrl);
                                }     
                                else
                                    console.log(err);
                            });
                        }     
                        else
                            console.log(err);
                    });
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
                            var room_id = rows[i].room_id;
                            mysqlConnection.query('DELETE FROM status_tb WHERE room_id='+rows[i].room_id, (err, rows1, fields)=>{
                                if(!err){
                                    mysqlConnection.query("DELETE FROM room_tb WHERE house_number="+req.body.userid,(err, rows1, fields)=>{
                                        if(!err){
                                            mysqlConnection.query('DELETE FROM sensor_tb WHERE room_id='+room_id, (err, rows, fields)=>{
                                                if(err){
                                                    console.log(err);
                                                }
                                            });
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
                        mysqlConnection.query('DELETE FROM sensor_tb WHERE room_id='+req.body.rid, (err, rows, fields)=>{
                            if(!err){
                                var url = '/profile_home?h_id='+req.body.hid;                       
                                res.redirect(url);
                            }
                            else{
                                console.log(err);
                            }
                        });
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
    app.get('/readPin/',function(req,res){        
        if(req.query.room_id){
            var result={};
            mysqlConnection.query("SELECT * FROM room_tb",(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{ 
                    for(var i in rows)
                        result['automated']=rows[i].automated;
                }
            });
            mysqlConnection.query("SELECT * FROM constant_tb",(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{
                    for(var i in rows){
                        if(rows[i].constant=="fanOn")
                            result['fanOn']=rows[i].value;
                        else if(rows[i].constant=="fanOff")
                            result['fanOff']=rows[i].value;
                        else if(rows[i].constant=="heaterOn")
                            result['heaterOn']=rows[i].value;
                        else if(rows[i].constant=="heaterOff")
                            result['heaterOff']=rows[i].value;
                        else if(rows[i].constant=="lightOn")
                            result['lightOn']=rows[i].value;
                        else if(rows[i].constant=="lightOff")
                            result['lightOff']=rows[i].value;
                    }
                }                    
            });
            var status=[]; 
            mysqlConnection.query("SELECT * FROM status_tb WHERE room_id=?",req.query.room_id,(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{
                    for(var i in rows){
                        var cart={};
                        cart['used_for']=rows[i].used_for;
                        cart['output_pin']=rows[i].output_pin;
                        status.push(cart);
                    }
                    var c=status.length;
                    result['status']=status;
                    result['success']=c;
                    res.send(result);
                }
            });
        }else {
            res.status(404).end('error 404 Page NoT Found');
        }
     });

    app.get('/readStatus/:room_id?',function(req,res){        
        if(req.query.room_id){
            var result={};
            mysqlConnection.query("SELECT * FROM room_tb WHERE room_id=?",req.query.room_id,(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{ 
                    for(var i in rows)
                        result['a']=rows[i].automated;
                        result['p']=rows[i].human_presence;
                }
            });
            mysqlConnection.query("SELECT * FROM constant_tb",(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{
                    for(var i in rows){
                        if(rows[i].constant=="fanOn")
                            result['fo']=rows[i].value;
                        else if(rows[i].constant=="fanOff")
                            result['ff']=rows[i].value;
                        else if(rows[i].constant=="heaterOn")
                            result['ho']=rows[i].value;
                        else if(rows[i].constant=="heaterOff")
                            result['hf']=rows[i].value;
                        else if(rows[i].constant=="lightOn")
                            result['lo']=rows[i].value;
                        else if(rows[i].constant=="lightOff")
                            result['lf']=rows[i].value;
                    }
                }                    
            });
            var status=[]; 
            mysqlConnection.query("SELECT * FROM status_tb WHERE room_id=?",req.query.room_id,(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{
                    for(var i in rows){
                        var cart={};
                        cart['for']=rows[i].used_for;
                        cart['pin']=rows[i].output_pin;
                        cart['of']=rows[i].status;
                        status.push(cart);
                    }
                    var c=status.length;
                    result['status']=status;
                    result['success']=c;
                    res.send(result);
                }
            });

        }else {
            res.status(404).end('error 404 Page NoT Found');
        }
    });

    app.get('/updateStatus/',function(req,res){        
        if(req.query.room_id ){

            if(req.query.status){
                var result={};
                for(var i =0; i<req.query.status.length; ){
                    let sql = "UPDATE status_tb SET status= ? WHERE room_id = ? AND output_pin= ?";
                    let values = [req.query.status.substring(i+2, i+3), req.query.room_id, req.query.status.substring(i, i+2)];
                    mysqlConnection.query(sql, values,(error, results, fields) => {
                      if (error){
                        return console.log(error.message);
                      } 
                    });
                    i+=3;
                }
            }

            if(req.query.temp && req.query.light){
                let sql = "UPDATE sensor_tb SET value= ? WHERE room_id = ? AND sensor_type ='temperature'";
                let values = [req.query.temp, req.query.room_id];
                mysqlConnection.query(sql, values,(error, results, fields) => {
                  if (error){
                    return console.log(error.message);
                  } 
                });
                sql = "UPDATE sensor_tb SET value= ? WHERE room_id = ? AND sensor_type='light'"
                values = [req.query.light, req.query.room_id];
                mysqlConnection.query(sql, values,(error, results, fields) => {
                  if (error){
                    return console.log(error.message);
                  } 
                });
            }
            if(req.query.hum){
                let sql = "UPDATE room_tb SET human_presence= ? WHERE room_id = ?";
                let values = [req.query.hum, req.query.room_id];
                mysqlConnection.query(sql, values,(error, results, fields) => {
                  if (error){
                    return console.log(error.message);
                  } 
                });
            }
            res.status(400).end('Updated the Tables Successfully');

        }else {
            res.status(404).end('error 404 Page NoT Found');
        }
    });


    app.get('/getPin/',function(req,res){        
        if(req.query.room_id){
            var result={};
            var status=[]; 
            mysqlConnection.query("SELECT * FROM status_tb WHERE room_id=?",req.query.room_id,(err, rows, fields)=>{
                if(err){
                    console.log(err);
                }else{
                    for(var i in rows){
                        var cart={};
                        cart['pin']=rows[i].output_pin;
                        cart['of']=rows[i].status;
                        status.push(cart);
                    }
                    var c=status.length;
                    result['status']=status;
                    result['success']=c;
                    res.send(result);
                }
            });
        }else {
            res.status(404).end('error 404 Page NoT Found');
        }
     });
};