$(document).ready(function(){
    $("#button-enter").click(function(){
        $.post("/enter",{say:"hi"}, function(data){
            console.log("data : "+data);
           //$(document).load(data);
        });
    });
});