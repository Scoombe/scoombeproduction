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
//moment used for formatting dates
var moment = require('moment');
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
                                //insecure cookies as not no https
                                cookie: { secure: false }});
//this allows socket.io to request the session variabels
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
        res.sendFile(path.join(__dirname + '/Client/index.html'));
    });
    



     //route for getting the home page
    app.get('/home',function(req,res){
        authPage(req,res,'/Client/home.html','/');     
    });

    //route for getting the pomodoro page
    app.get('/pomodoro',function(req,res){
       authPage(req,res,'/Client/Pomodoro.html','/');
    });

    //function for the determining if the page is authorized or not
    //params: req is the session,  url: is the url to direct to if auth, redirect, is the url to direct to if no auth.
    function authPage(req, res, url, redirect){
        //if there is a username
        if(req.session && req.session.user_id){
            res.sendFile(path.join(__dirname + url ));
        }
        else{
            res.redirect(redirect);
        }        
    };
    
    //allowing the app to user the client folder to get resources
    app.use(express.static(path.join(__dirname, 'client')));

    //the handling of the post from the login page form
    app.post("/", function(Request, Result){
        //getting the post data
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
        /* 
        calls: this is called on the login page when the user loads the page
        function: used to pass on any login errors
        params: {data} : just a string that isn't used
        */
        socket.on("start", function(data){
            //get the session vars
            var session = socket.request.session;
            //if there is a login error emit the message
            if(session.login_error != null)
            {
                socket.emit("login_error",session.login_error);
            }
        })
        /*
        calls: this is called from the home page
        function: this is used to pass on the username to the home page
         */
        socket.on("home",function(data){
            var session = socket.request.session;
            socket.emit('username',session.username);
        })
        /*
        calls: this is called when the user creates a new task
        function: creates an sqlite query and executes to the database
        params: {data.Title} the todo title from the user
                {datat.Notes} the notes from the user
         */
        socket.on("newTask",function(data){
            //todo: add validation for new tasks and update tasks            
            //sql for a new task
            var session = socket.request.session;
            //getting the user_id from the session 
            var user_id = session.user_id;
            let date = moment().format("YYYY:MM:DD");
            //executing sql to add a new todo to the database
            db.run(`insert into tasks(task_id,user_id, task_heading, task_description, position, done, date_added, category_id) VALUES((SELECT IFNULL(MAX(task_id),0) + 1 FROM tasks where user_id = '${user_id}'), '${user_id}', '${data.title}', '${data.notes}', (select IFNULL(MAX(position),0) from tasks),0, '${date}', '${data.category}')`,function(err){
                if(err){
                    console.log(err.message);
                }
                socket.emit("updateDone");
            });

        });
        /*
        calls: this is called on the home page when an update or create or reorder happens
        function: to get the todos and the done todos from the database
        */
        socket.on("getTasks",function(data){
            var session = socket.request.session;
            var user_id = session.user_id;
            console.log("getting tasks");
            //selecting all of the tasks and ordering them by priority
            db.all("SELECT * from tasks where user_id = $user_id and done = 0 ORDER BY position, task_id",{$user_id:user_id},function(err,rows){
                if(err){
                    console.log(err.message);
                }
                else{
                    socket.emit("tasks",rows);
                }
            });
            //selecting all of the tasks and ordering them by date done
            db.all("SELECT * from tasks where user_id = $user_id and done = 1 ORDER BY date_done, task_id",{$user_id:user_id},function(err,rows){
                if(err){
                    console.log(err.message);
                }
                else{
                    socket.emit("tasks-done",rows);
                }
            });
           
        })
        /*
        function: Getting the colours from the database
        */
        socket.on("getColours",function(){
            console.log("getting colours");
            db.all("SELECT * from colours",{},function(err,rows){
                if(err){
                    console.log("Error Retriving Colors: " + err.message);
                }
                else{
                    console.log("Colour Submitted");
                    socket.emit("colours",rows);
                }
            });
        });

         /*
        function: Getting the categories from the database
        */
        socket.on("getCategories",function(){
            let session = socket.request.session;
            var user_id = session.user_id;
            console.log("getting Categories");
            db.all(`SELECT category_id, category_name, categories.colour_id, colour_code from categories left join colours on categories.colour_id = colours.colour_id where user_id = ${user_id}`,function(err,rows){
                if(err){
                    console.log("Error Retriving Categories: " + err.message);
                }
                else{
                    socket.emit("categories",rows);
                }
            });
        });

        /*
        calls: called when the user updates a todo
        function: to update the todo in the database
        params: {data.$task_description} the updated description from the user
                {data.$task_heading} the updated notes from the user
                {data.$task_id} the task_id
        */
        socket.on("updateTask",function(data){
            var sesion = socket.request.session;
            //getting the user id from the session
            data.user_id= sesion.user_id;
            //updating the database with the user data]
            db.run(`UPDATE tasks SET task_description = '${data.task_description}', task_heading = '${data.task_heading}',  category_id = '${data.category_id}' WHERE task_id = '${data.task_id}' and user_id = '${data.user_id}'`,function(err){
                if(err){
                    console.log("Failed Update " + err.message);
                }
                socket.emit("updateDone");
            });
            console.log("update done")
        });

         /*
        calls: called when the user createas  a todo category
        function: to create todo categories in the database
        params: {data.$task_description} the updated description from the user
                {data.$task_heading} the updated notes from the user
                {data.$task_id} the task_id
        */
        socket.on("createCategory",function(data){
            var sesion = socket.request.session;
            //getting the user id from the session
            data.$user_id= sesion.user_id;
            //updating the database with the user data]
            db.run(`INSERT INTO categories(user_id, category_id, category_name, colour_id ) VALUES(${data.$user_id}, (SELECT IFNULL(MAX(category_id),0) + 1 FROM categories), '${data.$category_name}', '${data.$category_colour}')`,function(err){
                if(err){
                    console.log("Failed Create: " + err.message);
                }
                socket.emit("updateDone");
            });
            console.log("Created Category")
        });
        
        socket.on("reorderTasks",function(data){
            var sesion = socket.request.session;
            data.$user_id= sesion.user_id;
            var taskCount = 0;
            data.tasks.forEach(function(task) {
                db.run("UPDATE tasks set position = $count, done = 0 WHERE task_id = $task_id and user_id = $user_id",
                {$count:taskCount,
                    $task_id:task,
                    $user_id:data.$user_id},
                function(err){
                    if(err){

                        console.log("Reorder Failed: " + err.message);
                    }
                })
                taskCount++;
            });
            data.doneTasks.forEach(function(task){
                db.run("UPDATE tasks set date_done = $date, done = 1 WHERE task_id = $task_id and user_id = $user_id",
                {$task_id:task,
                    $user_id:data.$user_id,
                    $date:new moment().format("YYYY:MM:DD")},
                function(err){
                    if(err){
                        console.log("Setting to done failed: " + err.message);
                    }
                })
            });
            socket.emit("updateDone");
        });
        socket.on("deleteTask",function(data){
            //sql for deleting a task
        });
        //function for the deleting of a category
        //parama: data, should be the category id coming from the home page
        socket.on("deleteCategory",function(data){
            //sql for deleting a task
            let sesion = socket.request.session; 
            let user_id= sesion.user_id;
            let category_id  = data;
            db.run(` update tasks set category_id = '' where category_id = ${category_id}`, function(err){
                if(err){console.log("Updateing tasks for category delete Failed: ");}
            });
            db.run(`delete from categories where user_id = '${user_id}' and category_id = '${category_id}';`,function(err){
                if(err){console.log("Deleting Category Failed: ");}
                else{
                    console.log("Deleted Categoroy: " + data) ;
                    socket.emit("updateDone");
                }
            })
        });
    })
//end of socket logic
