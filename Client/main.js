    $(document).ready(function(){
        //creating a mo.js circle
        //number of minutes * seconds in a minute * millieseconds in second
        var timeout = 25 * 60 * 1000;
        // var setTimoutObject;
        var interval = 1000;
        //the amount of time for break
        var breakTime;
        var bodyFade = new Fade("#48f442", "#f46e41",timeout / 1000, "body");
        const circle = {
            shape:'circle',
            stroke:'cyan',
            radius:'100',
            fill:         'none',
            id: 'circle',
            duration:     timeout,
            strokeDasharray: '100%',
            strokeDashoffset: {'100%':'0%'},
        }
        circle.fade = bodyFade;
        circle.FinshedRunning = function(){
            setTimeout(function() {
                done()
            }, timeout);
        };
        circle.timeoutDuration =  timeout;
        circle.interval =  setInterval(function(){
                //taking off a second of the timeout
                circle.timeoutDuration = circle.timeoutDuration - interval;
                intervalFunc();
            }, interval);

        //function that is called when the timeout has ellapsed
        function done(){
            clearInterval(circle.interval);
        }   
        function intervalFunc(){
            $("#clock-header-text").html(millisToMinutesAndSeconds(circle.timeoutDuration));
            if(circle.timeoutDuration  < 2){
                timeoutFunc();
            }
            bodyFade.FadeStep();
        }
    function millisToMinutesAndSeconds(millis) {
            var minutes = Math.floor(millis / 60000);
            var seconds = ((millis % 60000) / 1000).toFixed(0);
            return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;``
        }


    //showing the modal 
    $("#startModal").modal("show");
    $('#startModal').modal({    
        backdrop: 'static',
        keyboard: false
    });   

    $('#startModal').on('hidden.bs.modal', function () {
        var goal = $("#workGoal").val();
        var workTime = $("#workTime").val();
        var breakTime = $("#breakTime").val();

        if(goal.length == 0 || workTime < 1 || breakTime < 3){
            $("#startModal").modal("show");
        }
        else{
             $("#startModal").modal("hide");
             timeout = workTime * 60 * 1000; 
             circle.timeoutDuration = timeout;
        }
    });

    $("#start-btn").on("click", function(){
         $("#startModal").modal("hide");
        $("div[data-name='mojs-shape']").attr("id","clock-div");
        var textDiv = $("<div>").attr({id:"clock-text", class:"text-centered"});
        var clockH3 = $("<h3>").attr("id","clock-header-text");
        textDiv.html(clockH3);
        $("#clock-div").append(textDiv);
        $(".centered-div").css({left:($(window).innerWidth()/2) - $(".centered-div").width()/2,top:($(window).innerHeight() /2)- $(".centered-div").height()})
        circle.timeoutDuration = timeout;
        circle.FinshedRunning();
        //circle.interval();
        var fade = new Fade()
    });

 function timeoutFunc(){
    clearInterval(circle.interval);
     $("#clock-header-text").html("Finished Running: Start Break");
     $("#clock-header-text").attr("data-finished","True");
}

$(document).on("click","#clock-header-text",function(){
    if($("#clock-header-text").attr("data-finished") == "True"){
        $("#startModal").modal("show");
    }
});

});
//TODO create a circle that is animated
// needs to pause when start
// another part of the circle should be called after a timeout, otherwise you will be stuck in a massive loop
//this needs to be able to be paused 
//it needs to be able to change the settings of the timeout
//it needs to connect thorugh socket.js to the server and the server should store information about the timeout 
//for example what the user was working towards and did the user finish it. 
//the initial update should be the user details and the goal
//and then the finished option should be checked



//function handling the clicking of the pay button
// $("#play-btn").on("click",function(){
//     circle.play();
//     setTimoutObject = setTimeout(timeoutFunc,timeout);
// })

//function called when the button is finished

//  function handling the pausing of the 
// function circleOnClick(){
//     circle.pause();
    
// }
