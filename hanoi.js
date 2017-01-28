var camera, scene, renderer, cube, floor, ambientLight;
var keyboard = {};
var USE_WIREFRAME = false;
var player = {
  height: 2,
  speed: 0.05,
  turnSpeed: Math.PI * 0.2 /*currently not using turnSpeed*/
}

var screenWidth = window.innerWidth, screenHeight = window.innerHeight;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(90, screenWidth / screenHeight, 0.1, 1000);

  camera.position.set(0, player.height, -7); //set the starting position of the camera (x, y, z)
  camera.lookAt(new THREE.Vector3(0,0,0)); //tell the camera what to look at

  addCube(); //add a cube to the scene
  addFloor(); //add a floor to the scene
  addPlatformAt("left"); //add left platform to the scene
  addPlatformAt("right");
  addPlatformAt("center");
  letThereBeLight(); //add a point light to the scene

  buildRenderer(); //build the renderer
  animate(); //set everything in motion
}

function addCube() {
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1, 20, 20);
  const cubeMaterial = new THREE.MeshPhongMaterial({color: 0xff4444, wireframe: USE_WIREFRAME})
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.y = 1; //move the cube up so it isn't in the floor

  cube.receiveShadow = true; //tell the cube to receive shadows
  cube.castShadow = true; //tell the cube to cast shadows

  scene.add(cube); //add the cube to the scene
  rotateCube(); //rotate the cube
}

function rotateCube() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.rotation.z += 0.01;
}

function addPlatformAt(position) { //add a new platform at "left", "right", or "center"
  //instantiate a cylinder (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  var platformGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 50, false);
  var platformMaterial = new THREE.MeshPhongMaterial({color: "green", wireframe: USE_WIREFRAME});
  var platform = new THREE.Mesh(platformGeometry, platformMaterial);
  var y = platform.geometry.parameters.height / 2; //bottom of platform touches floor
  var x = position === "left" ? -floor.geometry.parameters.width / 4 :
          position === "right" ? floor.geometry.parameters.width / 4 :
          position === "center" ? 0 :
          floor.geometry.parameters.width / 2; //if nothing is provided, place platform in center
  var z = 0; //place it in the center of the floor

  platform.position.set(x, y, 0); //set the position of the platform
  platform.receiveShadow = true; //allow the platform to receive shadows
  platform.castShadow = true; //allow the platform to cast shadows
  scene.add(platform);
}

function addFloor() {
  //instantiate a plane (width, height, widthSegments [opt], heightSegments [opt])
  var planeGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
  var planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, wireframe: USE_WIREFRAME});
  floor = new THREE.Mesh(planeGeometry, planeMaterial);
  floor.rotation.x -= Math.PI / 2;
  floor.receiveShadow = true; //tell the floor to receive shadows (note: floor does not need to cast shadows)
  scene.add(floor);
}

function letThereBeLight() {
  //instantiate a new light (color [opt], intensity [opt], distance, decay)
  light = new THREE.PointLight(0xffffff, 1, 30, 2); //decay = 2 for realistic light falloff
  light.position.set(-3, 6, -3); //set the position of the light
  light.castShadow = true; //allow the light to cast a shadow
  light.shadow.camera.near = 0.1; //cast a small shadow when near
  light.shadow.camera.far = 25; //cast a large shadow when far
  scene.add(light); //add the light to the scene
}

function buildRenderer() {
  renderer = new THREE.WebGLRenderer(); //instantiate the renderer
  renderer.setSize(screenWidth, screenHeight); //set the size of the renderer

  renderer.shadowMap.enabled = true; //enable shadows
  renderer.shadowMap.type = THREE.BasicShadowMap; //tell the renderer what type of shadow map to use

  document.body.appendChild(renderer.domElement); //append the renderer to the DOM
}

function animate(){
  requestAnimationFrame(animate); //recursively rerenders page (~60 fps)
  rotateCube();
  handleMovement();
  renderer.render(scene, camera);
}

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
    camera.rotation.y -= player.speed;
  }
  if(keyboard[68]){ //D key (turn left)
    camera.rotation.y += player.speed;
  }
  if(keyboard[81]){ //Q key (strafe left)
    camera.position.x += -Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[69]){ //E key (strafe right)
    camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[32]){
    camera.position.y += player.speed;
  }
  if(keyboard[88]){
    camera.position.y -= player.speed;
  }
}
function keyDown(event){
  keyboard[event.keyCode] = true;
}
function keyUp(event){
  keyboard[event.keyCode] = false;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;