var socket;
socket = io.connect();
var colours = {};
var tasks = {}
var tasksOrder = [];
var doneTasks = [];
var categories = {};
//getting the username from the server
socket.on('username',function(data){
    console.log("newMessage: " + data);
    $("#username").text(data);
})
//recieving the tasks from the server
socket.on('tasks',function(data){
   drawTables(data, "#todo-list-table",false)
});
//getting the tasks that are done from the server
socket.on('tasks-done',function(data){
    drawTables(data,"#todo-list-done",true)
});
//calling the get colours func
getColours();

//recieving the colours from the database
socket.on('colours',function(data){
    //Clearing the 
    $("#todo-category-colour").html("");
    data.forEach(function(colour){
        colours[colour.colour_id] = colour;
        $("#todo-category-colour").append(
           $("<option>").attr({value:colour.colour_id,"data-colour-code":colour.colour_code})
                        .html("<div style='height:5px;width:5px;background-color:"+ colour.colour_code+";'></div> " + colour.colour_text));
    })
});

getCategories();

//recieving the categories from the database and appending to the lists
socket.on('categories',function(data){
  drawCategoriesNewItem(data);
})

//function for the drawing of the categories 
//@param {the categories recieved from the database} data
function drawCategoriesNewItem(data){
    $("#todo-item-category, #update-item-category").html("");
    $("#category-list").html("");
    data.forEach(function(category){
        $("#category-list").append(
            $("<li>").append('<i class="fa fa-trash pull-right category-delete-btn" data-category-id="'+ category.category_id + '" ></i>  ' + category.category_name +'').css({"text-align":"left","background-color":category.colour_code}).addClass("list-group-item")
        );
        categories[category.category_id] = category;
        //apending the category to the select
        $("#todo-item-category, #update-item-category").append(
            $("<option>").attr({"value":category.category_id,}).text(category.category_name)
        );
    });  
}

/**
 * @function {draw both of the tables}
 * @param {*an object full of tasks} data 
 * @param {*html id of the tables} id 
 * @param {*if the task is done} done
 */
function drawTables(data, id,done){
    //clearing the html from the table
    $(id).html("");
    //looping through the tasks
    data.forEach(function(task){
        tasks[task.task_id] = task;
        let dateString;
        
        if(!done){
            let dateFromDb = moment(task.date_added,"YYYY:MM:DD");
            let dateToday = moment();
            dateString = dateToday.diff(dateFromDb,'days') + " Days since created";
        }
        else{
            dateString = "Completed on " + moment(task.date_done,"YYYY:MM:DD").format("Do MMM YY");
        }
        //creating the jquery list item adding the text and the id as an attr
        var tableRow = $("<li>").attr('data-task-id',task.task_id).addClass("list-group-item todo-item").append(
            $("<a>").attr("href","#").append($("<h4>").html(task.task_heading))
        ).append(dateString);
        //if there is a category then add the colour 
        if(task.category_id != "undefined" && task.category_id != "null" && task.category_id != ""){
            let colourCode = categories[task.category_id].colour_code;
            tableRow.css("background-color",colourCode);
        }
        $(id).append(tableRow);
    });
};

//function for when the server has finished the update
socket.on('updateDone',function(data){
    $("#create-todo-modal").modal("hide");
    $("#update-todo-modal").modal("hide");
    $("#todo-category-modal").modal("hide");
    //getting all of the tasks
    clearModals();
    getColours();
    getCategories();
    getTasks();   
    
});

function clearModals(){
   let textBoxes  = ["#todo-notes","#todo-title","#todo-category-title","#todo-category-colour"]
    for(let i = 0; i < textBoxes.length; i++){
        $(textBoxes[i]).val("");
    }
}

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

    $("body").on("click","#todo-category-colour option",function(e){
        $("#preview-li").css("background-color", $(this).attr("data-colour-code"));
     });

    //sending off for the username from the server
    socket.emit("home",{message:"logged in"});
   
    //when the list item is clicked
    //setting the values of the update modal and setting the id to the data-id attr on the button. 
    $("body").on("click",".todo-item",function(){
        var id = $(this).attr("data-task-id");
        var task = tasks[id]
        $("#update-todo-modal").modal("show");
        $("#update-todo-title").val(task.task_heading);
        $("#update-todo-notes").val(task.task_description);
        $("#update-item-category").val(task.category_id);
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
        task.task_heading =  $("#update-todo-title").val();
        task.task_description = $("#update-todo-notes").val();
        task.task_done = $(this).attr("data-done");
        task.task_id = $(this).attr("data-todo-id");
        task.category_id = $("#update-item-category").val();
        checkSaveButton("updateTask",task)        
    });

     //when the create button is clicked
     $("#create-btn").on("click",function(){
        var title = $("#todo-title").val();
        var notes = $("#todo-notes").val();
        var category = $("#todo-item-category").val();
        //sending the title and notes to the server
       checkSaveButton("newTask",{title:title,notes:notes,category:category});
            
      
    });
    //creating a new category
    $("#create-todo-category-btn").on("click",function(){
        let category = {};
        category.$category_name = $("#todo-category-title").val();
        category.$category_colour = $("#todo-category-colour option:selected").val();
         //if the button isn't disabled then the order has been changed
        checkSaveButton("createCategory",category);
    });
     getTasks();
     
     //handling the delete button  click for the deletion of the category
     $("body").on("click",".category-delete-btn",function(){
        var category_id = $(this).attr("data-category-id");
        socket.emit("deleteCategory",category_id);
     });
     

  
     
});

//function for checking if the save button is enabled and giving a warning to the user who has an unsaved order on the page.
//emit is the socket message and data is the socket data
function checkSaveButton(emitMessage,data){
    //if the button isn't disabled then the order has been changed
    if($("#save-order").hasClass("disabled"))
    {socket.emit(emitMessage,data);}
    else{if(confirm("You have an unsaved order do you want to continue with the transaction?")){
            socket.emit(emitMessage,data);}
        }

}

function getCategories(){
    socket.emit("getCategories");
}

function getColours(){
    socket.emit("getColours");
}
//function for getting the tasks
function getTasks(){
    socket.emit("getTasks","get tasks");
   
    
};
