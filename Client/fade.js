/**
 * Created by sc on 20/09/2016.
 * An Object for fading from one colour to another color in an amout of steps;
 * takes two hex colours 
 */

function Fade(startColour,endColour,totalSteps,jqueryObjectString) {
    this.start = startColour;
    this.end = endColour;
    this.steps = totalSteps;
    this.Object = jqueryObjectString;
    this.position
    this.FadeStep = function () {
        var Difference = {};
        var colors = this.colourInts();
        var step;
        var CurrentStep = {};
        //geting all of the diffrerences between the R G and B
        Difference["R"] = colors["endInt"].R - colors["startInt"].R;
        Difference["G"] = colors["endInt"].G - colors["startInt"].G;
        Difference["B"] = colors["endInt"].B - colors["startInt"].B;
        //initing the current step of colour
        //adding the step to the starting color;
        CurrentStep["R"] = colors["startInt"].R + (Math.floor(Difference["R"] / this.steps) * this.position + 1);
        CurrentStep["G"] = colors["startInt"].G + (Math.floor(Difference["G"] / this.steps) * this.position + 1);
        CurrentStep["B"] = colors["startInt"].B + (Math.floor(Difference["B"] / this.steps) * this.position + 1);
        this.position ++;
        this.AddColour(CurrentStep);
    };
    this.colourInts = function() {
        //converting the starting colour to a number
        var startInt = {
            RGB: this.start,
            R: parseInt(this.start.slice(1, 3), 16),
            G: parseInt(this.start.slice(3, 5), 16),
            B: parseInt(this.start.slice(5, 7), 16)
        };
        //converting the end colour to integers
        var endInt = {
            RGB: this.end,
            R: parseInt(this.end.slice(1, 3), 16),
            G: parseInt(this.end.slice(3, 5), 16),
            B: parseInt(this.end.slice(5, 7), 16)
        }
        return {
            "startInt": startInt,
            "endInt": endInt
        };
    };
    //function for the changing of the colours over a certain time
    this.AddColour = function(Colour) {
        var colourString = "#"
        var colourString = colourString + (Colour["R"]).toString(16);
        var colourString = colourString + (Colour["G"]).toString(16);
        var colourString = colourString + (Colour["B"]).toString(16);
        $(this.Object).css("background-color", colourString);
    };
};