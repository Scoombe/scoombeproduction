var socket;
socket = io.connect();

var tasks = {}
var tasksOrder = [];
var doneTasks = [];
//getting the username from the server
socket.on('username',function(data){
    console.log("newMessage: " + data);
    $("#username").text(data);
})
//recieving the tasks from the server
socket.on('tasks',function(data){
   drawTables(data, "#todo-list-table")
});
//getting the tasks that are done from the server
socket.on('tasks-done',function(data){
    drawTables(data,"#todo-list-done")
});


/**
 * @function {draw both of the tables}
 * @param {*an object full of tasks} data 
 * @param {*html id of the tables} id 
 */
function drawTables(data, id){
    //clearing the html from the table
    $(id).html("");
    //looping through the tasks
    data.forEach(function(task){
        tasks[task.task_id] = task;
        //creating the jquery list item adding the text and the id as an attr
        var tableRow = $("<li>").attr('data-task-id',task.task_id).addClass("list-group-item todo-item").append(
            $("<a>").attr("href","#").append($("<h3>").html(task.task_heading))
        )
        $(id).append(tableRow);
    });
};

//function for when the server has finished the update
socket.on('updateDone',function(data){
    $("#update-todo-modal").modal("hide");
    //getting all of the tasks
    getTasks();
});

$(document).ready(function(){
    //creating the sortabel table on the todo list and done todo list
    $("#todo-list-table, #todo-list-done").sortable(
        {connectWith: ".connectedTable",
         dropOnEmpty:true});
    //function for when the li has stopped being moved
    $(".connectedTable").on("sortstop",function(event, ui){
        //allowing the user to save the order
        $("#save-order").removeClass("disabled");
        //updating the tasks so that they are in the right order
        tasksOrder = $("#todo-list-table").sortable("toArray", {attribute:"data-task-id"});
        doneTasks = $("#todo-list-done").sortable("toArray",{attribute:"data-task-id"});
    });

    //sending off for the username from the server
    socket.emit("home",{message:"logged in"});
    //when the create button is clicked
    $("#create-btn").on("click",function(){
        var title = $("#todo-title").val();
        var notes = $("#todo-notes").val();
        //sending the title and notes to the server
        //if the button isn't disabled then the order has been changed
        if($("#save-order").hasClass("disabled"))
        {socket.emit("newTask",{Title:title,Notes:notes});}
        else{if(confirm("You have an unsaved order do you want to continue with the transaction?")){
                 socket.emit("newTask",{Title:title,Notes:notes});}
            }
      
    });
    //when the list item is clicked
    //setting the values of the update modal and setting the id to the data-id attr on the button. 
    $("body").on("click",".todo-item",function(){
        var id = $(this).attr("data-task-id");
        var task = tasks[id]
        $("#update-todo-modal").modal("show");
        $("#update-todo-title").val(task.task_heading);
        $("#update-todo-notes").val(task.task_description);
        $("#update-todo-btn").attr('data-todo-id',id);
         $("#update-todo-btn").attr('data-done',task.done);
    });

    //function for when the save the order button is pressed
    $("#save-order").on("click",function(){
        $("#save-order").addClass("disabled");
        var data = {tasks:tasksOrder,doneTasks:doneTasks};
        socket.emit("reorderTasks",data);
    });

    //function for when the update is confirmed. 
    $("#update-todo-btn").on("click",function(){
        //todo: remove update-todo-modal and user the same modal for update and create
        var task = {};
        task.$task_heading =  $("#update-todo-title").val();
        task.$task_description = $("#update-todo-notes").val();
        task.$task_done = $(this).attr("data-done");
        task.$task_id = $(this).attr("data-todo-id");
         //if the button isn't disabled then the order has been changed
        if($("#save-order").hasClass("disabled"))
        {socket.emit('updateTask',task);}
        else{if(confirm("You have an unsaved order do you want to continue with the transaction?")){
                socket.emit('updateTask',task);}
            }
        
    });
     getTasks();
});

//function for getting the tasks
function getTasks(){
    socket.emit("getTasks","get tasks");
   
    
};
