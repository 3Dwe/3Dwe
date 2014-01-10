/**
 * Created by Sean on 11/27/13.
 */

var TVObject = new TVObject();

function TVObject() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    /********************************* PUBLIC INSTANCE VARIABLES *********************************/

    this.isLoaded = false;
    this.group = new THREE.Object3D();

    /*************************************** PRIVATE VARIABLES **************************************/

    var that = this;    // to reference TVObject in functions that override 'this'
    var TV_set, screen; //TV & screen objects
    var video, videoTexture;
    var play_panel, play_buttons = [], buttons = [];
    var dir = '/images/newbuttons/';
    var isPlaying = false;
    var seekValue = 0; //determines how fast the user is rewinding or fast-forwarding the video
    var recording = false, recordRTC = null; //webcam recording variables
    var light, pointLight; //light variables
    var modelElements = [];

    this.load = function()
    {
        currentDirectory = '/Home';
//        openDir('Videos');

        initOptions();
        initGeometry();
        initLights();
        initGroup();

        this.isLoaded = true;
    }

    this.unload = function ()
    {
        CORE.disposeSceneElements(modelElements);

        navigate('/Home');
        isPlaying = false;
        this.isLoaded = false;
    }

    this.onDocumentMouseDown = function(event){
        event.preventDefault();

        var object;
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        CORE.projector.unprojectVector(vector, CORE.camera);
        var raycaster = new THREE.Raycaster(CORE.camera.position, vector.sub(CORE.camera.position).normalize());
        var intersects = raycaster.intersectObjects(CORE.intersectObjects);

        // if you clicked on something
        if (intersects.length > 0) {
            object = intersects[ 0 ].object;
            if (object === play_buttons[0]){ //FAST FORWARD
                seekValue = 1;
            }else if (object === play_buttons[3]){ //REWIND
                seekValue = -1;
            }else{
                var index = isButton(object);
                if (index && video){
                    buttons[index-1].action();
                    buttons[index-1].on = !buttons[index-1].on;
                    redrawButton(object, buttons[index-1]);
                }
            }
        }
    }

    this.onDocumentMouseUp = function(event){
        event.preventDefault();
        seekValue = 0;
    }

    this.onDocumentMouseMove = function(event){
        event.preventDefault();

        var object;
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        CORE.projector.unprojectVector(vector, CORE.camera);
        var raycaster = new THREE.Raycaster(CORE.camera.position, vector.sub(CORE.camera.position).normalize());
        var intersects = raycaster.intersectObjects(CORE.intersectObjects);

        // if you clicked on something
        if (intersects.length > 0) {
            object = intersects[ 0 ].object;
            if (object === play_panel || isButton(object))
                that.showPlayer();
            else
                that.hidePlayer();
        }
        else
            that.hidePlayer();
    }

    function isButton(object){
        for (var i = 0; i < play_buttons.length; i++){
            if (object === play_buttons[i])
                return i+1; //return offset of 1 from index (always positive -> true)
        }
        return 0; //false
    }

    this.hidePlayer = function(){
        for (var i = 0; i < play_buttons.length; i++){
//            CORE.scene.remove(play_buttons[i]);
            that.group.remove(play_buttons[i]);
        }
    }

    this.showPlayer = function(){
        for (var i = 0; i < play_buttons.length; i++){
//                CORE.scene.add(play_buttons[i]);
            that.group.add(play_buttons[i]);
        }
    }

    /**
     * initializes and adds the group of objects to the scene
     */
    function initGroup(){
        CORE.scene.add(that.group);
        that.group.rotation.y = Math.PI;
        that.group.position.z = -500 + 30;
        that.group.position.y = 45;
        that.group.position.x = -60;
        that.group.scale.set(3,3,3);
    }

    /**
     * initializes the TV set and screen objects and add to the scene
     */
    function initGeometry() {
        var loader = new THREE.JSONLoader();
        var callbackModel   = function( geometry, materials ) {
            TV_set = CORE.loadModel( geometry, materials, 0, 0, 0, false );
            modelElements.push(TV_set);
            that.group.add(TV_set);
        };
        loader.load( "/obj/tv.js", callbackModel );

        var WIDTH = 78, HEIGHT = 43;
        screen = new THREE.Mesh(
            new THREE.PlaneGeometry(WIDTH, HEIGHT, 10, 10),
            new THREE.MeshPhongMaterial({color: 0xFFFFFF}));
        screen.receiveShadow = true;
        screen.rotation.y = Math.PI;
        screen.position.x = -11;                  // align to screen
        screen.position.z = -1;                   // move in front
        screen.position.y = 35;                   // move it up
        CORE.scene.add(screen);
        CORE.intersectObjects.push(screen);
        modelElements.push(screen);
        that.group.add(screen);

        video = document.createElement('video');
        video.width = WIDTH;
        video.height = HEIGHT;

        videoTexture = new THREE.Texture(video);
        loadScreen(); //load screen material
    }

    /**
     * initialize the light objects
     */
    function initLights() {
        light = new THREE.SpotLight();
        light.position.set(0, 200, -50);
        light.intensity = 2.0;
        light.castShadow = true;
        CORE.scene.add(light);
        modelElements.push(light);

        pointLight = new THREE.PointLight(0x333333, 4, 150);
        pointLight.position.set(-30,20,-40);
//        CORE.scene.add(pointLight); //currently not used, too bright
        modelElements.push(pointLight);
        that.group.add(pointLight);
    }

    /**
     * renders the video and updates the position when seeking
     */
    this.renderVideo = function() {
        if (video.readyState === video.HAVE_ENOUGH_DATA){
            videoTexture.needsUpdate = true;
        }
        if (seekValue)
            video.currentTime+=seekValue;
    }

    /**
     * loads the video material onto the screen
     */
    function loadScreen(){
        var videoMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0xdddddd, //give it some specular reflectance
            shininess: 30,
            ambient: 0x0000a1,
            emissive: 0x001533,
            map : videoTexture,
            side: THREE.DoubleSide
        });
        screen.material = videoMaterial;
    }

    /**
     * loads the specified video file
     * @param filename the absolute path of the video file
     */
    this.loadVideo = function(filename){
        isPlaying = false;
        video.autoplay = false;
        video.muted = false;
        video.src = filename;
        videoTexture = new THREE.Texture(video);
        loadScreen();
        resetButtons();
    }

    /**
     * loads webcam data and streams it to a video object which can be displayed on the screen
     */
    this.loadWebcam = function(){
        navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;
        navigator.getUserMedia({"video":true, "audio": false},
            function(stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
                isPlaying = true;
                videoTexture = new THREE.Texture(video);
                loadScreen();
                that.recordVideo(stream);
            },
            function(err) {
                alert("Camera Error");
                console.log(err);
            }
        );
    }

    /**
     * records video from the webcam. TODO: Issue in Firefox
     * @param stream the webcam data stream
     */
    this.recordVideo = function(stream){
        var options = {
            type: 'video',
            video: {
                width: 320,
                height: 240
            },
            canvas: {
                width: 320,
                height: 240
            }
        };
        recordRTC = RecordRTC(stream, options);
        recordRTC.startRecording();
    }

    /**
     * end the recording and open it in a new tab
     * TODO: save the recording to a /Home/Webcam directory
     */
    this.endRecording = function(){
        recordRTC.stopRecording(function(videoURL) {
            window.open(videoURL);
        });
    }



    this.playVideo = function(){
        if (video)
            video.play();
    }

    this.pauseVideo = function(){
        if (video)
            video.pause();
    }

    function redrawButton(button_obj, button){
        if (button.next_img && button.on){
            var button_texture = new THREE.ImageUtils.loadTexture(dir + button.next_img, {}, function () {
                CORE.renderer.render(CORE.scene, CORE.camera);
            });
            button_obj.material.map = button_texture;
        }else if (button.next_img){
            var button_texture = new THREE.ImageUtils.loadTexture(dir + button.img, {}, function () {
                CORE.renderer.render(CORE.scene, CORE.camera);
            });
            button_obj.material.map = button_texture;
        }
    }

    function initOptions(){
        var button_texture, temp_button;
        var BUTTON_WIDTH = 5, BUTTON_HEIGHT = 5, BASE_X = -25, BUTTON_Y = 18, BUTTON_Z = -1.1;

        buttons = [
            {img: 'forward.png', action: function(){}},
            {img: 'volon.png', next_img: 'mute.png', on:false, action: function(){
                video.muted = !this.on;
            }},
            {img: 'play.png', next_img: 'pause.png', on: false, action: function(){
                if (!this.on){
                    video.play();
                    isPlaying = true;
                }else{
                    video.pause();
                    isPlaying = false;
                }
            }},
            {img: 'back.png', action: function(){}},
            {img: 'record.png', next_img: 'recordon.png', on: false, action: function(){
                if (this.on){
                    that.endRecording();
                    recording = false;
                }else{
                    that.loadWebcam();
                    recording = true;
                }
            }}];
        play_buttons = [];

        play_panel = new THREE.Mesh(
            new THREE.PlaneGeometry(15.5*BUTTON_WIDTH, 1.7*BUTTON_HEIGHT, 10, 10),
            new THREE.MeshPhongMaterial({color: 0x555555}));
        play_panel.receiveShadow = true;
        play_panel.rotation.y = Math.PI;
        play_panel.position.set(BASE_X+14, BUTTON_Y, BUTTON_Z+0.1);
        play_panel.visible = false;
//        CORE.scene.add(play_panel);
        CORE.intersectObjects.push(play_panel);
        modelElements.push(play_panel);
        that.group.add(play_panel);

        for (var i = 0; i < buttons.length; i++){
            button_texture = new THREE.ImageUtils.loadTexture(dir + buttons[i].img, {}, function () {
                CORE.renderer.render(CORE.scene, CORE.camera);
            });
            temp_button = new THREE.Mesh(
                new THREE.PlaneGeometry(BUTTON_WIDTH, BUTTON_HEIGHT, 10, 10),
                new THREE.MeshPhongMaterial({map: button_texture, transparent: true, opacity: 0.8}));
            temp_button.receiveShadow = true;
            temp_button.rotation.y = Math.PI;
            temp_button.position.set(BASE_X + i*BUTTON_WIDTH + i, BUTTON_Y, BUTTON_Z);
//            CORE.scene.add(temp_button);
            CORE.intersectObjects.push(temp_button);
            modelElements.push(temp_button);
            play_buttons.push(temp_button);
            that.group.add(temp_button);
        }
    }
    function resetButtons(){
        for (var i = 0; i < buttons.length; i++){
            buttons[i].on = false;
            redrawButton(play_buttons[i], buttons[i]);
        }
    }
}