// Import the shader code
import vsSource from './shaders/vertexShader.js';
import fsSource from './shaders/fragmentShader.js';

// Import helper functions
import { calcVertexColor } from './helper.js'

// Import mesh library
import { Mesh, LoopSubdivision } from './mesh.js';

let squareRotation = 0.0;
let deltaTime = 0;

main();

function main() {

  // Get the canvas declared in the html
  const canvas = document.getElementById("glcanvas");

  if (canvas == null) {
    alert ("Cannot instantiate canvas. Consider using vscode-preview-server.");
  }

  // Initialize the GL context
  /** @type {WebGLRenderingContext} */
  const gl = canvas.getContext("webgl"); // use "experimental-webgl" for Edge browser

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // load in the mesh (this reads all vertex and face information from the .obj file)
  var objStr = document.getElementById('cube.obj').innerHTML;
  var objmesh = new OBJ.Mesh(objStr);
  OBJ.initMeshBuffers(gl, objmesh);

  // custom Mesh class which contains Vertex, Edge, Face
  var mesh = new Mesh(objmesh.vertices, objmesh.indices);

  // subdivide the mesh with loop subdivision algorithm
  const num_subdiv = 4;
  for (var i = 0; i < num_subdiv; i++) {
    LoopSubdivision(mesh);
  }

  // get mesh vertices and colors for rendering
  const meshVertices = mesh.getVertices();
  var vertexColors = new Array(meshVertices.length/3*4).fill(1.0);
  for (var i = 0; i < meshVertices.length/3; i++) {
    var new_color = calcVertexColor();  
    for (var k = 0; k < 4; k++)
      vertexColors[4*i+k] = new_color[k];
  }
  
  // ===== Task 2a =====
  // get wireframe vertices
  const wireframeVectors = mesh.getWireframeVertices();

  // set wireframe colors to white
  var wireframeColors = new Array(wireframeVectors.length / 3 * 4).fill(1.0);
  // ===== End Task 2a =====

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Draw the scene
  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL);  // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // build the projection and model-view matrices
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // maps object space to world space
    // scale 7 along all axis
    const modelViewMatrix = mat4.fromValues(
          20,       0,         0,       0, 
          0,       20,         0,       0, 
          0,       0,         20,       0, 
          0,       0,         -60,       1
      );

    mat4.rotate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to rotate
      squareRotation/2, // amount to rotate in radians
      [0, 1, 1], // axis to rotate around
    ); 

    // set the shader program
    gl.useProgram(shaderProgram);

    var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    var vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);

    // bind the location of the uniform variables
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uProjectionMatrix"), false, projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uModelViewMatrix"), false, modelViewMatrix);

    // draw the mesh
    // Vertices
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Vertex Colors
    var tmpBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    // Vertex Indices
    var idcsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idcsBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    
    // draw the mesh as gl.TRIANGLES
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    
    // draw wireframe

    // ====== Task 2a =====
    // Bind wireframe vertices
    var cubeWireBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeWireBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireframeVectors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Bind wireframe colors
    var cubeWireColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeWireColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wireframeColors), gl.STATIC_DRAW);  
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    // draw wireframe as gl.LINES
    gl.drawArrays(gl.LINES, 0, wireframeVectors.length / 3);
    // ===== End Task 2a =====

    // rotation update based on the elapsed time
    squareRotation += deltaTime;

    // render the output on the screen
    requestAnimationFrame(render);
  }

  // render the output on the screen
  requestAnimationFrame(render);
}

// Initialize a shader program, so WebGL knows how to draw our data
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
