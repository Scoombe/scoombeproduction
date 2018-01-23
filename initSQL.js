

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
    "not null, task_description varchar(255),  position INTEGER NOT NULL, priority VARCHAR(16), done Boolean, date_done TEXT, date_added TEXT, category_id INTEGER, PRIMARY KEY( user_id, task_id) ,FOREIGN KEY(user_id) REFERENCES users(user_id), FOREIGN KEY(category_id) REFERENCES categories(category_id))");

    db.run("CREATE TABLE IF NOT EXISTS categories(category_id INTEGER NOT NULL, user_id INTEGER, category_name varchar(20), colour_id varchar(6), PRIMARY KEY(user_id,category_id), FOREIGN KEY(user_id) REFERENCES user(user_id), FOREIGN KEY(colour_id) REFERENCES colours(colour_id))");

    db.run("CREATE TABLE IF NOT EXISTS colours(colour_id INTEGER PRIMARY KEY, colour_text varchar(10), colour_code varchar(10))");

    db.run("DELETE FROM COLOURS;");
    db.run("INSERT OR IGNORE INTO COLOURS(colour_id, colour_text, colour_code) VALUES(1,'Blue' ,'#add6ff'),(2,'Green','#b2fcc2'), (3,'Orange','#fce0b1'),(4,'Red','#fcb2b1'),(5,'Yellow','#fcfcb1')");

    createUser();
   //call this to create the user again
    function createUser(){
        var crypto = require('crypto')

        //change these to create a mew user. 
        var login_name = "test";
        var first_name = "test"
        var last_name = "test";
        var password = "test";

        password = crypto.createHash('sha256').update(password).digest('base64');
        db.run(`INSERT INTO users (login_name,password, first_name, last_name) VALUES('${login_name}','${password}', '${first_name}','${last_name}')`);
    }    
});

