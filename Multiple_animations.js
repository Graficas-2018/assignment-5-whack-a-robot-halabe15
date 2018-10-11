var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048, TIME = 5;

var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
group = null,
orbitControls = null,
raycaster = null;

var robot_run = null;
var robot_running = {};
var intersects = [];
var deadAnimator;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var duration = 20000; // ms
var currentTime = Date.now();
var animation = "run";
var score = 0;
var time = TIME;
var ambientLight = null;
var mapUrl = "../images/grass.jpg";
var game_over = false;


function run() {
  if (!game_over) {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        animate();

        // Update the camera controller
        orbitControls.update();
        if (time == 0)
          gameover();
  }

}

function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;

    if(robot_run){
      robot_run.update(deltat * 0.001);
    }

    KF.update();

    for (var i in robot_running.children) {
      if (robot_running.children[i].die != true) {
        robot_running.children[i].position.z += 0.3;
      } else {
        if(!robot_running.children[i].deadAnimator.running)
          robot_running.remove(robot_running.children[i]);
      }
      if (robot_running.children[i].position.z > 100) {
        robot_running.remove(robot_running.children[i]);
        addScore(-1);
      }
    }
}

function loadFBX(){
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Robot/robot_run.fbx', function ( object )
    {
        robot_run = new THREE.AnimationMixer( scene );
        object.scale.set(0.01, 0.01, 0.01);
        object.position.z = -100;
        object.position.y -= 4;
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        robot_idle = object;
        robot_running.add( robot_idle );

        // createDeadAnimation();

        robot_run.clipAction( object.animations[ 0 ], robot_idle ).play();
    } );
}

function createRobots(){
  if (robot_running.children.length > 10)
    return;
  var object = cloneFbx(robot_idle);
  object.position.x = Math.random() * (45 + 45) - 45;
  object.position.y = -4;
  object.position.z = -100;
  object.rotation.x = 0;
  robot_run.clipAction( object.animations[ 0 ], object ).play();
  robot_running.add(object);
}

function createDeadAnimation(object){
    // position animation
    // if (deadAnimator)
    //     deadAnimator.stop();

    // group.position.set(0, 0, 0);
    // group.rotation.set(0, 0, 0);

    // if (animation == "dead")
    // {
        object.deadAnimator = new KF.KeyFrameAnimator;
        object.deadAnimator.init({
            interps:
                [
                    {
                        keys:[0, .25, .5, 1],
                        values:[
                                { x : 0 },
                                { x : -Math.PI /8 },
                                { x : -Math.PI /4},
                                { x : -Math.PI /2},
                                ],
                        target:object.rotation
                    },
                    {
                        keys:[0, .25, .5, 1],
                        values:[
                                { y : -4 },
                                { y : -3 },
                                { y : -2},
                                { y : -1},
                                ],
                        target:object.position
                    },
                ],
            loop: false,
            duration:1000,
            // easing:TWEEN.Easing.Bounce.InOut,
        });
        object.deadAnimator.start();
        // object.parent.remove(object);

    // }
}

function createScene(canvas){
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-15, 6, 30);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create a group to hold all the objects
    root = new THREE.Object3D;


    //
    //

    ambientLight = new THREE.AmbientLight ( 0xffffff );
    root.add(ambientLight);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    robot_running = new THREE.Object3D;
    root.add(group);
    root.add(robot_running);

    // Create the objects
    loadFBX();

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(100, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );
    setInterval(createRobots, 1000);
    setInterval(timer, 1000);

    raycaster = new THREE.Raycaster();


}

function onDocumentMouseDown(event){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    for (var i in robot_running.children) {
      intersects.push(raycaster.intersectObjects( robot_running.children[i].children ));
    }

    for (var i in intersects) {
      if ( intersects[i].length > 0 ){
        CLICKED = intersects[i][0].object;
        // robot_running.remove(robot_running[i]);
        // createDeadAnimation(i);
        // CLICKED.parent.remove(CLICKED);
        CLICKED.parent.die = true;
        createDeadAnimation(CLICKED.parent);
        addScore(1);
      } else
        CLICKED = null;
    }

    intersects = [];

}

function gameover(){
  game_over = true;
  $('#container').hide();
  $('#menu').show();
}

function start(){
  $('#menu').hide();
  $('#container').show();

  time = TIME;
  addScore(-score);
  game_over = false;

  renderer = null;
  scene = null;
  camera = null;
  root = null;
  robot_idle = null;
  robot_attack = null;
  group = null;
  orbitControls = null;
  raycaster = null;

  robot_run = null;
  robot_running = {};
  intersects = [];
  deadAnimator;
  mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
  duration = 20000; // ms
  currentTime = Date.now();
  animation = "run";
  score = 0;
  time = TIME;
  ambientLight = null;
  mapUrl = "../images/grass.jpg";
  game_over = false;
  createScene();

  run();
}

function addScore(num){
  score = score + num;
  if (score < 0)
    score = 0;
  $('#title').text("Score: "+score);
}

function timer(){
  time--;
  if (time < 0)
    time = 0;
  $('#animations').text("Time: "+time+" segs");
}
