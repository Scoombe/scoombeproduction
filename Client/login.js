var socket;
socket = io.connect();

socket.on('login_error',function(data){
    console.log("newMessage: " + data);
    $(".alert").text(data);
    $(".alert").removeClass("hidden");

})
$(document).ready(function(){
    socket.emit("start",{message:"starting"});
    $("#login-button").on("click",function(e){
        socket.emit("login",{message:"logging in"});
    });
});