/**
 * Uploading method by Peng, socket and fs logic by Sean
 */

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');
var flash = require('connect-flash');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/signup',user.new);
app.get('/login',user.login);
app.post('/user/auth'  , user.auth);
app.get('/user/add_auth', user.add_auth)
app.get ('/user/main'  , user.main);
app.get ('/user/logout', user.logout);
app.get('/user/add', user.user_add);

/**
 * returns the absolute path of the specified file or folder
 * @param filename the name of the file or folder
 * @returns {string} the absolute path
 */
function getPath(filename){         //function to get filepath
    var path = String(filename);
    path = path.replace(/\//g, '\\');
    path = __dirname + "\\public" + path;   //_dirname with newly directed path
    return path;
}

app.post('/uploadHandler', function(req, res) {     //upload post method

    var allPath = "/Home";      //filepath variable to store the uploaded files
 
    var extension = req.files.userFile.name.split('.').pop();       //get extension

    //get correct folder depend on type of file from their extensions
    if (extension === 'mp3' || extension === 'MP3'){
        allPath += '/Music/' + req.files.userFile.name;
    }else if (extension === 'mp4' || extension === 'MOV' || extension === 'webm' || extension === 'wmv'){
        allPath += '/Videos/' + req.files.userFile.name;
    }else if (extension === 'pdf'){
        allPath += '/PDFs/' + req.files.userFile.name;
    }else if (extension === 'jpg' || extension === 'png' || extension === 'JPG' || extension === 'PNG'){
        allPath += '/Photos/' + req.files.userFile.name;
    }else if (extension === 'txt'){
        console.log("no txt folder");
    }

    //fs method call for file namepath
    require('fs').rename(
        req.files.userFile.path,
        getPath(allPath),
        function(error) {       //error call 
            if(error) {
                res.send({
                    error: 'Sorry, upload failed!'
                });
                return;
            }

            console.log("arrived here");        //print to console that upload success
            res.send({
                path: getPath(allPath)
            });
        }
    );
});


var io = require('socket.io').listen(app.listen(app.get('port')));
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
    console.log("Web Socket Connection Established");

    //make the directory
    socket.on('mkdir', function (data) {
        var path = getPath(data.dir);
        data.isError = false;
        if (file_exists(path)){
            data.status = data.dir + " already exists";
        }else{
            data.status = "Successfully created " + data.dir;
            fs.mkdir(path, 0777, function(err){
                if(err){
                    data.isError = true;
                    data.status = "Failed to create " + data.dir;
                }
            });

            socket.emit('dirCreated', data);
        }
        //data.isDir = fs.statSync(path).isDirectory(); //determine if directory or file
        socket.emit('status', data);
    });

    //show the directory specified in the data object:
    socket.on('showdir', function(data){
        var path = getPath(data.dir);
        if (!file_exists(path)){
            return;
        }
        if (!fs.lstatSync(path).isDirectory()){
            return;
        }
        var files = fs.readdirSync(path);

        var isDir = [];
        //check each file/folder to determine if directory
        for (var i = 0; i < files.length; i++){
            isDir[i] = fs.lstatSync(path + "/" + files[i]).isDirectory();
        }
        data.files = files;
        data.isDir = isDir;
        io.sockets.emit('showfiles', data);
    });

    //delete folder/file
    socket.on('deletedir', function(data){
        var path = getPath(data.dir);
        deleteFolder(path);
        data.isError = false;
        data.status = "Deleted " + data.dir;
        socket.emit('status', data);
    });

    //returns whether a file/folder exists:
    function file_exists(file){
        return fs.existsSync(file);
    }

    //delete folder & its contents recursively:
    //TODO: Add a prompt
    function deleteFolder(path) {
        var files = [];
        if(file_exists(path)) {
            files = fs.readdirSync(path);
            files.forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.statSync(curPath).isDirectory()) { // recursive call
                    deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

    //create file
    socket.on('writeFile', function(data){
        var path = getPath(data.dir);
        if (file_exists(path)){
            alert("File already exists!");
            return;
        }
        fs.writeFile(path, data.fileData, undefined, function(err){
            if (err) throw err;
            console.log("SUCCESS");
        });
    });
});
