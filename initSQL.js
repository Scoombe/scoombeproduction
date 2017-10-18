

var pjson = require('./package.json');
//getting the database name from the package.json
var databaseName = pjson.database
console.log(databaseName);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(databaseName);

db.serialize(function(){

    db.run("CREATE TABLE IF NOT EXISTS users(user_id INTEGER PRIMARY KEY AUTOINCREMENT , login_name VARCHAR(20), password VARCHAR(256)" +
    " not null, first_name VARCHAR(16) not null, last_name VARCHAR(16) not null);")

    db.run("CREATE TABLE IF NOT EXISTS tasks(task_id INTEGER not null , user_id INT, task_heading varchar(20) "+
    "not null, task_description varchar(255),  position INTEGER NOT NULL, priority VARCHAR(16), done Boolean, date_done datetime, PRIMARY KEY( user_id, task_id) ,FOREIGN KEY(user_id) REFERENCES users(user_id));");

   //call this to create the user again
    function createUser(){
        var crypto = require('crypto')

        //change these to create a mew user. 
        var login_name = "";
        var first_name = ""
        var last_name = "";
        var password = "";

        password = crypto.createHash('sha256').update(password).digest('base64');
        db.run("INSERT INTO users (login_name,password, first_name, last_name) VALUES('Scoombe',$password, 'Sam','Coombe')", {$password:password});
    }    
});

