/**
* Created by Aibek on 11/26/13.
*/

/**
 *  The BOOK module is experimental, since it uses experimental PDF.js made by Mozilla.
 *  PDF.js is very inefficient at this moment, but I didn't find any other way to load PDF into WebGL,
 *  For memory efficiency I didn't include this module while initializing ROOM, but you can press N in
 *  the ROOM and see the demo version, which shows 3 pages and logic for flipping left and right.
 *  Due to very high memory demand I'm not providing an ability to read entire book.
 *  Hopefully Mozilla constantly improves PDF.js, and we can expect optimized version very soon.
 *
 */

var BOOK = new BOOK();
function BOOK() {
    // Utilize singleton property
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    this.isLoaded = false;

    // private variables
    var frontCover;
    var backCover;
    var pageRight1;
    var pageLeft1;
    var pageRight2;
    var pageLeft2;
    var floor;
    var light;

    var bookLoaded = false;
    var currentPage = 10;

    var modelElements = [];

    // load the book module
    this.load = function ()
    {
        initPDF(pageRight1, currentPage++);

        // set camera above the book.
        CORE.freezeCamera(true);
        CORE.camera.position.set(45, 80, -65);
        CORE.camera.rotation.set(-2.09, 0, -Math.PI);

        this.isLoaded = true;
    }

    // unload the book module
    this.unload = function ()
    {
        CORE.disposeSceneElements(modelElements);
        this.isLoaded = false;
    }

    // logic for clicking on the pages
    this.onDocumentMouseDown = function(event){
        event.preventDefault();

        var object;
        var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
        CORE.projector.unprojectVector(vector, CORE.camera);
        var raycaster = new THREE.Raycaster(CORE.camera.position, vector.sub(CORE.camera.position).normalize());
        var intersects = raycaster.intersectObjects(CORE.intersectObjects);

        if (intersects.length > 0) {
            object = intersects[ 0 ].object;
            if (object === pageRight1)
                flipPage(pageRight1);
            if (object === pageLeft1)
                flipPage(pageLeft1);
            if (object === pageRight2)
            {
                initPDF(pageLeft2, currentPage++);
                flipPage(pageRight2);
                flipPage(pageLeft2);
            }
        }
    }

    // loading PDF page
    function loadPage(object, canvas) {
        console.log("Loading page. Book loaded: " + bookLoaded);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var canvasMaterial = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});

        object.material = canvasMaterial;

        if (object === pageRight1)
            initPDF(pageLeft1, currentPage++);
        else if (object === pageLeft1)
            initPDF(pageRight2, currentPage++);

    }

    // logic for putting PDF into the scene
    function initPDF(object, pageNumber) {
        PDFJS.getDocument('/Home/pdfs/crackcode.pdf').then(function(pdf) {
            // Using promise to fetch the page
            pdf.getPage(pageNumber).then(function(page) {
                var scale = 3;
                var viewport = page.getViewport(scale);

                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!bookLoaded)
                {
                    initPages(canvas);
                    object = pageRight1;
                }

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                page.render(renderContext);
                setTimeout(function(){
                    loadPage(object, canvas);
                }, 1000);
            });
        });
    }

    // initializing blank pages, that will hold PDFs
    function initPages(canvas)
    {
        var coverTexture = new THREE.ImageUtils.loadTexture('/images/bookCover_small.jpg', {}, function () {
            CORE.renderer.render(CORE.scene, CORE.camera);
        });
        coverTexture.wrapS = coverTexture.wrapT = THREE.RepeatWrapping;
        coverTexture.repeat.set(1, 1);
        var coverMaterial = new THREE.MeshLambertMaterial({map: coverTexture, side: THREE.DoubleSide});

        pageRight1 = new THREE.Mesh(
            new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1), coverMaterial);
        pageRight1.position.set(0, 12, 0);
        pageRight1.rotation.x = -Math.PI / 2;                    // make it horizontal, by default planes are vertical
        pageRight1.rotation.z = Math.PI;
        pageRight1.castShadow = true;
        pageRight1.scale.set(0.1, 0.1, 0.1);
        CORE.scene.add(pageRight1);
        CORE.intersectObjects.push(pageRight1);
        modelElements.push(pageRight1);

        pageLeft1 = new THREE.Mesh(
            new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1), coverMaterial);
        pageLeft1.position.set(0, 11, 0);
        pageLeft1.rotation.x = -Math.PI / 2;                    // make it horizontal, by default planes are vertical
        pageLeft1.rotation.y = Math.PI;                         // since it is left page, it need to display inverted
        pageLeft1.rotation.z = Math.PI;
        pageLeft1.castShadow = true;
        pageLeft1.scale.set(0.1, 0.1, 0.1);
        CORE.scene.add(pageLeft1);
        CORE.intersectObjects.push(pageLeft1);
        modelElements.push(pageLeft1);

        pageRight2 = new THREE.Mesh(
            new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1), coverMaterial);
        pageRight2.position.set(0, 10, 0);
        pageRight2.rotation.x = -Math.PI / 2;                    // make it horizontal, by default planes are vertical
        pageRight2.rotation.z = Math.PI;
        pageRight2.castShadow = true;
        pageRight2.scale.set(0.1, 0.1, 0.1);
        CORE.scene.add(pageRight2);
        CORE.intersectObjects.push(pageRight2);
        modelElements.push(pageRight2);

        pageLeft2 = new THREE.Mesh(
            new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1), coverMaterial);
        pageLeft2.position.set(0, 9, 0);
        pageLeft2.rotation.x = -Math.PI / 2;                    // make it horizontal, by default planes are vertical
        pageLeft2.rotation.y = Math.PI;                         // since it is left page, it need to display inverted
        pageLeft2.rotation.z = Math.PI;
        pageLeft2.castShadow = true;
        pageLeft2.scale.set(0.1, 0.1, 0.1);
        CORE.scene.add(pageLeft2);
        CORE.intersectObjects.push(pageLeft2);
        modelElements.push(pageLeft2);

        bookLoaded = true;
    }

    // math behind animating page flip
    function flipPage(object) {
        var animation = true;

        var angle = 0;
        var initPosX = object.position.x;
        var initPosY = object.position.y;
        var initRotY = object.rotation.y;

        setTimeout(stopAnimation, 1000);
        animateFlip();

        function animateFlip()
        {
            if (animation === true && object === pageRight1)
            {
                object.position.x = initPosX + Math.sin(object.rotation.y / 2) * object.geometry.width * object.scale.x;
                object.position.y = initPosY + Math.cos(object.rotation.y - Math.PI / 2) * object.geometry.width / 2 * object.scale.x;
                angle += Math.PI / 37;
                object.rotation.y = initRotY + angle;

                pageLeft1.position.x = initPosX + Math.sin(object.rotation.y / 2) * object.geometry.width * object.scale.x;
                pageLeft1.position.y = initPosY + Math.cos(object.rotation.y - Math.PI / 2) * object.geometry.width / 2 * object.scale.x;
                pageLeft1.rotation.y = Math.PI + initRotY + angle;

                setTimeout(animateFlip, 25);
            }

            if (animation === true && object === pageLeft1)
            {
                angle -= Math.PI / 37;
                object.rotation.y = initRotY + angle;
                object.position.x = initPosX + Math.sin(object.rotation.y / 2) * object.geometry.width * object.scale.x;
                object.position.y = initPosY - Math.cos(object.rotation.y - Math.PI / 2) * object.geometry.width / 2 * object.scale.x;

                pageRight1.position.x = initPosX + Math.sin(object.rotation.y / 2) * object.geometry.width * object.scale.x;
                pageRight1.position.y = initPosY - Math.cos(object.rotation.y - Math.PI / 2) * object.geometry.width / 2 * object.scale.x;
                pageRight1.rotation.y = Math.PI + initRotY + angle;

                setTimeout(animateFlip, 25);
            }
        }

        function stopAnimation()
        {
            animation = false;
            if (object === pageRight1)
            {
                object.rotation.y = Math.PI;
                object.position.y = 20 - initPosY;
                pageLeft1.rotation.y = 0;
                pageLeft1.position.y = object.position.y + 1;
            }
            if (object === pageLeft1)
            {
                object.rotation.y = Math.PI;
                object.position.y = 20 - initPosY;
                pageRight1.rotation.y = 0;
                pageRight1.position.y = object.position.y + 1;
            }
        }
    }
}