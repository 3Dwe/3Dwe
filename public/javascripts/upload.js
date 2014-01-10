/*
  created by Peng 11/28/13
*/


//uploadify ajax call for file upload, can upload any type of file depend on file extensions

// $(function() {

//     $('#file_upload').uploadify({
//         'swf' : '/uploadify.swf',
//         'uploader' : '/uploadifyhandler',
//         // Your options here
//         'fileTypeExts' : '*.gif; *.jpg; *.png; *.txt; *.wmv; *.mp3; *.mp4; *.MOV; *.PDF; *webm;',
//         'buttonText' : 'Choose text',
//         'removeCompleted' : true,
//         'multi' : true
//       });
//     });



$(document).ready(function() {
 
    status('Choose a file :)');
 
    // Check to see when a user has selected a file


    $('#uploadForm').change(function() {    //jquery id selector for button to upload
      $(this).submit();
    });
 
    $('#uploadForm').submit(function() {
        status('uploading the file ...');
 
        $(this).ajaxSubmit({                 //ajax call to submit                                                                                             
 
        error: function(xhr) {
            status('Error: ' + xhr.status);   //error callback
        },
 
        success: function(response) {
     
          if(response.error) {                  //show error
              status('Oops, problem occured while uploading');
              return;
          }
   
          var OnServer = response.path;
   
          status('Success, file uploaded to:' + OnServer);    //file uploaded successdully
          showSubfolders(currentDirectory);
        }

      });
                                                                                                                     
      return false;
    });
 
    function status(message) {        //show message on console
      console.log(message);
    }
});
