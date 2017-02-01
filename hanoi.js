if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

//WebGL boilerplate global variables
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
var orbitControls;

//Global object to track state of disk
var currentDisc = {
  radius: 0,
  originalX: -10, //all the discs start at -10
  releasedX: -10, //same as originalX since none have been picked up
  isMoved() {
    return Math.abs( currentDisc.originalX - currentDisc.releasedX )  >= 5 ?  true : false;
  },
  newPlatform() {
    if ( currentDisc.releasedX <= -5 ) {
      return rightTower;
    } else if ( currentDisc.releasedX > -5 && currentDisc.releasedX <= 5 ) {
      return centerTower;
    } else if ( currentDisc.releasedX > 5 ) {
      return leftTower;
    }
  },
  oldPlatform() {
    if ( currentDisc.originalX <= -5 ) {
      return rightTower;
    } else if ( currentDisc.originalX > -5 && currentDisc.originalX <= 5 ) {
      return centerTower;
    } else if ( currentDisc.originalX > 5 ) {
      return leftTower;
    }
  }
};

//Instantiate globally accessible tower arrays
var leftTower = ["left"];
var centerTower = ["center"];
var rightTower = ["right"];



/************************
** Initialize Function **
*************************/
function init() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0xff0000 );

  camera = new THREE.PerspectiveCamera(90, screenWidth / screenHeight, 0.1, 1000);

  camera.position.set(0, movementSettings.height, -20); //set the starting position of the camera (x, y, z)
  camera.lookAt(new THREE.Vector3(0,0,0)); //tell the camera what to look at

  buildRenderer(); //build the renderer

  /*
    Instantiate object controls
  */
  objectControls = new ObjectControls( camera ); //initialize controls in ObjectControls library

  /*
    Instantiate orbit controls
  */
  orbitControls = new THREE.OrbitControls( camera ); //add orbit controls so user can click and look around intuitively
  orbitControls.addEventListener( 'change', render ); //tell orbit controls to render
  orbitControls.maxPolarAngle = 0.99 * (Math.PI/2); //don't let it go below the ground
  //the .99 in the line above prevents the camera from going to the plane even with the ground and making the ground disappear

  createIntersectionPlane(); //add a plane for the discs to move along when dragged



  addFloor(); //add a floor to the scene
  addPlatformAt("left"); //add left platform to the scene
  addPlatformAt("right"); //add right platform to the scene
  addPlatformAt("center"); //add center platform to the scene

  loadTowerArrays(); //load up the initial tower arrays

  letThereBeLight(); //add a point light and ambient to the scene
  addSpotlight(); //

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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; //tell the renderer what type of shadow map to use

  renderer.gammaInput = true;
  renderer.gammaOutput = true;


  document.body.appendChild(renderer.domElement); //append the renderer to the DOM
}

function animate(){
  requestAnimationFrame(animate); //recursively rerenders page (~60 fps)
  handleMovement(); //allow and update keyboard movements
  objectControls.update(); //update the object controls
  orbitControls.update();

  render();
}

function render() {
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
  var y = stackPosition === 1 ? 0.4 + (stackPosition * disc.geometry.parameters.height / 2) :
                                (stackPosition * (disc.geometry.parameters.height)); //place the cylinder on top of the platform
  var x = 10; //place the cylinder in the center of the left platform
  var z = 0; //place it in the center of the floor

  var hoverMaterial = new THREE.MeshBasicMaterial({ color: 0x55ff88 }); //when hovering over a disc, change the color & material

  disc.hoverOver = function() { //when hovering over a disc, change its color
    this.material = hoverMaterial;
  }.bind( disc );
  disc.hoverOut = function() { //change back to normal color on hover out
    this.material = discMaterial;
  }.bind( disc ); //bind the method context to the selected disc

  disc.select = function() { //allow the disc to move when selected
    currentDisc.originalX = this.position.x; //set the original x position of the disc on select in case it has to go back
    currentDisc.radius = this.geometry.parameters.radiusTop; //set the current disc radius to the selected disc radius

    intersectionPlane.position.copy( this.position ); //TODO: Figure out what this does.

    //overwrite the tower values so they only contain data from most recent move
    leftTower = ["left"];
    centerTower = ["center"];
    rightTower = ["right"];
    loadTowerArrays(); //load the tower arrays in order to determine whether this thing is allowed to move

  }.bind( disc ); //bind the method context to the selected disc

  disc.deselect = function snapIntoPlace() { //when the disc is deselected, snap it into place (if the move is legal)
    currentDisc.releasedX = this.position.x; //the position the disc is released at

    if(currentDisc.isMoved()){ //everything that happens here assumes that the disc is moveable
      var newTower = currentDisc.newPlatform(); //get the platform the disc is being moved to
      var oldTower = currentDisc.oldPlatform(); //get the platform the disc is being moved from
      if ( newTower.length > 1) { //if there are any discs already in the new tower
        var topDiscRadius = newTower[newTower.length - 1].geometry.parameters.radiusTop; //get the top disc radius
        if ( currentDisc.radius > topDiscRadius ) { //if the current disc radius is larger than the top disc radius
          this.position.x = currentDisc.originalX; // Illegal move - send the current disc back to its original position
          console.log("Nope"); //nooooope nope nope nope
        } else if ( currentDisc.radius < topDiscRadius ){ // if the current disc radius is smaller than the top disc radius
          this.position.x = newTower[1].position.x; //throw that disc on the tower!
          oldTower.splice(oldTower.indexOf(this), 1); //remove it from the oldTower array
          newTower.push(this); //add it to the newTower array
        }
      } else if ( newTower.length === 1 ){ //if there are no other discs in the center tower
        oldTower.splice(oldTower.indexOf(this), 1); //remove it from the old tower
        newTower.push(this); //add it to the new tower
      }
    }

    //TODO: Refactor these for loops to make code DRY.
    //These are responsible for going through the tower arrays and making sure everything is in the right spot.
    for(var i = 1; i < leftTower.length; i++) { //for all meshes in left tower
      leftTower[i].position.x = 10; //snap them to x position 10 on mouse release
      leftTower[i].position.y = i * leftTower[i].geometry.parameters.height;
    }
    for(var i = 1; i < centerTower.length; i++) { //for all meshes in center tower
      centerTower[i].position.x = 0; //snap them to x position 0 on mouse release
      centerTower[i].position.y = i * centerTower[i].geometry.parameters.height;
    }
    for(var i = 1; i < rightTower.length; i++) { //for all meshes in right tower
      rightTower[i].position.x = -10; //snap them to x position -10 on mouse release
      rightTower[i].position.y = i * rightTower[i].geometry.parameters.height;
    }
  }.bind( disc ); //bind the method context to the selected disc

  disc.update = function() {
    var raycaster = objectControls.raycaster;
    var i = raycaster.intersectObject( intersectionPlane );

    /*
    Important game logic:
    most recently added disc will be saved in index 1 of its tower and everything gets pushed up,
    so only allow the disc to move if it is the last index in it's tower
    */
    if (leftTower.indexOf(this) !== -1) { //if selected disc is in left tower
      var moveable = leftTower.indexOf(this) === leftTower.length - 1 ? true : false; //if it is the last disc to be added to the tower, it is on top of the tower, and is therefore moveable
      if (moveable) {
        this.position.copy( i[0].point ); //voodoo magic that allows this disc to move... TODO: Figure out how this works.
      }
    } else if (centerTower.indexOf(this) !== -1) { //if selected disc is in center tower
      var moveable = centerTower.indexOf(this) === centerTower.length - 1 ? true : false; //if it is the last disc to be added to the tower, it is on top of the tower, and is therefore moveable
      if (moveable) {
        this.position.copy( i[0].point ); //more voodoo - does it have to do with the Raycaster?
      }
    } else if (rightTower.indexOf(this) !== -1) { //if selected disc is in right tower
      var moveable = rightTower.indexOf(this) === rightTower.length - 1 ? true : false; //if it is the last disc to be added to the tower, it is on top of the tower, and is therefore moveable
      if (moveable) {
        this.position.copy( i[0].point ); //woogly woogly woogly
      }
    }
  }.bind( disc ); //bind the method context to the selected disc

  disc.position.set(x, y, z); //set the position of the cylinder
  disc.receiveShadow = true; //allow each disc to receive shadows
  disc.castShadow = true; //allow each disc to cast shadows
  scene.add(disc); //add the disc to the scene
  discArray.push(disc); //push the disc to the discArray to make it globally accessible
  objectControls.add(disc); //disc can be controlled
}

function loadTowerArrays() {
  for(var i = 0; i < discArray.length; i++) {
    let xPosition = discArray[i].position.x;
    if(xPosition >= 5) {
      leftTower.push(discArray[i]);
    } else if (xPosition < 5 && xPosition > -5) {
      centerTower.push(discArray[i]);
    } else if (xPosition < -5) {
      rightTower.push(discArray[i]);
    }
  }
}

function addPlatformAt(position) { //add a new platform at "left", "right", or "center"
  //instantiate a cylinder (radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
  var platformGeometry = new THREE.CylinderGeometry(4, 4, 0.4, 50, false);
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
  var pointLight = new THREE.PointLight(0xffffff, 1.5, 100, 1.5); //decay = 2 for realistic light falloff
  pointLight.position.set(-3, 6, -6); //set the position of the light
  pointLight.castShadow = true; //allow the light to cast a shadow
  pointLight.shadow.camera.near = 0.1; //cast a small shadow when near
  pointLight.shadow.camera.far = 25; //cast a large shadow when far
  scene.add(pointLight); //add the point light to the scene

  //instantiate a new ambient light
  // var ambientLight = new THREE.AmbientLight( 0xffffff );
  // scene.add( ambientLight );
}

function addSpotlight() {
  var spotLight = new THREE.SpotLight( 0xffffff, 2 );
  spotLight.position.set(-10, 50, 0);
  spotLight.castShadow = true;
  spotLight.angle = 0.15;
  spotLight.penumbra = 1;
  spotLight.decay = 2;
  spotLight.distance = 200;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 1;
  spotLight.shadow.camera.far = 200;
  spotLight.target.position.set( -10 , 0, 0 );

  scene.add( spotLight );
  scene.add( spotLight.target );
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
  if(keyboard[81]){ //Q key (move left)
    camera.position.x += -Math.sin(camera.rotation.y - Math.PI/2) * movementSettings.speed;
    camera.position.z += Math.cos(camera.rotation.y - Math.PI/2) * movementSettings.speed;
  }
  if(keyboard[69]){ //E key (move right)
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
