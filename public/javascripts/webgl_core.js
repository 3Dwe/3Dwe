/**
 * Created by Aibek on 11/2/13.
 * TV logic and camera effects made by Sean Noran
 */

/**
 *   In this file we set up core logic of WebGL and load/unload modules (room, tv, jukebox, album and book).
 *   The CORE class contains initialization of WebGL main components: renderer, scene, camera and camera controls.
 *   There is also implementation of camera effects, renderer stats and WebGL stats (stats are disabled by default).
 *   The animate function is implemented here, to constantly update everything in the scene.
 *   CORE also disposes unloaded geometry and textures to improve memory management.
 *
 */

var CORE = new CORE();
var current_window; //the currently loaded window ROOM at this moment.

$(document).ready(function () {
    // choose default requestAnimationFrame depending on the browser
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                   window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    CORE.init();
    CORE.animate(new Date().getTime());

    $('#TV_play').click(function(e){
        if (TVObject)
            TVObject.playVideo();
    });

    $('#TV_pause').click(function(e){
        if (TVObject)
            TVObject.pauseVideo();
    });
});

function CORE() {
    var that = this;        // 'that' keeps reference to the CORE, since 'this' can change depending on the scope, i.e. animate()
    this.socket;

    this.renderer;
    this.scene;
    this.camera;
    this.cameraTarget;
    this.projector;
    this.composer;
    this.intersectObjects =[];                             // objects that we can press on and interact

    var controls;
    var clock;
    var rendererStats;
    var stats;
    var fadeInEffect, filmEffect;
    var tempMesh;

    var WALK_SPEED = 60, RUN_SPEED = 360;                   // camera movement speed

    this.init = function() {
        CORE.socket = io.connect('http://localhost:3000');                      // initialize socket io on local server

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize($('#viewer').width(), $('#viewer').height());     // take up entire space
        this.renderer.shadowMapEnabled = true;                                  // enable shadows

        $('#viewer').html(this.renderer.domElement);                            // attach renderer to html

        this.camera = new THREE.PerspectiveCamera(60, $('#viewer').width() / $('#viewer').height(), 1, 10000);
        this.camera.position.set(-300, 100, 100);
        this.cameraTarget = new THREE.Vector3(500, 100, -200);
        this.camera.lookAt(this.cameraTarget);

        this.scene = new THREE.Scene();
        this.projector = new THREE.Projector();

        THREEx.WindowResize(this.renderer, this.camera);

        // display renderer stats, disabled by default
        rendererStats = new THREEx.RendererStats();
        rendererStats.domElement.style.position = 'absolute';
        rendererStats.domElement.style.left = '0px';
        rendererStats.domElement.style.top   = '80px';
//        document.getElementById('viewer').appendChild( rendererStats.domElement );

        // display fps stats, disabled by default
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '30px';
        // document.getElementById('viewer').appendChild( stats.domElement );

        // to freeze camera press Q, default movement with WASD, to move camera up R, to move camera down F
        controls = new THREE.FirstPersonControls(this.camera, this.cameraTarget);
        controls.movementSpeed = WALK_SPEED;
        controls.activeLook = false;
        controls.lookSpeed = 0.2;
        clock = new THREE.Clock();

        // attaching microcache to the renderer
        this.renderer._microCache = new MicroCache();

        // used for camera effects
        this.composer = new THREE.EffectComposer( this.renderer );
        this.composer.addPass( new THREE.RenderPass( this.scene, this.camera ) );

        fadeInEffect = new THREE.ShaderPass( THREE.BrightnessShader );
        fadeInEffect.uniforms[ 'amount' ].value = 0.0;
        fadeInEffect.renderToScreen = true;
        this.composer.addPass( fadeInEffect );

        filmEffect = new THREE.FilmPass( 0.95, 0.215, 900, true );
        filmEffect.renderToScreen = false; //do not render by default
        this.composer.addPass(filmEffect);

        //freeze the camera to start, then let the user move after a moment:
        this.freezeCamera(true);
        setTimeout(function(){
            that.freezeCamera(false);
        },2000);

        // loading the room
        loadRoom();
    }


    // used in loading custom 3D model, used by other room modules
    this.loadModel = function ( geometry, materials, x, y, z, clickable) {
        tempMesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
        tempMesh.position.set( x, y, z );
        tempMesh.scale.set( 0.5, 0.5, 0.5 );
        tempMesh.receiveShadow = true;
        tempMesh.castShadow = true;
        tempMesh.rotation.y = - Math.PI;

        if (clickable)
            this.intersectObjects.push(tempMesh);

        return tempMesh;
    }

    // Notice we use 'that' instead of 'this', because next time we call this.animate we want to keep old reference 'this'
    this.animate = function(t)
    {
        requestAnimationFrame(that.animate, that.renderer.domElement);
        controls.update(clock.getDelta());
        that.renderer.render(that.scene, that.camera);
        that.composer.render();
//        rendererStats.update(that.renderer);
//        stats.update();
        if (TVObject.isLoaded)
            TVObject.renderVideo();
        if (ROOM.isLoaded)
            ROOM.update();
    }

    // load everything in the room, except BOOK (PDF.js isn't optimized, need to load separately by pressing N)
    // also add eventListeners
    function loadRoom()
    {
        ROOM.load();
        TVObject.load();
        JUKEBOX.load();
        ALBUM.load();

        document.addEventListener('mousedown', TVObject.onDocumentMouseDown, false);
        document.addEventListener('mouseup', TVObject.onDocumentMouseUp, false);
        document.addEventListener('mousemove', TVObject.onDocumentMouseMove, false);
        document.addEventListener('keydown', TVObject.flyToObject, false);
        document.addEventListener('keydown', TVObject.flyToObject, false);

        document.addEventListener('mousedown', JUKEBOX.onDocumentMouseDown, false);
        document.addEventListener('mouseout', JUKEBOX.onDocumentMouseOut, false);
        document.addEventListener('mouseup', JUKEBOX.onDocumentMouseUp, false);
        document.addEventListener('mousemove', JUKEBOX.onDocumentMouseMove, false);

        document.addEventListener('mousedown', ALBUM.onDocumentMouseDown, false);

        controls.movementSpeed = 50;
        current_window = ROOM;

        var fade_in = setInterval(function(){
            fadeInEffect.uniforms[ 'amount' ].value+=0.04;
            if (fadeInEffect.uniforms[ 'amount' ].value >= 1)
                clearInterval(fade_in);
        }, 100);
    }

    // hold SHIFT to move camera master
    document.onmousemove = function(e){
        if (!controls) return;
        if (e.shiftKey){
            controls.movementSpeed = RUN_SPEED;
        }else{
            controls.movementSpeed = WALK_SPEED;
        }
    }

    // keyboard controls
    document.onkeypress = function (event) {
        var key = event.keyCode ? event.keyCode : event.which;

        if (key === 110 && !BOOK.isLoaded)                      // press N to load BOOK in the ROOM
        {
           BOOK.load();
           document.addEventListener('mousedown', BOOK.onDocumentMouseDown, false);
        }
        if (key === 32){                                        // press SPACE to toggle Black & White filter
            fadeInEffect.renderToScreen = !fadeInEffect.renderToScreen;
            filmEffect.renderToScreen = !filmEffect.renderToScreen;
        }
    }

    // initial fading camera effect
    function fadeToScene(loadScene){
        var fade_out = setInterval(function(){
            fadeInEffect.uniforms[ 'amount' ].value-=0.04;
            if (fadeInEffect.uniforms[ 'amount' ].value <= 0){
                loadScene();

                clearInterval(fade_out);

                setTimeout(function(){
                    //fade in:
                    var fade_in = setInterval(function(){
                        fadeInEffect.uniforms[ 'amount' ].value+=0.04;
                        if (fadeInEffect.uniforms[ 'amount' ].value >= 1)
                            clearInterval(fade_in);
                    }, 100);
                }, 750);
            }
        }, 100);
    }

    // used in the debugging to efficiently dispose unwanted materials
    // left here for illustration
    this.disposeSceneElements = function(modelElements) {
        modelElements.forEach(function(element){
            CORE.intersectObjects.splice(jQuery.inArray(element, CORE.intersectObjects), 1);
            CORE.scene.remove(element);
            if (element.geometry) {
                delete element.geometry.geometryGroups;
                $.each(element.geometry.geometryGroupsList, function (idx, elem) {
                    delete elem;
                });
                element.geometry.geometryGroupsList = [];
                element.geometry.dispose();
            }
            if (element.material) {
                if (element.material instanceof THREE.MeshFaceMaterial) {
                    $.each(element.material.materials, function(idx, elem) {
                        elem.dispose();
                    });
                } else {
                    element.material.dispose();
                }

                if (element.material.map) {
                    element.material.map.dispose();
                }
            }
            if (element.dispose) {
                element.dispose();
            }
        });

        modelElements = [];
    }

    // freeze camera
    this.freezeCamera = function(bFreeze){
        controls.freeze = bFreeze;
    }
}