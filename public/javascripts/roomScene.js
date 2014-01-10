/**
 * Created on 11/26/13.
 * Contributors: Aibek Sarbayev, Swetal Bhatt, Sean Noran, Peng Gao
 */

/**
 *  The ROOM module is a shell for room environment, it provides walls, floor and decorations.
 *
 */

var ROOM = new ROOM();

function ROOM() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    // private variables
    // variable for shelves
    var shelf1, shelf2, shelf3, shelf4;
    // variable for light wood texture for the shelves
    var lightWoodTexture;

    // variable for table
    var table;
    // variable for black wood texture for the table
    var blackWoodTexture;

    // variable for brown wood texture for the tv stand
    var brownWoodTexture;

    // variable for coffee table
    var tablegroup;
    var tablegroup_active = [];
    var coffeetable;
    var leg1, leg2, leg3, leg4;

    // make the "room"
    var floor, wall1, wall2, wall3, wall4;

    // main light
    var light;

    var mirrorCamera;
    var that = this;
    this.mirrorObj = undefined;

    var modelElements = [];
    this.isLoaded = false;

    // load everything into scene and initalize lightning
    this.load = function ()
    {
        initGeometry();
        initPhotoFrame();
        initShelves();
        initTableGroup();
        initMirror();
        initTVstandModel();
        initWalls();
        initLights();

        this.isLoaded = true;
    }

    // unload everything
    this.unload = function ()
    {
        CORE.disposeSceneElements(modelElements);

        this.isLoaded = false;
    }

    // initialize floor and textures
    function initGeometry()
    {
        //TODO: Using the microcache is supposed to be faster:
        CORE.renderer._microCache.getSet('heavy', THREE.ImageUtils.loadTexture('/images/light-wood.jpg'));

        var lightWoodMaterial = new THREE.MeshLambertMaterial({map: lightWoodTexture});

        blackWoodTexture = new THREE.ImageUtils.loadTexture('/images/black-wood.png', {}, function () {
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        blackWoodTexture.wrapS = blackWoodTexture.wrapT = THREE.RepeatWrapping;
        blackWoodTexture.repeat.set(1, 1);
        var blackWoodMaterial = new THREE.MeshLambertMaterial({map: blackWoodTexture});

        brownWoodTexture = new THREE.ImageUtils.loadTexture('/images/Dark-brown-wood.jpg', {}, function () {
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        brownWoodTexture.wrapS = brownWoodTexture.wrapT = THREE.RepeatWrapping;
        blackWoodTexture.repeat.set(1, 1);
        var brownWoodMaterial = new THREE.MeshLambertMaterial({map: brownWoodTexture});

        table = new THREE.Mesh(
            new THREE.CubeGeometry(50,75,300),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: blackWoodTexture}));          // supply color of the cube
        table.position.set(500-25, (75/2), 0);
        table.castShadow = true;
        table.receiveShadow = true;
        CORE.scene.add(table);
        CORE.intersectObjects.push(table);
        modelElements.push(table);

        var floorTexture = new THREE.ImageUtils.loadTexture('/images/floor-texture.jpg', {}, function () {
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        var floorMaterial = new THREE.MeshLambertMaterial({map: floorTexture});

        floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000, 10, 10),
            new THREE.MeshLambertMaterial({map: floorTexture}));    // color
        floor.receiveShadow = true;
        floor.rotation.x = - Math.PI / 2;                    // make it horizontal, by default planes are vertical
        floor.position.y = 0;                                   // move it a little, to match bottom of the cube
        CORE.scene.add(floor);
        modelElements.push(floor);
    }

    // put nice photo frame on the wall
    function initPhotoFrame() {
        // variable for frame
        var pic;
        var picframe;
        var picTexture;

        picframe = new THREE.Mesh(
            new THREE.CubeGeometry(100,100,4),
            new THREE.MeshLambertMaterial({map: brownWoodTexture}));
        picframe.position.set(0, 250, 500-2);
        picframe.castShadow = true;
        picframe.receiveShadow = true;
        CORE.scene.add(picframe);
        CORE.intersectObjects.push(picframe);
        modelElements.push(picframe);
        picTexture = new THREE.ImageUtils.loadTexture('/images/hax.JPG', {}, function () {
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        picTexture.wrapS = picTexture.wrapT = THREE.RepeatWrapping;
        picTexture.repeat.set(1, 1);
        pic = new THREE.Mesh(
            new THREE.CubeGeometry(70,70,6),
            new THREE.MeshLambertMaterial({map: picTexture}));
        pic.position.set(0, 250, 500-2);
        pic.castShadow = true;
        pic.receiveShadow = true;
        CORE.scene.add(pic);
        CORE.intersectObjects.push(pic);
        modelElements.push(pic);
    }

    // load 3D models for TV stand and plant on top of it
    function initTVstandModel()
    {
        var loader = new THREE.JSONLoader();
        var callbackModel   = function( geometry, materials ) {
            TV_set = CORE.loadModel( geometry, materials, 0, 0, 0, false );
            TV_set.scale.set(2,1,2);
            TV_set.rotation.y = Math.PI / 2;
            TV_set.position.set(0, 35, -465);

            modelElements.push(TV_set);
            CORE.scene.add(TV_set);
        };
        loader.load( "/obj/tvstand.js", callbackModel );

        var callbackModel   = function( geometry, materials ) {
            pot = CORE.loadModel( geometry, materials, 0, 0, 0, false );
            pot.scale.set(0.05, 0.05, 0.05);
            pot.rotation.y = Math.PI / 2;
            pot.position.set(130, 70, -465);

            modelElements.push(pot);
            CORE.scene.add(pot);
        };
        loader.load( "/obj/flower_pot/house_plant.js", callbackModel );
    }

    // put shelves on the wall
    function initShelves()
    {
        shelf1 = new THREE.Mesh(
            new THREE.CubeGeometry(50,5,400),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        shelf1.position.set(500-50, 150, 0);
        shelf1.castShadow = true;
        shelf1.receiveShadow = true;
        CORE.scene.add(shelf1);
        CORE.intersectObjects.push(shelf1);
        modelElements.push(shelf1);

        shelf2 = new THREE.Mesh(
            new THREE.CubeGeometry(50,5,400),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        shelf2.position.set(500-50, 200, 0);
        shelf2.castShadow = true;
        shelf2.receiveShadow = true;
        CORE.scene.add(shelf2);
        CORE.intersectObjects.push(shelf2);
        modelElements.push(shelf2);

        shelf3 = new THREE.Mesh(
            new THREE.CubeGeometry(50,5,400),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        shelf3.position.set(500-50, 250, 0);
        shelf3.castShadow = true;
        shelf3.receiveShadow = true;
        CORE.scene.add(shelf3);
        CORE.intersectObjects.push(shelf3);
        modelElements.push(shelf3);

        shelf4 = new THREE.Mesh(
            new THREE.CubeGeometry(50,5,400),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        shelf4.position.set(500-50, 300, 0);
        shelf4.castShadow = true;
        shelf4.receiveShadow = true;
        CORE.scene.add(shelf4);
        CORE.intersectObjects.push(shelf4);
        modelElements.push(shelf4);
    }

    function initTableGroup()
    {
        coffeetable = new THREE.Mesh(
            new THREE.CubeGeometry(200,5,200),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        coffeetable.position.set(0, 80, 0);
        coffeetable.castShadow = true;
        coffeetable.receiveShadow = true;

        leg1 = new THREE.Mesh(
            new THREE.CubeGeometry(10,80,10),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        leg1.position.set(80, 40, -80);
        leg1.castShadow = true;
        leg1.receiveShadow = true;

        leg2 = new THREE.Mesh(
            new THREE.CubeGeometry(10,80,10),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        leg2.position.set(-80, 40, 80);
        leg2.castShadow = true;
        leg2.receiveShadow = true;

        leg3 = new THREE.Mesh(
            new THREE.CubeGeometry(10,80,10),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        leg3.position.set(80, 40, 80);
        leg3.castShadow = true;
        leg3.receiveShadow = true;

        leg4 = new THREE.Mesh(
            new THREE.CubeGeometry(10,80,10),                           // supply size of the cube
            new THREE.MeshLambertMaterial({map: lightWoodTexture}));          // supply color of the cube
        leg4.position.set(-80, 40, -80);
        leg4.castShadow = true;
        leg4.receiveShadow = true;

        tablegroup = new THREE.Object3D();
        tablegroup.rotation.set(0,0,0);

        tablegroup_active.push(coffeetable, leg1, leg2, leg3, leg4);
        tablegroup.add(coffeetable);
        tablegroup.add(leg1);
        tablegroup.add(leg2);
        tablegroup.add(leg3);
        tablegroup.add(leg4);

        tablegroup.rotation.set(0, Math.PI/4, 0);
        tablegroup.position.set(-300, 0 , 300);
        CORE.scene.add(tablegroup);
        CORE.intersectObjects.push(tablegroup);
        modelElements.push(tablegroup);
    }

    // initialize walls
    function initWalls()
    {
        // since we will be adding similar walls, we can reuse the geometry and material
        var wallGeometry = new THREE.PlaneGeometry(1000, 500, 10, 10);
        var wallMaterial = new THREE.MeshPhongMaterial({color: 0x33CCCC});

        // here is a wall, by default planes are vertical
        wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1.receiveShadow = true;
        wall1.position.z = -500;                // move it back
        wall1.position.y = 250;             // move it up
        CORE.scene.add(wall1);
        modelElements.push(wall1);

        // here is a wall, by default planes are vertical
        wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2.receiveShadow = true;
        wall2.rotation.y = Math.PI / 2;         // rotate to get perpendicular wall
        wall2.position.x = -500;                // move it left
        wall2.position.y = 250;             // move it up
        CORE.scene.add(wall2);
        modelElements.push(wall2);

        // here is a wall, by default planes are vertical
        wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall3.position.x = 500;                 // move it right
        wall3.position.y = 250;                 // move it up
        wall3.rotation.y = - Math.PI / 2;       // rotate to get perpendicular wall
        wall3.receiveShadow = true;
        CORE.scene.add(wall3);
        modelElements.push(wall3);

        // here is a wall, by default planes are vertical
        wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall4.position.z = 500;                 // move it front
        wall4.position.y = 250;                 //move it up
        wall4.rotation.y = Math.PI;             // rotate it 180 degrees, so the "front" will face towards us,
        wall4.receiveShadow = true;
        CORE.scene.add(wall4);
        modelElements.push(wall4);
    }

    // put mirror on the wall
    function initMirror(){
        var cubeGeom = new THREE.CubeGeometry(100, 250, 10, 1, 1, 1);
        mirrorCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
        // mirrorCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
        CORE.scene.add( mirrorCamera );
        var mirrorCubeMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorCamera.renderTarget } );
        that.mirrorObj = new THREE.Mesh( cubeGeom, mirrorCubeMaterial );
        that.mirrorObj.position.set(-500,150,0); //place on wall
        that.mirrorObj.rotation.set(0, Math.PI/2, 0);
        mirrorCamera.position = that.mirrorObj.position;
        CORE.scene.add(that.mirrorObj);
    }

    // update for mirror
    this.update = function(){
        that.mirrorObj.visible = false;
        mirrorCamera.updateCubeMap( CORE.renderer, CORE.scene );
        that.mirrorObj.visible = true;
    }

    // initialize lights
    function initLights()
    {
        light = new THREE.SpotLight();
        light.position.set( 0, 800, 0 );
        light.intensity = 4.0;
        light.castShadow = true;
        CORE.scene.add(light);
        modelElements.push(light);
    }
}