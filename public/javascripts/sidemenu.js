/**
 * Created by Sean Noran on 11/2/13.
 * Contributors: Wei Lin, Peng Gao, Aibek Sarbayev, Swetal Bhatt
 */


/******************************************LISTEN FOR SERVER RESPONSE*******************************************/

var currentDirectory;
var specialRequest = "";
var socketBusy = false;

window.onload = function() {
    currentDirectory = $('.h_node').last().attr('id');

    //user navigated to a folder
    CORE.socket.on('showfiles', function (data) {
        var files = data.files;
        $('#folder_contents').html(''); //clear display
        if(files.length) {
            for (var i = 0; i < files.length; i++){
                if(data.isDir[i]){
                    $('#folder_contents').append('<div class = "subfolder" id = "' + files[i] + '"><img src = "../img/folder.png"/><h5>'  + files[i] + '</h5></div>');
                }else{
                    $('#folder_contents').append('<div class = "subfile" id = "' + files[i] + '"><img src = "../img/text.png"/><h5>'  + files[i] + '</h5></div>');
                }
            }
            initSubfolder(); //make clickable

            if (specialRequest === JUKEBOX.request.LOADSONGS){
                loadSongs(currentDirectory);
                console.log("loading songs...");
            }
            if (specialRequest === ALBUM.request.LOADPHOTOS){
                loadPhotos(currentDirectory);
            }


         } else {
            $('#folder_contents').append("<div>No Available Files/Folders</div>");
         }
    });

    //display status msg
    CORE.socket.on('status', function(data){
        statusMessage(data.status, data.isError);
    });
    initClick();
}

/*************************INITIALIZE CLICK EVENTS FOR NEWLY ADDED DOM OBJECTS****************************/

//initializes the click events for all subfolders/files
function initSubfolder(){
    //if the user clicks on a subfolder, add the navigation node & navigate to that folder
    $('.subfolder').click(function(){
        $('#file_input').val(this.id); //change the value of the text field for adding the node
        openDir($('#file_input').val()); //add the node
    });

    //place in initSubfolder():
    $('.subfile').click(function(e){
        var filename = this.getAttribute("id");
//        var dirPath = $('.h_node').last().attr('id');
        var extension = filename.split('.').pop();
        if (extension === 'mp3'){
            JUKEBOX.changeSong(currentDirectory + '/' + filename);
        }else if (extension === 'mp4' || extension === 'MOV' || extension === 'webm'){
            TVObject.loadVideo(currentDirectory + '/' + filename);
        }else if (extension === 'pdf'){
            alert("It's a PDF!");
        }else if (extension === 'jpg'){
            ALBUM.changePhoto(currentDirectory + '/' + filename);
        }else if (extension === 'txt'){
            alert("It's a text!");
        }
    });
}

//initializes click events for all navigation (h) nodes
function initClick(){
    //if the user clicks on a node, navigate to that folder:
    $('.h_node').click(function(e){
        navigate(this.id);
        e.preventDefault(); //in case the user right-clicks
    });

    //show subfolders of the current folder:
//    showSubfolders($('.h_node').last().attr('id'));
    showSubfolders(currentDirectory);
    rightClick();
}

/****************************************DISPLAY FOLDERS/FILES********************************************/

function navigate(path){
//    var path = node.id + "/";
    console.log("navigating:" + path);
    currentDirectory = path;
    $('[id*="' + currentDirectory + '"]').each(function(){
        if (this.id !== path)
            this.remove();
    });
    showSubfolders(currentDirectory); //show subfolders of the selected folder
}

//displays the subfolders in the specified folder
function showSubfolders(path){
    var files = [];
    CORE.socket.emit('showdir', { dir: path, files: files });
}

//navigates to the folder specified by the text field
var openDir = function(filename){
    console.log("Opening DIR: " + filename);
    if (filename.trim()){ //check if not empty (might extend)
//        var path = $('.h_node').last().attr('id') + "\/" + filename;
        var path = currentDirectory + "\/" + filename;
        $("#hierarchy").append('<li id = "' +  path + '"class = "h_node"><a href="#" style="z-index:8;">' + filename + '</a></li>');
        currentDirectory = path;
        console.log(path);
        initClick(); //re-initialize click events so that the newly added node will be clickable
    }
};

/**********************************CREATE & DELETE FILES/FOLDERS******************************************/

var createDir = function(){
    var filename = $('#file_input').val();
    if (filename.trim()){ //check if not empty (might extend)
//        var path = $('.h_node').last().attr('id') + "\/" + filename;
        var path = currentDirectory + "\/" + filename;
        //SUBMIT:
        CORE.socket.emit('mkdir', { dir: path });
        statusMessage("Created folder: " + filename);
    }else{
        statusMessage("Invalid file name...", true);
    }
};

//delete the current directory
var deleteDir = function(path){
    CORE.socket.emit('deletedir', { dir: path });
};

/*****************************************CLICK EVENTS*************************************************/

//create the directory when the user presses enter or clicks on the submit button:
$("#createDir").click(function(e){
    createDir();
//    var currentDirectory = $('.h_node').last().attr('id');
    var dir = $('#file_input').val();


    showSubfolders(currentDirectory);

    $('#file_input').val('');
});

//hide menu
$("#menu-close").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

//toggle menu
$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#sidebar-wrapper").toggleClass("active");
});

//open options for creating directory
$("li .create_directory").click(function(e){
    $("form").toggle();
    $('#file_input').focus();
});

// ---------------------------------------------------------------------------


// ********************* LOADING MEDIA ******************************

// load songs from the directory
function loadSongs(directory)
{
    console.log("loading songs:");
    console.log(specialRequest);
    var collection = $('#folder_contents > .subfile');
    console.log(collection.length);
    collection.each(function(){
        JUKEBOX.songs.push(currentDirectory + '/' + this.id);
    });
    JUKEBOX.changeSong(JUKEBOX.songs[JUKEBOX.currentSongID]);
    specialRequest = '';
    navigate('/Home');
    socketBusy = false;
    console.log(specialRequest);
}

//save data to file:
function writeFile(data){
    CORE.socket.emit('writeFile', {dir: currentDirectory + "/myvideo.webm", fileData: data});
}

function loadPhotos(directory)
{
    console.log("loading photos:");
    console.log(specialRequest);
    var collection = $('#folder_contents > .subfile');
    console.log(collection.length);
    collection.each(function(){
        ALBUM.photos.push(currentDirectory + '/' + this.id);
    });
    console.log(ALBUM.photos);
    ALBUM.initPhotos();
    specialRequest = '';
    navigate('/Home');
    socketBusy = false;
    console.log(specialRequest);
}
