/**
 * Created by Sam's on 06/03/2017.
 */


//this is for the routing of the application
var Server = require('http').Server;
var express = require("express");
//this is for the handling of post data
var bodyParser = require('body-parser')
//for the handling of the sqlite database
var sqlite3 = require('sqlite3').verbose();
//for path handling 
var path = require('path');
//for session storage handling
var session = require("express-session");
//for the hashing of passwords
 var crypto = require('crypto')
       
//this is for the routing of the application
var app = express();

var server = Server(app);
//this is for the client side javascript requests to the server
var socketio = require('socket.io')(server);
//this is defining the router that the app will use
var router = express.Router();
//url encoded false
app.use(bodyParser.urlencoded({ extended: false }));
//serving of static data

//making sure the app uses the session
var sessionMiddleware = session({secret:'gu8',
                                name: "session",
                                resave: true,
                                saveUninitialized: true,
                                cookie: { secure: false }});
socketio.use(function(socket,next){
    sessionMiddleware(socket.request, socket.request.res, next);
})

app.use(sessionMiddleware);
//db configuration
    //this is looking at the package json file
    var pjson = require('./package.json');
    //getting the database name from the package.json
    var databaseName = pjson.database
    console.log(databaseName);
    //creating or getting the existing database
    var db = new sqlite3.Database(databaseName);
    //end of db config
    //serving the static folder

//routing logic
    //the socket server is running
    console.log("my socket server is running: ");

    //route for getting the index page
    app.get('/',function(req,res){
        console.log(res);
        res.sendFile(path.join(__dirname + '/Client/index.html'));
    });


     //route for getting the home page
    app.get('/home',function(req,res){
        console.log(res);
        //if there is a username
        if(req.session && req.session.user_id){
            res.sendFile(path.join(__dirname + '/Client/home.html'));
        }
        else{
            res.redirect('/');
        }        
    });

    app.use(express.static(path.join(__dirname, 'client')));
    //using the body pasrser for the handling of post data
    //app.use(bodyParser.json());

    //the handling of the post from the index.html form
    app.post("/", function(Request, Result){
        //logging the requests
        console.log(Request.body);
        var result = Request.body;
        var username = Request.body.username;
        var password = Request.body.password;
        username = username.toUpperCase();
        password = password.toUpperCase();
        //using regex to check if the username and password is valid
      if(username.match("^[A-Z0-9_]{5,15}$")){
            //username is valild
            //hashing the password
            password = crypto.createHash('sha256').update(Request.body.password).digest('base64');
            //selecting a user with the correct details from the db
            db.get("Select login_name, user_id from users where login_name=? and password=?",[Request.body.username,password],function(err, row){
                if(err){
                    console.log(err.message);
                }
                console.log(row);
                //checking if there is a user coming back
                if(row != null){
                    //
                    Request.session.username = row.login_name;
                    Request.session.user_id = row.user_id;
                    Result.redirect('/home');
                }
                else{
                    Request.session.login_error = "Username or Password is incorect."
                    Result.sendFile(path.join(__dirname + '/Client/index.html'));
                }
            });
        }
        else{
            //sort error validation username isn't valid
            Request.sesion.login_error = "Username isn't valid."
             Result.sendFile(path.join(__dirname + '/Client/index.html'));
        }
       
    });
//end of routing logic

//server is now listening on port 3000
var server = app.listen(3000);

//socket logic
    //the socket is listening for a new connection 
    //when there is  a connection then creating a new socket
    socketio.listen(server).on('connection', function (socket) {
        console.log("there has been a new connection:  " + socket.id);
        //when the client sends the login message
        socket.on("login", function(data){
            console.log(data);
            var session = socket.request.session
            console.log(session);
        });
        socket.on("start", function(data){
            //get the tasks from the databasae
            var session = socket.request.session;
            if(session.login_error != null)
            {
                socket.emit("login_error",session.login_error);
            }
        })
        socket.on("home",function(data){
            var session = socket.request.session;
            console.log(session);
            socket.emit('username',session.username);
        })
        socket.on("newTask",function(data){
            //sql for a new task
            var session = socket.request.session;
            var title = data.Title;
            var notes = data.Notes;
            var user_id = session.user_id;
            db.run("insert into tasks(task_id,user_id, task_heading, task_description, position, done) VALUES((SELECT IFNULL(MAX(task_id),0) + 1 FROM tasks where user_id = $user_id), $user_id, $title, $notes, (select IFNULL(MAX(position),0) from tasks),0)",{$user_id:user_id,$title:title,$notes:notes},function(err){
                if(err){
                    console.log(err.message);
                }
            });

        });
        socket.on("getTasks",function(data){
            var session = socket.request.session;
            var user_id = session.user_id;
            console.log("getting tasks");
            db.all("SELECT * from tasks where user_id = $user_id and done = 0",{$user_id:user_id},function(err,rows){
                socket.emit("tasks",rows);
            });
        })

        socket.on("updateTask",function(data){
            var sesion = socket.request.session;
            data.$user_id= sesion.user_id;
            db.run("UPDATE tasks SET task_description = $task_description, task_heading = $task_heading, done = $task_done WHERE task_id = $task_id and user_id = $user_id",data,function(err){
                if(err){
                    console.log(err.message);
                }
                socket.emit("updateDone");
            });
            console.log("update done")
        });
        socket.on("deleteTask",function(data){
            //sql for deleting a task
        });
        socket.on("moveTask",function(data){
            //sql for moving the tasks priority
        });
    })
//end of socket logic
