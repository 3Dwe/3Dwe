/**
 * Created by Peng on 11/28/13.
 *
*/

    
var ALBUM = new ALBUM();             //new scene for album

function ALBUM() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    var that = this;

    // private variables for album object
    var albumFront;
    var albumBack;
    var frameLeftTop;
    var frameLeftBottom;
    var frameRightTop;
    var frameRightBottom;
    var floor;
    var light;

    //private varibales for album texture
    var textureLeftTop;
    var textureLeftBottom;
    var textureRightTop;
    var textureRightBottom;

    //check whether the frame/page has flipped
    var prevAction = 'forward';     

    this.currentPhotoID = 0;

    var albumLoaded = false;
    var currentLeftTop = 0;

    var modelElements = [];

    this.isLoaded = false;

    //group album objects in to 3D
    this.group = new THREE.Object3D();

    //array of photos from file system
    this.photos = [];

    //load photos from the file system
    this.request = {LOADPHOTOS: 'loadphotos'};

    this.load = function ()         //load the album scene
    {
        initGeometry();
        initLights();

        CORE.scene.add(that.group);
        that.group.position.set(-310, 83, 265);
        that.group.rotation.y = - Math.PI / 4;

        tryLoadPhotos();

        this.isLoaded = true;
    }

    // send request to socket.io to load photos
    function tryLoadPhotos ()       //show that album scenw has been loaded correctly with photos
    {
        if (socketBusy)             //load photos failes
        {
            console.log("I'm busy, photo album!!!");
            setTimeout(tryLoadPhotos, 500);
        }
        else
        {
            socketBusy = true;                             //load photos correctly from file directory
            specialRequest = that.request.LOADPHOTOS;
            currentDirectory = '/Home';
            openDir('/Photos');
        }
    }

    this.unload = function ()                   //uload scene when done
    {
        CORE.disposeSceneElements(modelElements);

        navigate('/Home');
        this.isLoaded = false;
    }

    this.onDocumentMouseDown = function(event){         //mouse click events
        event.preventDefault();

        var object;                             //threejs function for click event
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        CORE.projector.unprojectVector(vector, CORE.camera);
        var raycaster = new THREE.Raycaster(CORE.camera.position, vector.sub(CORE.camera.position).normalize());
        var intersects = raycaster.intersectObjects(CORE.intersectObjects);

        // if you clicked on something
        if (intersects.length > 0) {

            //flip left album cover when clicked
            if (intersects[0].object === albumL) {
                clickAlbum(intersects[0].object, true, 35);
            }
                
            //flip right side frames forward when clicked
            if (intersects[0].object === frameLeftTop || intersects[0].object === frameLeftBottom ) {
                currentLeftTop = (that.photos.length + currentLeftTop - 4) % that.photos.length;
                console.log(currentLeftTop);
                flip_image(false, 35.5);
            }

            //flip left side frames backward when clicked
            if (intersects[0].object === frameRightTop || intersects[0].object === frameRightBottom) {
                currentLeftTop = (currentLeftTop + 4) % that.photos.length;
                console.log(currentLeftTop);
                flip_image(true, 35.5);
            }

        }
    }

    //initialize geometry for album scene with album model created from 3DS MAX
    function initGeometry() {
        var loader = new THREE.JSONLoader();
        var callbackModel   = function( geometry, materials ) {
            albumL = CORE.loadModel( geometry, materials, 0, 4, 0, true);
            albumL.scale.set(2,2,2);
            albumL.rotation.z = Math.PI;

            modelElements.push(albumL);
            that.group.add(albumL);
        };
        loader.load( "/obj/album-cover-left.js", callbackModel );       //album cover left model

        var callbackModel   = function( geometry, materials ) {
            albumR = CORE.loadModel( geometry, materials, 0, -2, 0, true);
            albumR.scale.set(2,2,2);
            modelElements.push(albumR);
            that.group.add(albumR);
        };
        loader.load( "/obj/album-cover-right.js", callbackModel );      //album cover right model
    }   

    this.initPhotos = function() 
    {
        currentLeftTop = -2;
        console.log("initPhotos");
        
        //frame texture for the 4 open frames
        textureLeftTop = new THREE.ImageUtils.loadTexture(getPhoto(0), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);          //render the texture upon loading
        }); 

        textureLeftTop.wrapS = textureLeftTop.wrapT = THREE.RepeatWrapping;     //wrap the texture
        textureLeftTop.repeat.set(1, 1);
        textureLeftTop.needsUpdate = true;

        textureLeftBottom = new THREE.ImageUtils.loadTexture(getPhoto(1), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        }); 

        textureLeftBottom.wrapS = textureLeftBottom.wrapT = THREE.RepeatWrapping;
        textureLeftBottom.repeat.set(1, 1);
        textureLeftBottom.needsUpdate = true;

        textureRightTop = new THREE.ImageUtils.loadTexture(getPhoto(2), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        }); 

        textureRightTop.wrapS = textureLeftTop.wrapT = THREE.RepeatWrapping;
        textureRightTop.repeat.set(1, 1);
        textureRightTop.needsUpdate = true;

        textureRightBottom = new THREE.ImageUtils.loadTexture(getPhoto(3), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        }); 

        textureRightBottom.wrapS = textureLeftTop.wrapT = THREE.RepeatWrapping;
        textureRightBottom.repeat.set(1, 1);
        textureRightBottom.needsUpdate = true;


        //initialize the 4 frames that will load the textures and add the frames to the webgl room
        frameLeftTop =  new THREE.Mesh(
            new THREE.CubeGeometry(65, 1, 43),
            new THREE.MeshLambertMaterial({map: textureLeftTop, side:THREE.DoubleSide, transparent: true, opacity: 1.0}));
        frameLeftTop.position.set(-1,1,22);             //set position in room
        frameLeftTop.rotation.z = Math.PI;              
        frameLeftTop.castShadow = false;                //no shadows needed  
        frameLeftTop.receiveShadow = false; 
//        CORE.scene.add(frameLeftTop);
        CORE.intersectObjects.push(frameLeftTop);       //make it clickable
        modelElements.push(frameLeftTop);
        that.group.add(frameLeftTop);

        frameLeftBottom = new THREE.Mesh(
            new THREE.CubeGeometry(65, 1, 43),
            new THREE.MeshLambertMaterial({map: textureLeftBottom, side: THREE.DoubleSide, transparent: true, opacity: 1.0}));
        frameLeftBottom.position.set(-1,1,-24);
        frameLeftBottom.rotation.z = Math.PI;
        frameLeftBottom.castShadow = false;
        frameLeftBottom.receiveShadow = false;
//        CORE.scene.add(frameLeftBottom);
        CORE.intersectObjects.push(frameLeftBottom);        //clickable 
        modelElements.push(frameLeftBottom);
        that.group.add(frameLeftBottom);

        frameRightTop = new THREE.Mesh(
            new THREE.CubeGeometry(65, 1, 43),
            new THREE.MeshLambertMaterial({map: textureRightTop, side: THREE.DoubleSide, transparent: true, opacity: 1.0}));
        frameRightTop.position.set(-1,2.11,22);
        frameRightTop.rotation.z = Math.PI;
        frameRightTop.castShadow = false;
        frameRightTop.receiveShadow = false;
//        CORE.scene.add(frameRightTop);
        CORE.intersectObjects.push(frameRightTop);          //clickable
        modelElements.push(frameRightTop);
        that.group.add(frameRightTop);

        frameRightBottom = new THREE.Mesh(
            new THREE.CubeGeometry(65, 1, 43),
            new THREE.MeshLambertMaterial({map: textureRightBottom, side: THREE.DoubleSide, transparent: true, opacity: 1.0}));
        frameRightBottom.position.set(-1,2.11, -24);
        frameRightBottom.rotation.z = Math.PI;
        frameRightBottom.castShadow = false;
        frameRightBottom.receiveShadow = false;
//        CORE.scene.add(frameRightBottom);
        CORE.intersectObjects.push(frameRightBottom);       //clickable
        modelElements.push(frameRightBottom);
        that.group.add(frameRightBottom);
    }

    //click Album function
    function clickAlbum (object, forward, radius)       
    {
        console.log("clickAlbum");
        var angle = Math.PI;        //set angle
        
        var check = forward;        //check whether album is forward or backward
        if (check) {
            animateAlbum();
        }
        else {
            albumBack();
        }

        var startX = object.position.x;
        var startY = object.position.y;

        //album animation
        function animateAlbum()
        {
            if (angle >= 0)             //flip it according to angle of 180
            {
                object.position.x = radius + Math.cos(angle) * radius;
                object.position.y = Math.sin(angle) * radius;
                object.rotation.z = -angle;
                angle -= Math.PI/18;
                setTimeout(animateAlbum, 10);       //flip in this  amount of time
            }
            else
            {
                object.position.y = -2;             //set left album cover to position
            }
        }

        function albumBack()            //flip it back angle of 180
        {   
           if (angle >= - Math.PI)
            {
                object.position.x = radius + Math.cos(angle) * radius;
                object.position.y = -Math.sin(angle) * radius;
                object.rotation.z = -angle;

                angle = Math.PI/18;
                setTimeout(albumBack, 10);
                check = false;
            }
        }
    }


    //function to flip frames/album pages
    function flip_image(forward, radius) {

        //initlialize the pages with photos from start and render it
        textureRightTop = new THREE.ImageUtils.loadTexture(getPhoto(2), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        textureRightBottom = new THREE.ImageUtils.loadTexture(getPhoto(3), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        textureLeftTop = new THREE.ImageUtils.loadTexture(getPhoto(0), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        textureLeftBottom = new THREE.ImageUtils.loadTexture(getPhoto(1), {}, function(){
            CORE.renderer.render(CORE.scene, CORE.camera);
        });

        //map the correct textures with photos to each frame correctly
        frameLeftTop.material = new THREE.MeshLambertMaterial({map: textureLeftTop});
        frameLeftBottom.material = new THREE.MeshLambertMaterial({map: textureLeftBottom});
        frameRightTop.material = new THREE.MeshLambertMaterial({map: textureRightTop});
        frameRightBottom.material = new THREE.MeshLambertMaterial({map: textureRightBottom});

        var angle = 0;          //check whether or not clicking forward or backward
        if (forward)
            animateFrame();
        else
            animateBack();

        function animateFrame()         //animate frame when clicked with angle of 180
        {
            if (angle <= Math.PI)
            {
                //when clicked, flip both top and bottom left side frames
                frameLeftTop.position.x = radius - Math.cos(angle) * radius;
                frameLeftTop.position.y = Math.sin(angle) * radius + 3;
                frameLeftTop.rotation.z = -angle;
                frameLeftBottom.position.x = radius - Math.cos(angle) * radius;
                frameLeftBottom.position.y = Math.sin(angle) * radius + 3;
                frameLeftBottom.rotation.z = -angle;
                angle += Math.PI/18;
                setTimeout(animateFrame, 10);           //set time limit to flip
            }
        }

        function animateBack()              //anime frame when clicked with angle of 180
        {
            if (angle >= -Math.PI)
            {
                //when clicked, flip both top and bottom right side frames
                frameRightTop.position.x = radius + Math.cos(angle) * radius;
                frameRightTop.position.y = -Math.sin(angle) * radius + 3;
                frameRightTop.rotation.z = -angle;
                frameRightBottom.position.x = radius + Math.cos(angle) * radius;
                frameRightBottom.position.y = -Math.sin(angle) * radius + 3;
                frameRightBottom.rotation.z = -angle;

                angle -= Math.PI/18;
                setTimeout(animateBack, 10);
            }
        }
    }

    //initialize lights for the album
    function initLights() {
        light = new THREE.SpotLight();
        light.position.set(0, 500, 0);
        light.intensity = 2.0;
        light.castShadow = true;
        CORE.scene.add(light);
        modelElements.push(light);
    }

    //return photo from the phot file directory
    function getPhoto(offset)
    {
        return that.photos[(that.photos.length + currentLeftTop + offset) % that.photos.length];
    }
}