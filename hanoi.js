//WebGL boilerplate variables
var camera, scene, renderer;

//Standard global variables -- window and movement settings
var USE_WIREFRAME = false;
var screenWidth = window.innerWidth, screenHeight = window.innerHeight;
var movementSettings = {
  height: 2,
  speed: 0.2,
  turnSpeed: Math.PI * 0.2 /*currently not using turnSpeed*/
}

//Physical objects in the scene that need to be globally accessible
var floor; //the floor on which everything exists
var discArray = []; //global variable to hold discArray (allows discs to be accessed from any place)

var keyboard = {}; //global variable to access keyboard event

//Necessary global variables to enable motion along XY plane
var objectControls; //global variable to instantiate the ObjectControls library
var raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(); //global variables that have to do with figure out which object the mouse is over
var intersectionPlane;





/************************
** Initialize Function **
*************************/
function init() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0xff0000 );

  camera = new THREE.PerspectiveCamera(90, screenWidth / screenHeight, 0.1, 1000);

  camera.position.set(0, movementSettings.height, -16); //set the starting position of the camera (x, y, z)
  camera.lookAt(new THREE.Vector3(0,0,0)); //tell the camera what to look at

  objectControls = new ObjectControls( camera ); //initialize controls in ObjectControls library

  createIntersectionPlane(); //add a plane for the discs to move along when dragged

  buildRenderer(); //build the renderer

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

  animate(); //set everything in motion
}

function buildRenderer() {
  renderer = new THREE.WebGLRenderer({ alpha: true }); //instantiate the renderer
  renderer.setSize(screenWidth, screenHeight); //set the size of the renderer

  renderer.shadowMap.enabled = true; //enable shadows
  renderer.shadowMap.type = THREE.BasicShadowMap; //tell the renderer what type of shadow map to use

  document.body.appendChild(renderer.domElement); //append the renderer to the DOM
}

function animate(){
  requestAnimationFrame(animate); //recursively rerenders page (~60 fps)
  handleMovement(); //allow and update keyboard movements
  objectControls.update(); //update the object controls

  renderer.render(scene, camera);
}





/**********************************
*** Geometry Creation Functions ***
**********************************/

function addDisc(number, color, stackPosition) { //add a new cylinder on to the stack with number (1 smallest - 4 biggest), a color, and the position in the stack (1 - bottom, 4 - top)
  //instantiate a cylinder (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  var discGeometry = new THREE.CylinderGeometry(number, number, 0.8, 50, false);
  var discMaterial = new THREE.MeshPhongMaterial({color: color, wireframe: false});
  var disc = new THREE.Mesh( discGeometry, discMaterial );
  var y = stackPosition === 1 ? 0.3 + (stackPosition * disc.geometry.parameters.height / 2) :
                                (stackPosition * (disc.geometry.parameters.height)); //place the cylinder on top of the platform
  var x = 10; //place the cylinder in the center of the left platform
  var z = 0; //place it in the center of the floor

  var hoverMaterial = new THREE.MeshBasicMaterial({ color: 0x55ff88 }); //when hovering over a disc, change the color & material

  disc.selected = false;

  disc.hoverOver = function() { //when hovering over a disc, change its color
    this.material = hoverMaterial;
  }.bind( disc );
  disc.hoverOut = function() { //change back to normal color on hover out
    this.material = discMaterial;
  }.bind( disc );

  disc.select = function() { //allow the disc to move when selected
    intersectionPlane.position.copy( this.position );
  }.bind( disc );

  disc.deselect = function snapIntoPlace() {
    console.log(this.position.x);
  }

  disc.update = function() {
    var raycaster = objectControls.raycaster;
    var i = raycaster.intersectObject( intersectionPlane );

    if (!i[0] ){
      console.log("Nothing was selected.");
    } else {
      this.position.copy( i[0].point );
    }
  }.bind( disc );

  disc.position.set(x, y, z); //set the position of the cylinder
  disc.receiveShadow = true; //allow each disc to receive shadows
  disc.castShadow = true; //allow each disc to cast shadows
  scene.add(disc); //add the disc to the scene
  discArray.push(disc); //push the disc to the discArray to make it globally accessible

  objectControls.add(disc);
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

function createIntersectionPlane() {
  var geo = new THREE.PlaneGeometry( 100000 , 100000, 8, 8);
  var mat = new THREE.MeshNormalMaterial({visible: false, side: THREE.DoubleSide});
  intersectionPlane = new THREE.Mesh( geo , mat );
  intersectionPlane.position.set(0,0,0);
  scene.add( intersectionPlane );
}




/***************
*** Lighting ***
****************/
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





/**************************
***** Keyboard Events *****
**************************/

function handleMovement() {
  if(keyboard[87]){ //W key (forward)
    camera.position.x -= Math.sin(camera.rotation.y) * movementSettings.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * movementSettings.speed;
  }
  if(keyboard[83]){ //S key (backward)
    camera.position.x += Math.sin(camera.rotation.y) * movementSettings.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * movementSettings.speed;
  }
  if(keyboard[65]){ // A key (turn right)
    camera.rotation.y -= movementSettings.speed / 5;
  }
  if(keyboard[68]){ //D key (turn left)
    camera.rotation.y += movementSettings.speed / 5;
  }
  if(keyboard[81]){ //Q key (strafe left)
    camera.position.x += -Math.sin(camera.rotation.y - Math.PI/2) * movementSettings.speed;
    camera.position.z += Math.cos(camera.rotation.y - Math.PI/2) * movementSettings.speed;
  }
  if(keyboard[69]){ //E key (strafe right)
    camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * movementSettings.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * movementSettings.speed;
  }
  if(keyboard[32]){ //Space bar (move up)
    camera.position.y += movementSettings.speed;
    camera.position.z -= movementSettings.speed;
  }
  if(keyboard[88]){ //X key (move down)
    if(camera.position.y > 1){
      camera.position.y -= movementSettings.speed;
      camera.position.z += movementSettings.speed;
    }
  }
}
function keyDown(event){
  keyboard[event.keyCode] = true;
}
function keyUp(event){
  keyboard[event.keyCode] = false;
}




/************************
**** Event Listeners ****
************************/

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;
