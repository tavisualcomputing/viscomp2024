// 
// All the shader code ...
// No need to change this part!
//
var fsFloorSource = /*glsl*/ `
precision highp float;
varying lowp vec4 position; 

void main(void) {
    vec4 p = position; 
    vec2 ab = .1 * p.xz;
    vec3 A = .25 + .25 * vec3(sin(ab.x), sin(ab.y), 1.);
    vec2 uv = floor(p.xz);
    vec3 B = .5 - .5 * vec3(mod(uv.x + uv.y, 2.));
    gl_FragColor = vec4(mix(A, B, .5), 1.);
}
`;

var vsFloorSource = /*glsl*/ `
attribute vec4 vPosition;
attribute vec4 vColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 position; 
varying lowp vec4 color; 

void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vPosition;
    color = vec4(0.1, 0.1, 0.1, 1.0);
    position = vPosition;
} 
`;

var fsSource = /*glsl*/ `
varying lowp vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
} 
`;

var vsSource = /*glsl*/ `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uModelNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uLightPos;

varying lowp vec4 vColor;

float computeDiffuseIntens(in vec4 position, in vec3 normal, in vec4 lightPos)
{
  // since the lightPos is in world coordinates, need to transform the vertex position and normal first
  position = uModelMatrix * position;
  normal = (uModelNormalMatrix * vec4(normal, 0.0)).xyz;
  normal = normalize(normal);    
  
  // compute the light direction
  vec3 vecToLight = normalize(lightPos.xyz - position.xyz);
  
  // the intensity is proportional to the angle between the surface and the light direction
  float diffuseIntensity = dot(normal, vecToLight);
  diffuseIntensity = clamp(diffuseIntensity, 0.0, 1.0);
  
  return diffuseIntensity;
}

void main(void) {

  // transform the vertex position from object space to camera space 
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  // === very simplistic lighting model ===
  float ambientIntensity = 0.3; // controls how much ambient light there is in the scene, some value between 0.0 and 1.0
  float diffuseIntensity = computeDiffuseIntens(aVertexPosition, aVertexNormal, uLightPos); // accounts for direct light
  vColor = aVertexColor * (diffuseIntensity + ambientIntensity);
  
  // make sure we don't overshoot
  vColor = clamp(vColor, 0.0, 1.0);
  vColor[3] = 1.0; // alpha value
}
`;
///////////////////////////////////////////////////////////////////////

//
// Initialize WebGL rendering context
//
var canvas = document.getElementById("canvas");
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var gl = canvas.getContext('webgl');

var textCanvas = document.getElementById("text");
textCanvas.width = document.body.clientWidth;
textCanvas.height = document.body.clientHeight;
var ctx = textCanvas.getContext("2d");

// Shader programs
var floorShaderProgram = initShaderProgram(gl, vsFloorSource, fsFloorSource);
var objectShaderProgram = initShaderProgram(gl, vsSource, fsSource);
var shaderPrograms = [floorShaderProgram, objectShaderProgram];

// Helper for setting the projection, view, and model matrices (and optionally the light position)
function setPVM(P, V, M, lightPos=null) { 
  let VM = mat4.create(); // uModelViewMatrix
  mat4.multiply(VM, V, M); 

  let Mn = mat4.create(); // uModelNormalMatrix
  mat4.invert(Mn, M);
  mat4.transpose(Mn, Mn);
  
  shaderPrograms.forEach(shaderProgram => {
      gl.useProgram(shaderProgram);
      const uModelMatrix = gl.getUniformLocation(shaderProgram, 'uModelMatrix');
      const uModelNormalMatrix = gl.getUniformLocation(shaderProgram, 'uModelNormalMatrix');
      const uModelViewMatrix  = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
      const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
      gl.uniformMatrix4fv(uModelMatrix, false, M);
      gl.uniformMatrix4fv(uModelNormalMatrix, false, Mn);
      gl.uniformMatrix4fv(uModelViewMatrix, false, VM);
      gl.uniformMatrix4fv(uProjectionMatrix, false, P);

      if (lightPos != null) {
        const uLightPos = gl.getUniformLocation(shaderProgram, 'uLightPos');
        gl.uniform4fv(uLightPos, lightPos);
      }
  });
} 

/////////////////////////////////////////////////////

var globalTime = 0.;
var shouldRotate = false;

var camUp = [0., 1., 0.]; // camera up-vector
var camPos = [0., 1., 0.]; // initial camera position
var camDir = [0, 0, -1.]; // camera viewing direction
var lightPos = [-50, 50, 20., 1]; // initial light position

var objectRotation = [-Math.PI/2, 0., 0.]; // initial object rotation
var objectPosition = [0., -4., -70.]; // initial object position
var objectScale = [.05, .05, .05]; // initial object scaling

// Variables for handling keyboard and mouse events
var isMousePressed = false;
var mouseButtonPressed = -1;
var mousePosLast = [0,0];
var keyPressed = new Map();

//
// Mouse and keyboard event handling functions
// 
function mouseDown(event) {
  mouseButtonPressed = event.which;
  isMousePressed = true;
}

function mouseUp() {
  isMousePressed = false;
}

function mouseMoved(event){
  var x = [event.clientX/canvas.width, event.clientY/canvas.height];
  
  if(isMousePressed) {
    if(mouseButtonPressed == 1 && !event.shiftKey) {
      rotateCameraY((x[0] - mousePosLast[0])*2);
      rotateCameraX((x[1] - mousePosLast[1])*2);
    }
    else if(mouseButtonPressed == 1 && event.shiftKey){
      objectRotation[1] += 2*(x[0] - mousePosLast[0]);
      objectRotation[0] += 2*(x[1] - mousePosLast[1]);
    }
  }
  mousePosLast = x;
}

// ====== TASK 2 ======
function moveCamera(dist, sideways) {

  // Move the camera by 'dist' either forward/backward or sideways
  // Hint: compute the direction of the translation first,
  // then translate 'camPos' by the appropriate amount in this direction.
  // Helpful functions: vec3.cross(...), vec3.scale(...), vec3.add(...)
  
  var d = camDir.slice();
  if(sideways) {
      vec3.cross(d, camUp, d); // gives the third axis of camera coordinate system (direction of movement)
  }
  vec3.scale(d, d, dist); // scale the direction by the distance
  vec3.add(camPos, camPos, d); // translate the camera position by that distance vector

}

function rotateCameraY(angle) {

  // Rotate the camera by 'angle' around the y-axis.
  // Hint: use vec.rotateY(...) (what's the origin of rotation?)
  
  var origin = camPos; // rotate around the camera center
  vec3.rotateY(camDir, camDir, origin, angle);

}

function rotateCameraX(angle) {

  // Rotate the camera by 'angle' around the x-axis.
  // Hint: use vec.rotateX(...) (what's the origin of rotation?)
 
  var origin = camPos; // rotate around the camera center
  vec3.rotateX(camDir, camDir, origin, angle);

}

function moveLight(d) {

  // Translate the light position by 'd'
  vec3.add(lightPos, lightPos, d);

}
// ==== END TASK 2 ====

function keyDown(event) {

  if(event.code == 'Space')
      shouldRotate = !shouldRotate;
  else
    keyPressed.set(event.code, true);
}

function keyUp(event){
  keyPressed.set(event.code, false);
}

function processKeyPressed(){

  keyPressed.forEach(function(value, key){
    if(value){
      switch(key){
        case 'KeyW': moveCamera(0.1, false); break;
        case 'KeyS': moveCamera(-0.1, false); break;
        case 'KeyA': moveCamera(0.1, true); break;
        case 'KeyD': moveCamera(-0.1, true); break;
        case 'KeyE': rotateCameraY(-0.02); break;
        case 'KeyQ': rotateCameraY(0.02); break;
        case 'KeyI': moveLight([0, 0, -1]); break;
        case 'KeyK': moveLight([0, 0, 1]); break;
        case 'KeyL': moveLight([1, 0, 0]); break;
        case 'KeyJ': moveLight([-1, 0, 0]); break;
        case 'KeyU': moveLight([0, -1, 0]); break;
        case 'KeyO': moveLight([0, 1, 0]); break;
        case 'ArrowUp': objectPosition[2] -= 0.1; break;
        case 'ArrowDown': objectPosition[2] += 0.1; break;
        case 'ArrowLeft': objectPosition[0] -= 0.1; break;
        case 'ArrowRight': objectPosition[0] += 0.1; break;
      }
    }
  });

}

// ====== TASK 1 ======
function getCameraMatrix() { 

  // Calculate the camera matrix (see the ModelView transform from the lecture slides)
  let TR = mat4.create();
  
  // Hints: use mat4.targetTo(TR, eye, target, upvec) and the variables defined in lines 141-143
  // 'eye' is the camera position
  // 'target' is where the camera points at
  // 'upvec' is to ensure that the camera is oriented upwards

  let eye = camPos;
  var target = [0., 0., 0.];
  vec3.add(target, camPos, camDir); // target is current position + viewing direction
  mat4.targetTo(TR, eye, target, camUp);

  return TR; 
}

function getViewMatrix() { 

  // Calculate the view matrix
  let V = mat4.create();

  // Hint: the view matrix does the opposite of the camera matrix (why?)
  mat4.invert(V, getCameraMatrix());

  return V; 
}

function getModelMatrix() {
  
  // Calculate the model matrix
  let M = mat4.create();

  // Hint: take a look at the object variables in lines 146-148.
  // Construct the model matrix by applying the corresponding transformations in that order
  // such that a point is first rotated, then translated, then scaled (keep in mind that the first transformation is applied last)
  // Helpful functions: mat4.rotateX(...), mat4.translate(...), mat4.scale(...)
  
  // Note: Transformations are to be listed in reverse order because the points are multiplied from the right.
  // The order can be changed arbitrarily, but beware that then the scaling factor, translation vector, and rotation axes change as well (!)
  mat4.scale(M, M, objectScale);
  mat4.translate(M, M, objectPosition); 
  mat4.rotateX(M, M, objectRotation[0]);
  mat4.rotateY(M, M, objectRotation[1]);
  mat4.rotateZ(M, M, objectRotation[2]);

  // Rotation around the object's z-axis (camera's y-axis) for when pressing the space key
  mat4.rotateZ(M, M, globalTime);

  return M;
}
// ==== END TASK 1 ====

function getProjectionMatrix() {
  const fieldOfView = 45. * Math.PI / 180.;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  let P = mat4.create(); 
  mat4.perspective(P, fieldOfView, aspect, zNear, zFar);
  return P;
}

// Floor tiles
let d = 50.;
const floor_vertices = [ d, 0., d,  -d, 0., d,  d, 0., -d, d, 0., -d, -d, 0., d, -d, 0., -d];

let squareRotation = 0.0;
let deltaTime = 0;

main();

function main() {
  /** @type {WebGLRenderingContext} */

  if (canvas == null || textCanvas == null) {
    alert ("Cannot instantiate canvas. Consider using vscode-preview-server.");
  }
  
  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // We use unsigned short (16bit) to represent vertex indices. Uncomment the line below if you want
  // to use unsigned ints (i.e., if there are more than 2^16 vertices, up to 2^32 vertices). And don't
  // forget to adjust the array type from Uint16 to Uint32 when initializing the index buffer.
  // ...
  // gl.getExtension('OES_element_index_uint');

  // load in the mesh (this reads all vertex and face information from the .obj file)
  var objStr = document.getElementById('decorations.obj').innerHTML;
  var mesh = new OBJ.Mesh(objStr);
  OBJ.initMeshBuffers(gl, mesh);

  // calculate vertex normals and colors (see exercise 06)
  calcNormalsAndColors(mesh);

  // Draw the scene repeatedly
  function render() {

    if(shouldRotate)
      globalTime += .01; 

    // Handle key events
    processKeyPressed();

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Get the P, V, and M matrices and bind them to the shader files
    let P = getProjectionMatrix(); 
    let V = getViewMatrix(); 
    let M = getModelMatrix();
    let M_floor = mat4.create();

    // Draw the floor first
    setPVM(P, V, M_floor);
    drawFloor();
    
    // Then draw the object
    setPVM(P, V, M, lightPos);
    drawObject();

    // Text to display key instructions
    const lineHeight = 30;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "bold 24px monospace ";
    ctx.fillStyle = "#ffffff";
    var controlText = [
      "controls:",
      "  camera move  : AD/WS",
      "  camera rotate: QE or leftclick + drag",
      "  object move  : arrows",
      "  object rotate: shift + leftclick + drag",
      "  auto-rotate  : space",
      "  move light   : JL/UO/IK",
    ];
    for (var i = 0; i < controlText.length; i++) {
      ctx.fillText(controlText[i], 0, (i+1)*lineHeight);
    }

    var infoText = [
      "light position:",
      "  "+lightPos.slice(0, 3),
    ];
    for (var i = 0; i < infoText.length; i++) {
      ctx.fillText(infoText[i], 0, (controlText.length+i+1)*lineHeight);
    }

    // Render the output on the screen
    requestAnimationFrame(render);
  }

  // Render the output on the screen
  requestAnimationFrame(render);

  // Helper function for drawing the floor
  function drawFloor() {
    gl.useProgram(floorShaderProgram);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floor_vertices), gl.STATIC_DRAW);
    const vPosition = gl.getAttribLocation(floorShaderProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Helper function for drawing the object (code from solution 06)
  function drawObject() {
    
    // Vertices
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    var location = gl.getAttribLocation(objectShaderProgram, "aVertexPosition");
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);

    // Vertex Normals
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
    var location = gl.getAttribLocation(objectShaderProgram, "aVertexNormal");
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);

    // Vertex Colors
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexColors), gl.STATIC_DRAW);
    var location = gl.getAttribLocation(objectShaderProgram, "aVertexColor");
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);

    // Faces (i.e., vertex indices for forming the triangles)
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tmpBuffer);

    // Draw the mesh
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

// ========= HELPER FUNCTIONS =========

// Helper: Calculate the vertex normals and colors (see exercise 06)
function calcNormalsAndColors(mesh) {
  
  // initialize the normals to zero (will overwrite later)
  for (var i = 0; i < mesh.vertices.length; i++) {
    mesh.vertexNormals[i] = 0;
  }
  
  // helper function to extract vertex position from array of vertices
  function vec3FromArray(vertices, index) {
    return vec3.fromValues(vertices[3*index+0], vertices[3*index+1], vertices[3*index+2]);
  }

  // go through all triangles
  for (var i = 0; i < mesh.indices.length/3; i++) {
    // get vertices of this triangle
    var v0 = vec3FromArray(mesh.vertices, mesh.indices[3*i+0]);
    var v1 = vec3FromArray(mesh.vertices, mesh.indices[3*i+1]);
    var v2 = vec3FromArray(mesh.vertices, mesh.indices[3*i+2]);
    // compute edges `a` and `b`
    var a = vec3.create();
    vec3.subtract(a, v1, v0);
    var b = vec3.create();
    vec3.subtract(b, v2, v0);
    // normal is normalized cross product of edges
    var n = vec3.create();
    vec3.cross(n, a, b);
    vec3.normalize(n, n);
    // add normal to all vertex normals of this triangle
    for (var j = 0; j < 3; j++) {
      var vIndex = mesh.indices[3*i+j];
      for (var k = 0; k < 3; k++) {
        mesh.vertexNormals[3*vIndex+k] += n[k] * Math.acos(vec3.dot(a, b)); // Note: weighting by the angle is more accurate, but not necessary in this example (negligible effect)
      }
    }
  }
  
  // since we've added normals of all triangles a vertex is connected to, 
  // we need to normalize the vertex normals
  for (var i = 0; i < mesh.vertexNormals.length/3; i++) {
    var n = vec3FromArray(mesh.vertexNormals, i);
    vec3.normalize(n, n);
    // and copy back to mesh normal array
    for (var k = 0; k < 3; k++) {
      mesh.vertexNormals[3*i+k] = n[k];
    }
  }

  // initialize the color array (Hint: remember that mesh.vertices is of length 3 * number of vertices (x, y, z each))
  mesh.vertexColors = new Array(mesh.vertices.length/3*4).fill(1.0);

  // for each vertex set a custom color
  for (var i = 0; i < mesh.vertices.length/3; i++) {
    var new_color = calcVertexColor(vec3FromArray(mesh.vertices, i));  
    for (var k = 0; k < 4; k++)
      mesh.vertexColors[4*i+k] = new_color[k];
  }
}

// Helper: Calculate the new vertex color
function calcVertexColor(pCoordinate) {
  if (pCoordinate[1] < -8)
    return vec4.fromValues(0.8, 0.25, 0.25, 1.0);
  if (pCoordinate[1] < 9)
    return vec4.fromValues(0.25, 0.8, 0.25, 1.0);
  return vec4.fromValues(0.25, 0.25, 1.0, 1.0);
}

// Helper: Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
