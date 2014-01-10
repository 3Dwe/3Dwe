/**
 * Created by Swetal Bhatt 11/24/13.
 * Contributors: Aibek Sarbayev (retrieving songs list)
 */

var JUKEBOX = new JUKEBOX();

function JUKEBOX() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    // private variables
    var that = this;        // to reference JUKEBOX inside function that override 'this'

    // variables for the Jkekbox model parts
    var radioBody, radioSeeker;         // body and rectangle that represents seeker
    var radioPlay;                      // play button
    var radioVolume, radioPower;        // volume knob and seeker knob (named power because use for knob may change in future)
    var radioNext, radioPrev;           // next and prev buttons
    var radioReplay, radioShuffle;      // replay and shuffle buttons

    var isPlaying = false;              // state variable for when music is playing
    var isReplaying = false;            // state variable for when music replay is on
    var isShuffling = false;            // state variable for when music shuffle is on

    var vol_clicked = false;            // condition variables to distinguish dragging
    var seek_clicked = false;           // for seek and volume knobs

    var dragging, prevDrag;
    var windowHalfX, windowHalfY;

    var currentVolume;                  // variable for saving the volume
    var currentSeek;                    // variable for saving the current time

    this.currentSongID = 3;             // variable for keeping track of the current song

    var floor;
    var light, pointLight;

    var modelElements = [];
    var buttonsPressed = [];

    this.songs = [];

    this.isLoaded = false;
    // object group for transforming the jukebox in the room scene
    this.group = new THREE.Object3D();

    this.request = {LOADSONGS : 'loadSongs'};

    // function for initializing the elements from jukebox scene
    this.load = function ()
    {
        initGeometry();
        initLights();

        windowHalfX = $('viewer').width() / 2;
        windowHalfY = $('viewer').height() / 2;

        tryLoadSongs();

        //initialization to generate the audio html tag:
        var audio_html = '<audio controls id="audio" onended="JUKEBOX.autoNext()"><source id="change_audio" src="' + this.songs[this.currentSongID] + '" type="audio/mpeg"><embed height="50" width="100" src="' + this.songs[this.currentSongID] + '"></audio>' ;
        document.getElementById("test_audio").innerHTML = audio_html;
        document.getElementById('audio').volume = 0.5;
        currentVolume = document.getElementById('audio').volume;

        CORE.scene.add(that.group);
        that.group.position.set(480,85,0);
//        that.group.position.set(400,85,0);
        that.group.rotation.y = Math.PI / 2;

        this.isLoaded = true;
    }

    // send request to socket.io to load songs
    function tryLoadSongs()
    {
        if (socketBusy)
        {
            console.log("I'm busy, jukebox!!!");
            setTimeout(tryLoadSongs, 300);
        }
        else
        {
            socketBusy = true;
            specialRequest = that.request.LOADSONGS;
            currentDirectory = '/Home';
            openDir('Music');
            // after this this.songs contains filenames of songs in /Home/Music
        }
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

        // to keep track of which element is clicked
        var object;

        // code for handling clicks
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        CORE.projector.unprojectVector(vector, CORE.camera);
        var raycaster = new THREE.Raycaster(CORE.camera.position, vector.sub(CORE.camera.position).normalize());
        var intersects = raycaster.intersectObjects(CORE.intersectObjects);

        // if you clicked on something
        if (intersects.length > 0) {
            object = intersects[ 0 ].object;

            /*
                This is where most of the jukebox logic is. It keeps track of the state of all of the buttons and
                dynamically updates and html tag to play different songs. It uses javascript events and the DOM to
                handle manipulations of the audio state.
             */

            if (object === radioPlay)
            {
                if (!isPlaying)
                {
                    pushTheButton(radioPlay, true);
                    document.getElementById("audio").play();
                }
                else
                {
                    pushTheButton(radioPlay, false);
                    document.getElementById("audio").pause();
                }
                isPlaying = !isPlaying;
            }
            if (object === radioNext)
            {
                pushTheButton(radioNext, true);
                if(!isShuffling && !isReplaying) {
                    that.currentSongID = (that.songs.length + that.currentSongID + 1) % that.songs.length;
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                else if (isShuffling && !isReplaying){
                    that.currentSongID = Math.floor(Math.random()*that.songs.length);
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                else {
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                currentSeek = 0;
                radioPower.rotation.z = 0;

                setTimeout(function(){pushTheButton(radioNext, false);}, 300);
            }
            if (object === radioPrev)
            {
                pushTheButton(radioPrev, true);
                if (!isShuffling && !isReplaying) {
                    that.currentSongID = (that.songs.length + that.currentSongID - 1) % that.songs.length;
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                else if (isShuffling && !isReplaying) {
                    that.currentSongID = Math.floor(Math.random()*that.songs.length);
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                else {
                    that.changeSong(that.songs[ that.currentSongID ]);
                }
                currentSeek = 0;
                radioPower.rotation.z = 0;

                setTimeout(function(){pushTheButton(radioPrev, false);}, 300);
            }
            if (object === radioReplay)
            {
                if (!isReplaying)
                {
                    pushTheButton(radioReplay, true);
                }
                else
                {
                    pushTheButton(radioReplay, false);
                }
                isReplaying = !isReplaying;
            }
            if (object === radioShuffle)
            {
                if (!isShuffling)
                {
                    pushTheButton(radioShuffle, true);
                }
                else
                {
                    pushTheButton(radioShuffle, false);
                }
                isShuffling = !isShuffling;
            }
            if (object === radioVolume) {
                vol_clicked = true;
                dragging = true;
                prevDrag = vector;
                prevDrag.y = 0;
            }
            if (object === radioPower) {
                seek_clicked = true;
                dragging = true;
                prevDrag = vector;
                prevDrag.y = 0;
            }
        }
    }

    this.onDocumentMouseUp = function(event){
        event.preventDefault();
        dragging = false;
        prevDrag = null;
        vol_clicked = false;
        seek_clicked = false;
        document.getElementById('audio').volume = currentVolume;
            // variables and states are reset
    }

    this.onDocumentMouseOut = function(event){
        event.preventDefault();
        dragging = false;
        prevDrag = null;
        vol_clicked = false;
        seek_clicked = false;
        document.getElementById('audio').volume = currentVolume;
            // variables and states are reset
    }

    this.onDocumentMouseMove = function(event){
        event.preventDefault();

        var mouseX = ( event.clientX - windowHalfX ) / 2;
        var mouseY = ( event.clientY - windowHalfY ) / 2;

        if (dragging)
        {
            var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
            CORE.projector.unprojectVector(vector, CORE.camera);
            vector.sub(CORE.camera.position).normalize();

            var temp = new THREE.Vector3(0,0,0);
            temp.add(vector);

            vector.sub(prevDrag);
            vector.multiplyScalar(5);  // seems to work ok as long as it is positive

            // WORKAROUND: changed to vector.z, because the Jukebox is rotated 90 degrees, need to fix that so it would be generic.

            if (vector.z > 0) {
                if (vol_clicked) setvolume(0.0125);
                if (seek_clicked) setseek(3)
                //rotateTheButton(radioVolume, false);
                // moved to setvolume
            }
            if (vector.z < 0) {
                if (vol_clicked) setvolume(-0.0125);
                if (seek_clicked) setseek(-3);
                //rotateTheButton(radioVolume, true);
                // moved to setvolume
            }

            prevDrag = temp;

        }

    }

    // handles when a song needs to change
    this.changeSong = function(filepath) {
        console.log('changing song: ' + filepath);

        var audio_html = '<audio controls id="audio" onended="JUKEBOX.autoNext()"><source id="change_audio" src="' + filepath + '" type="audio/mpeg"><embed height="50" width="100" src="' + filepath + '"></audio>' ;
        document.getElementById("test_audio").innerHTML = audio_html;
        document.getElementById('audio').volume = currentVolume;

        if (isPlaying)
            document.getElementById("audio").play();
    }

    // handles when a song will change automatically due to the 'onended' event
    this.autoNext = function() {
        if (!isShuffling && !isReplaying){
            that.currentSongID = (that.songs.length + that.currentSongID + 1) % that.songs.length;
            that.changeSong(that.songs[ that.currentSongID ]);
        }
        else if (isShuffling && !isReplaying) {
            that.currentSongID = Math.floor(Math.random()*that.songs.length);
            that.changeSong(that.songs[ that.currentSongID ]);
        }
        else {
            that.changeSong(that.songs[ that.currentSongID ]);
        }
        currentSeek = 0;
        radioPower.rotation.z = 0;

    }

    // a not yet implemented algorithm for shuffling songs.

//    this.buildShuffledIndexArray = function(size) {
//
//        var array = [];
//        for (var i = 0; i<size; i++) {
//            array[i] = 0;
//        }
//
//        var rand = function(max) {
//            return Math.random()*max;
//        }
//
//        for ( var currentIndex = size - 1; currentIndex > 0; currentIndex-- ) {
//            var nextIndex = rand( currentIndex + 1 );
//            //swap
//            if ( array[currentIndex] == 0 ) {
//                array[currentIndex] = currentIndex;
//            }
//            if ( array[nextIndex] == 0 ) {
//                array[nextIndex] = nextIndex;
//            }
//            var temp = array[nextIndex];
//            array[nextIndex] = array[currentIndex];
//            array[currentIndex] = temp;
//        }
//        return array;
//    }
//
//    var shuff_count = this.songs.length;
//    var shuff_array = buildShuffledIndexArray(shuff_count);
//    this.shuffleNext = function() {
//        if (shuff_count > 0) {
//            this.currentSongID = shuff_array[shuff_count-1];
//            this.changeSong(this.songs[ this.currentSongID ]);
//            shuff_count--;
//        }
//        else {
//            shuff_count = this.songs.length;
//            shuff_array = this.buildShuffledIndexArray(shuff_count);
//            this.currentSongID = shuff_array[shuff_count-1];
//            this.changeSong(that.songs[ that.currentSongID ]);
//            shuff_count--;
//        }
//    }
//    this.shufflePrev = function() {
//        if (shuff_count < that.songs.length) {
//            that.currentSongID = shuff_array[shuff_count];
//            that.changeSong(that.songs[ that.currentSongID ]);
//            shuff_count++;
//        }
//        else if (shuff_count === that.songs.length) {
//            shuff_array = that.buildShuffledIndexArray(shuff_count);
//            that.currentSongID = shuff_array[0];
//            that.changeSong(that.songs[ that.currentSongID ]);
//            shuff_count = 0;
//        }
//    }

    /*
        initializes the jukebox model. Jukebox model parts are loaded from a separate js file with JSONLoader.
        note: the knobs needed to be positioned manually to fix rotation bugs
      */
    function initGeometry() {
        var loader = new THREE.JSONLoader();
        var callbackModel   = function( geometry, materials ) {
            radioBody = CORE.loadModel( geometry, materials, 0, 0, 0, false );
            modelElements.push(radioBody);
            that.group.add(radioBody);
        };
        loader.load( "/obj/radio-body.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioPlay = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioPlay);
            that.group.add(radioPlay);
        };
        loader.load( "/obj/radio-button-play.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioPrev = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioPrev);
            that.group.add(radioPrev);
        };
        loader.load( "/obj/radio-button-prev.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioNext = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioNext);
            that.group.add(radioNext);
        };
        loader.load( "/obj/radio-button-next.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioReplay = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioReplay);
            that.group.add(radioReplay);
        };
        loader.load( "/obj/radio-button-replay.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioShuffle = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioShuffle);
            that.group.add(radioShuffle);
        };
        loader.load( "/obj/radio-button-shuffle.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioSeeker = CORE.loadModel( geometry, materials, 0, 0, 0, true );
            modelElements.push(radioSeeker);
            that.group.add(radioSeeker);
        };
        loader.load( "/obj/radio-seeker.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioVolume = CORE.loadModel( geometry, materials, -10.5, 7/*fix*/, -17/*fix*/, true );
            modelElements.push(radioVolume);
            that.group.add(radioVolume);
        };
        loader.load( "/obj/knob-origin-1.js", callbackModel );

        callbackModel   = function( geometry, materials ) {
            radioPower = CORE.loadModel( geometry, materials, -49, 7/*fix*/, -17/*fix*/, true );
            modelElements.push(radioPower);
            that.group.add(radioPower);
        };
        loader.load( "/obj/knob-origin-1.js", callbackModel );
    }

    function initLights() {
        light = new THREE.SpotLight();
        light.position.set(0, 200, -50);
        light.intensity = 2.0;
        light.castShadow = true;
//        CORE.scene.add(light);
//        modelElements.push(light);

        pointLight = new THREE.PointLight(0x661452, 4, 150);
        pointLight.position.set(-30,20,-40);
//        CORE.scene.add(pointLight);
        modelElements.push(pointLight);
        that.group.add(pointLight);
    }

    // function for applying the transformation when play, ff, rw, shuff, or replay is pressed.
    function pushTheButton ( button, mode) {
        if (mode === true)
        {
//            button.position.set(Math.cos(button.rotation.y) * 1.5, 0, Math.sin(button.rotation.y) * 1.5);
            button.position.x -= Math.sin(button.rotation.y) * 1.5;
            button.position.z -= Math.cos(button.rotation.y) * 1.5;
        }
        else
        {
//            button.position.set(0,0,0);
            button.position.x += Math.sin(button.rotation.y) * 1.5;
            button.position.z += Math.cos(button.rotation.y) * 1.5;
        }
    }
    // function for applying the transformations when volume or seek knob are rotated (drag-clicked)
    function rotateTheButton ( button, mode ) {
        //mode: true:vol-up, false:vol-down
//            button.position.set(Math.cos(button.rotation.y) * 1.5, 0, Math.sin(button.rotation.y) * 1.5);
        if (mode) {
            if (vol_clicked) button.rotation.z -= (2*Math.PI)/80;
            if (seek_clicked) button.rotation.z -= (2*Math.PI)/(document.getElementById('audio').duration/3);
        }
        else {
            if (vol_clicked) button.rotation.z += (2*Math.PI)/80;
            if (seek_clicked) button.rotation.z += (2*Math.PI)/(document.getElementById('audio').duration/3);
        }
    }
    // function for handling the volume change
    function setvolume (vol) {
        if ( (vol+document.getElementById('audio').volume) > 0 && (vol+document.getElementById('audio').volume) < 1 ) {
            currentVolume = document.getElementById('audio').volume += vol;
            if (vol < 0) {
                rotateTheButton(radioVolume, false);
            }
            if (vol > 0) {
                rotateTheButton(radioVolume, true);
            }
        }
    }
    // function for handling the seeker change
    function setseek (seek) {
        if ( (seek+document.getElementById('audio').currentTime) > 0 && (seek+document.getElementById('audio').currentTime) < document.getElementById('audio').duration ) {
            currentSeek = document.getElementById('audio').currentTime += seek;
            document.getElementById('audio').volume = 0.1;
            if (seek < 0) {
                rotateTheButton(radioPower, false);
            }
            if (seek > 0) {
                rotateTheButton(radioPower, true);
            }
        }
    }

    // not yet implemented: audio lowers are you move farther from the jukebox
    this.update = function(){
        var d = Math.sqrt(Math.pow(CORE.camera.position.x, 2) +
            Math.pow(CORE.camera.position.y, 2) + Math.pow(CORE.camera.position.z, 2));
        //document.getElementById("audio").volume = 5*Math.abs(Math.log(d)/d);
    }
}