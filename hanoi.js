var camera, scene, renderer;
var floor; //the floor on which everything exists
var control; //global variable to hold control settings
var discArray = []; //global variable to hold discArray (allows discs to be accessed from any place)
var raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(); //global variables that have to do with figure out which object the mouse is over
var keyboard = {}; //global variable to access keyboard events
var USE_WIREFRAME = false;
var player = {
  height: 2,
  speed: 0.2,
  turnSpeed: Math.PI * 0.2 /*currently not using turnSpeed*/
}

var screenWidth = window.innerWidth, screenHeight = window.innerHeight;

function init() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0xff0000 );

  camera = new THREE.PerspectiveCamera(90, screenWidth / screenHeight, 0.1, 1000);

  camera.position.set(0, player.height, -16); //set the starting position of the camera (x, y, z)
  camera.lookAt(new THREE.Vector3(0,0,0)); //tell the camera what to look at

  addFloor(); //add a floor to the scene
  addPlatformAt("left"); //add left platform to the scene
  addPlatformAt("right"); //add right platform to the scene
  addPlatformAt("center"); //add center platform to the scene
  letThereBeLight(); //add a point light to the scene

  //build the initial tower
  addDisc(4, "blue", 1); //size 4 cylinder, color blue, bottom of stack
  addDisc(3, "green", 2); //size 3 cylinder, color green, 2nd stack position
  addDisc(2, "yellow", 3); //size 2 cylinder, color yellow, 3rd stack position
  addDisc(1, "white", 4); //size 1 cylinder, color white, top stack position

  buildRenderer(); //build the renderer
  animate(); //set everything in motion

  enableControls();
}

function onMouseMove( event ) {
  mouse.x = ( event.clientX / screenWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / screenHeight ) * 2 + 1;
}

function enableControls() {
  //TODO: Fix orbit controls
  // Orbit controls make things a little unusual/complicated because they mess with camera and allow rotation to below the surface of the place
  // controls = new THREE.OrbitControls( camera );
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.25;
  // controls.enableZoom = false;

  // //Transform controls allow the user to move the disks
  // control = new THREE.TransformControls( camera, renderer.domElement );
  // control.setMode("translate");
  // discArray.forEach(disc => control.attach( disc ));
  // scene.add( control );
}

function addDisc(number, color, stackPosition) { //add a new cylinder on to the stack with number (1 smallest - 4 biggest), a color, and the position in the stack (1 - bottom, 4 - top)
  //instantiate a cylinder (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  var discGeometry = new THREE.CylinderGeometry(number, number, 0.8, 50, false);
  var discMaterial = new THREE.MeshPhongMaterial({color: color, wireframe: false});
  var disc = new THREE.Mesh( discGeometry, discMaterial );
  var y = stackPosition === 1 ? 0.3 + (stackPosition * disc.geometry.parameters.height / 2) :
                                (stackPosition * (disc.geometry.parameters.height)); //place the cylinder on top of the platform
  var x = 10; //place the cylinder in the center of the left platform
  var z = 0; //place it in the center of the floor

  disc.position.set(x, y, z); //set the position of the cylinder
  disc.receiveShadow = true;
  disc.castShadow = true;
  scene.add(disc);
  discArray.push(disc);
}

function addPlatformAt(position) { //add a new platform at "left", "right", or "center"
  //instantiate a cylinder (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  var platformGeometry = new THREE.CylinderGeometry(4, 4, 0.3, 50, false);
  var platformMaterial = new THREE.MeshPhongMaterial({color: 0x001f3f, wireframe: USE_WIREFRAME});
  var platform = new THREE.Mesh( platformGeometry, platformMaterial );
  var y = platform.geometry.parameters.height / 2; //bottom of platform touches floor
  var x = position === "left" ? -10:
          position === "right" ? 10:
          position === "center" ? 0 :
          0; //if nothing is provided, place platform in center
  var z = 0; //place it in the center of the floor

  platform.position.set(x, y, z); //set the position of the platform
  platform.receiveShadow = true; //allow the platform to receive shadows
  platform.castShadow = true; //allow the platform to cast shadows
  scene.add(platform); //add the platform to the scene
}

function addFloor() {
  //instantiate a plane (width, height, widthSegments [opt], heightSegments [opt])
  var planeGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0x001f3f, wireframe: USE_WIREFRAME});
  floor = new THREE.Mesh(planeGeometry, planeMaterial);
  floor.rotation.x -= Math.PI / 2; //turn the floor horizontally (make sure it's facing up)
  floor.receiveShadow = true; //tell the floor to receive shadows (note: floor does not need to cast shadows)
  floor.scale.set(1000,1000,1000); //have the floor scale to appear to take up more space
  scene.add(floor); //add the floor to the scene
}

function letThereBeLight() {
  //instantiate a new point light (color [opt], intensity [opt], distance, decay)
  var pointLight = new THREE.PointLight(0xffffff, 1.2, 100, 2); //decay = 2 for realistic light falloff
  pointLight.position.set(-3, 6, -6); //set the position of the light
  pointLight.castShadow = true; //allow the light to cast a shadow
  pointLight.shadow.camera.near = 0.1; //cast a small shadow when near
  pointLight.shadow.camera.far = 25; //cast a large shadow when far
  scene.add(pointLight); //add the point light to the scene

  //instantiate a new ambient light
  var ambientLight = new THREE.AmbientLight( 0xffffff );
  scene.add( ambientLight );

}

function buildRenderer() {
  renderer = new THREE.WebGLRenderer({ alpha: true }); //instantiate the renderer
  renderer.setSize(screenWidth, screenHeight); //set the size of the renderer

  renderer.shadowMap.enabled = true; //enable shadows
  renderer.shadowMap.type = THREE.BasicShadowMap; //tell the renderer what type of shadow map to use

  // renderer.setClearColor( 0xf3f3f3, 0 );

  document.body.appendChild(renderer.domElement); //append the renderer to the DOM
}

function animate(){
  requestAnimationFrame(animate); //recursively rerenders page (~60 fps)
  handleMovement();
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( scene.children );
  for ( var i = 0; i < intersects.length; i++ ) {
    intersects[ i ].object.material.color.set( 0xff0000 );
  }
  renderer.render(scene, camera);
}

window.addEventListener('mousemove', onMouseMove, false);

/**************************
***** Keyboard Events *****
**************************/

function handleMovement() {
  if(keyboard[87]){ //W key (forward)
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[83]){ //S key (backward)
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[65]){ // A key (turn right)
    camera.rotation.y -= player.speed / 5;
  }
  if(keyboard[68]){ //D key (turn left)
    camera.rotation.y += player.speed / 5;
  }
  if(keyboard[81]){ //Q key (strafe left)
    camera.position.x += -Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[69]){ //E key (strafe right)
    camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[32]){ //Space bar (move up)
    camera.position.y += player.speed;
    camera.position.z -= player.speed;
  }
  if(keyboard[88]){ //X key (move down)
    if(camera.position.y > 1){
      camera.position.y -= player.speed;
      camera.position.z += player.speed;
    }
  }
}
function keyDown(event){
  keyboard[event.keyCode] = true;
}
function keyUp(event){
  keyboard[event.keyCode] = false;
}

//credit for this function http://barkofthebyte.azurewebsites.net/post/2014/05/05/three-js-projecting-mouse-clicks-to-a-3d-scene-how-to-do-it-and-how-it-works
// function onDocumentMouseDown( event ) {
//   var x = event.clientX / (screenWidth * 2) - 1;
//   var y = - ( event.clientY / (screenHeight * 2) + 1 );
//   var z = 0.5;
//   var mouse2D = new THREE.Vector3( x, y );
//
//   var raycaster = new THREE.Raycaster();
//   raycaster.setFromCamera( mouse2D , camera );
//   var intersects = raycaster.intersectObjects(  );
//   if(intersects > 0){
//     console.log(intersects);
//   }
// }

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;
