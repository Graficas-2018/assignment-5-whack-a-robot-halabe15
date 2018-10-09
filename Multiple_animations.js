var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
flamingo = null,
stork = null,
group = null,
orbitControls = null,
raycaster = null;

var robot_run = null;
var robot_group = {};
var intersects = [];
var deadAnimator;
var interval = null;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var duration = 20000; // ms
var currentTime = Date.now();

var animation = "run";

var score = 0;
var time = 0;

function changeAnimation(animation_text)
{
    animation = animation_text;

    if(animation == "dead")
    {
        createDeadAnimation();
    }
}

function createDeadAnimation()
{
    // position animation
    if (deadAnimator)
        deadAnimator.stop();

    // group.position.set(0, 0, 0);
    // group.rotation.set(0, 0, 0);

    if (animation == "dead")
    {
        deadAnimator = new KF.KeyFrameAnimator;
        deadAnimator.init({
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
                        target:robot_idle.rotation
                    },
                    {
                        keys:[0, .25, .5, 1],
                        values:[
                                { y : -4 },
                                { y : -3 },
                                { y : -2},
                                { y : -1},
                                ],
                        target:robot_idle.position
                    },
                ],
            loop: false,
            duration:1000,
            // easing:TWEEN.Easing.Bounce.InOut,
        });
        deadAnimator.start();

    }
}

function createRobots(){
  if (robot_group.children.length > 10)
    return;
  var object = cloneFbx(robot_idle);
  object.position.x = Math.random() * (45 + 45) - 45;
  object.position.z = -100;
  robot_run.clipAction( object.animations[ 0 ], object ).play();
  robot_group.add(object);
}

function loadFBX()
{
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
        robot_group.add( robot_idle );

        createDeadAnimation();

        robot_run.clipAction( object.animations[ 0 ], robot_idle ).play();
    } );
}

function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;

    if(robot_run){
      robot_run.update(deltat * 0.001);
    }


    switch (animation) {
      case "dead":
        KF.update();
        // robot_idle.position.y -= 0.04;
        // robot_idle.opacity += 1;
      break;

      case "run":
        // robot_idle.position.z += 0.3;
        // console.log(robot_group);
        for (var i in robot_group.children) {
          robot_group.children[i].position.z += 0.3;
        }
      break;
      default:

    }

    for (var i in robot_group.children) {
      if (robot_group.children[i].position.z > 100) {
        robot_group.remove(robot_group.children[i]);
      }
    }

}

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        animate();

        // Update the camera controller
        orbitControls.update();
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/grass.jpg";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

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

    // spotLight = new THREE.SpotLight (0xffffff);
    // spotLight.position.set(-30, 8, -10);
    // spotLight.target.position.set(-2, 0, -2);
    // root.add(spotLight);

    // spotLight.castShadow = true;
    //
    // spotLight.shadow.camera.near = 1;
    // spotLight.shadow.camera.far = 200;
    // spotLight.shadow.camera.fov = 45;
    //
    // spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    // spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0xffffff );
    root.add(ambientLight);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    robot_group = new THREE.Object3D;
    root.add(group);
    root.add(robot_group);

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

function onDocumentMouseDown(event)
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    for (var i in robot_group.children) {
      intersects.push(raycaster.intersectObjects( robot_group.children[i].children ));
    }

    for (var i in intersects) {
      if ( intersects[i].length > 0 ){
        CLICKED = intersects[i][0].object;
        robot_group.remove(robot_group.children[i]);
        addScore();
      } else
        CLICKED = null;
    }

}

function addScore(){
  score++;
  $('#title').text("Score: "+score);
}

function timer(){
  time++;
  $('#animations').text("Time: "+time+" segs");
}
