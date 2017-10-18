var socket;
socket = io.connect();

var tasks = {};
socket.on('username',function(data){
    console.log("newMessage: " + data);
    $("#username").text(data);
})

socket.on('tasks',function(data){
    $("#todo-list-table").html("");
    data.forEach(function(task) {
        tasks[task.task_id] = {task_heading:task.task_heading, task_description:task.task_description,task_done:task.done};
        var tableRow = $("<li>").attr('data-task-id',task.task_id).addClass("list-group-item todo-item").append(
            $("<a>").attr("href","#").append($("<h3>").html(task.task_heading))
        )
        $("#todo-list-table").append(tableRow);
    });
});

socket.on('updateDone',function(data){
    $("#update-todo-modal").modal("hide");
    getTasks();
});

$(document).ready(function(){
    
   var table = document.getElementById('todo-list-table');
   var sortable = Sortable.create(table);
    socket.emit("home",{message:"logged in"});
    $("#create-btn").on("click",function(){
        var title = $("#todo-title").val();
        var notes = $("#todo-notes").val();
        socket.emit("newTask",{Title:title,Notes:notes});
    });
    $("body").on("click",".todo-item",function(){
        var id = $(this).attr("data-task-id");
        var task = tasks[id]
        $("#update-todo-modal").modal("show");
        $("#update-todo-title").val(task.task_heading);
        $("#update-todo-notes").val(task.task_description);
        $("#update-todo-done").prop('checked',task.task_done);
        $("#update-todo-btn").attr('data-todo-id',id);

    });
    
    $("#update-todo-btn").on("click",function(){
        var task = {};
        task.$task_heading =  $("#update-todo-title").val();
        task.$task_description = $("#update-todo-notes").val();
        task.$task_done = $("#update-todo-done").prop('checked');
        task.$task_id = $(this).attr("data-todo-id");
        socket.emit('updateTask',task);
    });

     getTasks();
})

function getTasks(){
     socket.emit("getTasks","get tasks");
};
function getTask(){

}
