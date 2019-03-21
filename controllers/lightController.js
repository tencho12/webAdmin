
var bodyParser= require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

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

    app.get('/home',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('home',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    //delete user
    app.post('/delete',urlencodedParser,(req, res)=>{
    mysqlConnection.query('DELETE FROM user_tb WHERE user_id='+req.body.userid+'',(err, rows, fields)=>{
        if(!err)
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('home',{data: rows});
            }     
            else
            console.log(err);
        });
        else
        console.log(err);
    })
});

    app.post('/home',urlencodedParser,function(req,res){  
        mysqlConnection.query("INSERT INTO user_tb (user_name,email,password,location,house_number) VALUES ('"+req.body.username+"','"+req.body.email+"','"+req.body.password+"','"+req.body.location+"','"+req.body.house_number+"')",(err, rows, fields)=>{
            if(!err){
                mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
                    if(!err){
                        res.render('home',{data: rows});
                    }     
                    else
                    console.log(err);
                });
            }     
            else
            console.log(err);
        });
    });

    app.get('/profile',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('profile',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    app.get('/profile_home',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('profile_home',{data: rows});
            }     
            else
            console.log(err);
        });
    });

    app.get('/profile_room',function(req,res){
        mysqlConnection.query('SELECT * FROM user_tb',(err, rows, fields)=>{
            if(!err){
                res.render('profile_room',{data: rows});
            }     
            else
            console.log(err);
        });
    });
};