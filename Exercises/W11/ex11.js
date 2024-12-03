/*
----------------------------------------------------
----------------------------------------------------
Code for Exercise 11 in Visual Computing
at ETH Zurich as of Fall 2024.

In this exercise, you will be asked to compute 
the Phong illumination model, apply a normal 
map, and compute environment-based lighting,
----------------------------------------------------
----------------------------------------------------
*/

// Import the shader code
import vsSource from './shaders/vertexShader.js';
import fsSource from './shaders/fragmentShader.js';
import vsSkyboxSource from './shaders/skyboxVertexShader.js';
import fsSkyboxSource from './shaders/skyboxFragmentShader.js';

let squareRotation = 0.0;
let deltaTime = 0;

main();

// == HELPER FUNCTION FOR COLORING ORNAMENTS
function calcVertexColor(pCoordinate) {
  if (pCoordinate[1] < -8)
    return vec4.fromValues(1.0, 0.25, 0.25, 1.0);
  if (pCoordinate[1] < 9)
    return vec4.fromValues(0.25, 1.0, 0.25, 1.0);
  return vec4.fromValues(0.25, 0.25, 1.0, 1.0);
}


function main() {
  /** @type {WebGLRenderingContext} */

  // Get the canvas declared in the html
  const canvas = document.getElementById("glcanvas");

  if (canvas == null) {
    alert ("Cannot instantiate canvas. Consider using vscode-preview-server.");
  }
  // Initialize the GL context
  const gl = canvas.getContext("webgl"); // use "experimental-webgl" for Edge browser

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
  var objStr = document.getElementById("decorations.obj").innerHTML;
  var mesh = new OBJ.Mesh(objStr);
  console.log(mesh.tangents.length);
  OBJ.initMeshBuffers(gl, mesh);

  // Load texture
  const textureMap = loadTexture(gl, 'textures/bauble_BaseColor.png');
  // Load normal map
  const normalMap = loadTexture(gl, 'textures/bauble__normal.png');
  // Load environment map
  const envMap = loadCubeMap(gl);

  // Define camera settings and create projection matrix
  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  // Create the model matrix (new identity matrix)
  var modelMatrix = mat4.create();

  // Create skybox positions
  var positions = new Float32Array(
    [-1,  1,
      1, -1,
      -1, -1,
      -1,  1,
      1, -1,
      1,  1
    ]);
  
  
  // compute normals per vertex
  // let's make sure all the normals are zero
  for (var i = 0; i < mesh.vertices.length; i++) {
    mesh.vertexNormals[i] = 0;
    mesh.tangents[i] = 0;
    mesh.bitangents[i] = 0;
  }
  
  // helper function to extract vertex position from array of vertices
  function vec3FromArray(vertices, index) {
    return vec3.fromValues(vertices[3*index+0], vertices[3*index+1], vertices[3*index+2]);
  }

  // helper function to extract tex coordinates from arrray of coordinates
  function vec2FromArray(texcoords, index) {
    return vec2.fromValues(texcoords[2*index+0], texcoords[2*index+1]);
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

    /*
		Vectors a and b are two triangle edges.
		Vectors ta and tb are the corresponding vectors in texture coordinates.
		In texture coordinates, the tangent vector is (1, 0)^T and the bitangent is (0, 1)^T.
		We are looking for the corresponding tangent (T) and bitangent (B) vectors in 3D coordinates.
		In texture coordinates, we can represent the tangent and bitangent in terms of ta and tb
		using four coefficients xi_a, xi_b, eta_a and eta_b:

			(1, 0)^T = xi_a * ta + xi_b * tb
			(0, 1)^T = eta_a * ta + eta_b * tb

		On the other hand, we can represent T and B in terms of a and b using the same coefficients:

			T = xi_a * a + xi_b * b
			B = eta_a * a + eta_b * b

		The first two equations can be written as:

			I_2  = [ta, tb] * Minv
			Minv = [xi_a, eta_a; xi_b, eta_b]

		Where [ta, tb] is a 2x2 matrix containing the ta and tb as columns. Consequently:

			Minv = [ta, tb]^-1

		Rewriting the equations for T and B:

			[T, B] = [a, b] * Minv

		Note that [T, B] and [a, b] are 3x2 matrices.
		*/

    // get vertices in texture coordinates
    var t0 = vec2FromArray(mesh.textures, mesh.indices[3*i+0]);
    var t1 = vec2FromArray(mesh.textures, mesh.indices[3*i+1]);
    var t2 = vec2FromArray(mesh.textures, mesh.indices[3*i+2]);

    // get edges in texture space
    var ta = vec2.create();
    vec3.subtract(ta, t1, t0);
    var tb = vec2.create();
    vec3.subtract(tb, t2, t0);

    var M = mat2.create();
    M[0] = ta[0];
    M[1] = ta[1];
    M[2] = tb[0];
    M[3] = tb[1];

    var M_inv = mat2.create();
    mat2.invert(M_inv, M);

    // compute tangent and bitangent
    var tang = vec3.create();
    var bitang = vec3.create();

    // ================ TASK 3a) =======================
    // Compute the three coordinates of your tangent and 
    // bitangent. Don't forget to normalize.

    // TODO ...

    // ================ END TASK 3a) ===================


    // add normal to all vertex normals of this triangle
    for (var j = 0; j < 3; j++) {
      var vIndex = mesh.indices[3*i+j];
      for (var k = 0; k < 3; k++) {
        mesh.vertexNormals[3*vIndex+k] += n[k] * Math.acos(vec3.dot(a, b)); // Note: weighting by the angle is more accurate, but not necessary in this example (negligible effect)
        mesh.tangents[3*vIndex+k] += tang[k];
        mesh.bitangents[3*vIndex+k] += bitang[k];
      }
    }
  }
  
  // since we've added normals of all triangles a vertex is connected to, 
  // we need to normalize the vertex normal
  // we do the same for tangents and bitangents
  for (var i = 0; i < mesh.vertexNormals.length/3; i++) {
    var n = vec3FromArray(mesh.vertexNormals, i);
    vec3.normalize(n, n);
    var tang = vec3FromArray(mesh.tangents, i);
    vec3.normalize(tang, tang);
    var bitang = vec3FromArray(mesh.bitangents, i);
    vec3.normalize(bitang, bitang);

    // orthogonalize tangen and bitangent
    var scaledNormalTang = vec3.create();
    vec3.scale(scaledNormalTang, n, vec3.dot(n, tang));
    vec3.subtract(tang, tang, scaledNormalTang)
    var scaledNormalBiTang = vec3.create();
    vec3.scale(scaledNormalBiTang, n, vec3.dot(n, bitang));
    vec3.subtract(bitang, bitang, scaledNormalBiTang);
    vec3.normalize(tang, tang);
    vec3.normalize(bitang, bitang);

    // and copy back to mesh normal, tang, and bitang array
    for (var k = 0; k < 3; k++) {
      mesh.vertexNormals[3*i+k] = n[k];
      mesh.tangents[3*i+k] = tang[k];
      mesh.bitangents[3*i+k] = bitang[k];
    }
  }
 
  // Set the color of the vertices (optional)
  // initialize the color array (Hint: remember that mesh.vertices is of length 3 * number of vertices (x, y, z each))
  mesh.vertexColors = new Array(mesh.vertices.length/3*4).fill(1.0);

  // for each vertex set a custom color
  for (var i = 0; i < mesh.vertices.length/3; i++) {
    var new_color = calcVertexColor(vec3FromArray(mesh.vertices, i));  
    for (var k = 0; k < 4; k++)
      mesh.vertexColors[4*i+k] = new_color[k];
  }
 
  // initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.

  // ------------------
  // SKYBOX
  // ------------------
  const skyboxShaderProgram = initShaderProgram(gl, vsSkyboxSource, fsSkyboxSource);
  gl.useProgram(skyboxShaderProgram);
  setup_skybox()
  function setup_skybox() {
    var quadPosBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    var skyboxVertexLocation = gl.getAttribLocation(skyboxShaderProgram, "aPosition");
    gl.vertexAttribPointer(skyboxVertexLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(skyboxVertexLocation);
    // lookup uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envMap);
    var skyboxLocation = gl.getUniformLocation(skyboxShaderProgram, "uSamplerSkybox");
    gl.uniform1i(skyboxLocation, 0);
  }

  //---------------------------
  // BAUBLES
  // --------------------------
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  gl.useProgram(shaderProgram);
  setup_bauble()
  function setup_bauble(){
    // VERTICES
    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    var baublesVertexLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.vertexAttribPointer(baublesVertexLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(baublesVertexLocation);

    // VERTEX INDICES
    var idcsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idcsBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    // NORMALS
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
    var baublesNormallocation = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.vertexAttribPointer(baublesNormallocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(baublesNormallocation);

    // TANGENTS
    var tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.tangents), gl.STATIC_DRAW);
    var baublesTangentLocation = gl.getAttribLocation(shaderProgram, "aVertexTangent");
    gl.vertexAttribPointer(baublesTangentLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(baublesTangentLocation);

    // BITANGENTS
    var bitangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bitangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.bitangents), gl.STATIC_DRAW);
    var baublesBitangentLocation = gl.getAttribLocation(shaderProgram, "aVertexBitangent");
    gl.vertexAttribPointer(baublesBitangentLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(baublesBitangentLocation);

    // VERTEX COLORS
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexColors), gl.STATIC_DRAW);
    var baublesVertexColorsLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.vertexAttribPointer(baublesVertexColorsLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(baublesVertexColorsLocation);

    // TEXTURES
    // Handle texture coordinates
    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
    const texcoordLocation = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoordLocation);

    // Texture to shader
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureMap);
    var textureLocation = gl.getUniformLocation(shaderProgram, "uSamplerTexture")
    gl.uniform1i(textureLocation, 0);

    // NormalMap to shader
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normalMap);
    var normalMapLocation = gl.getUniformLocation(shaderProgram, "uSamplerNormalMap")
    gl.uniform1i(normalMapLocation, 1);

    // Environment map to shader
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envMap);
    const envMapLocation = gl.getUniformLocation(shaderProgram, "uSamplerEnvMap")
    gl.uniform1i(envMapLocation, 2);
  }

  // draw the scene
  let then = 0;

  // draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;
    
    // ------------------------
    // Render baubles
    // ------------------------
    gl.useProgram(shaderProgram);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // clear to black, fully opaque
    gl.clearDepth(1.0); // clear everything
    gl.enable(gl.DEPTH_TEST); // enable depth testing

    // clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setup_bauble();
    const viewMatrix = mat4.create();
    const viewSkyBoxMatrix = mat4.create();

    // view matrix for baubles
    mat4.translate(
      viewMatrix,
      viewMatrix,
      [0.0, -25.0, -60.0],
    );
    mat4.rotate(
      viewMatrix,
      viewMatrix,
      -3.14/2,
      [1, 0, 0],
    );
    mat4.rotate(
      viewMatrix,
      viewMatrix,
      +3.14/3,
      [0, 0, 1],
    );
    mat4.rotate(
      viewMatrix,
      viewMatrix,
      squareRotation/2,
      [0, 0, 1],
    );

    // view matrix for skybox
    mat4.translate(
      viewSkyBoxMatrix,
      viewSkyBoxMatrix,
      [0.0, -25.0, -60.0],
    );

    // Comment out the rotation below to avoid rotating around the skybox
    mat4.rotate(
      viewSkyBoxMatrix,
      viewSkyBoxMatrix,
      -squareRotation/2,
      [0, 1, 0],
    );

    // get current camera position
    const invViewMatrix = mat4.create();
    mat4.invert(invViewMatrix, viewMatrix);
    
    //indices for last row
    var cameraPos = vec4.fromValues(viewMatrix[3], viewMatrix[7], viewMatrix[11], 1.0);

    // create modelViewMatrix
    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    let r = 40.0;
    var lightPos = vec4.fromValues(Math.sin(1) * r, Math.cos(1) * r, 20.0, 1.0);
   
    // create modelNormalMatrix (M_model^-T)
    const modelNormalMatrix = mat4.create();
    mat4.invert(modelNormalMatrix, modelMatrix);
    mat4.transpose(modelNormalMatrix, modelNormalMatrix);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      false,
      projectionMatrix
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shaderProgram, "uModelMatrix"),
        false,
        modelMatrix,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(shaderProgram, "uModelNormalMatrix"),
      false,
      modelNormalMatrix,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(shaderProgram, "uViewMatrix"),
      false,
      viewMatrix,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      false,
      modelViewMatrix,
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(shaderProgram, "uViewSkyboxMatrix"),
      false,
      viewSkyBoxMatrix,
    );
    gl.uniform4fv(
      gl.getUniformLocation(shaderProgram, "lightPos"),
      lightPos,
    );
    gl.uniform4fv(
      gl.getUniformLocation(shaderProgram, "cameraPos"),
      cameraPos,
    );
    gl.depthFunc(gl.LEQUAL); // near things obscure far things
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);

    // ------------------------
    // Render skybox
    // ------------------------
    gl.useProgram(skyboxShaderProgram);
    // create inverted projectionViewMatrix for skybox
    setup_skybox();
    var projectionViewMatrix = mat4.create();
    mat4.multiply(projectionViewMatrix, projectionMatrix, viewSkyBoxMatrix);
    projectionViewMatrix[3] = 0.0;
    projectionViewMatrix[7] = 0.0;
    projectionViewMatrix[11] = 0.0;
    var projectionViewInvMatrix = mat4.create();
    mat4.invert(projectionViewInvMatrix, projectionViewMatrix);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(skyboxShaderProgram, "uProjectionMatrix"),
      false,
      projectionMatrix
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(skyboxShaderProgram, "uViewMatrix"),
      false,
      viewMatrix
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(skyboxShaderProgram, "uProjectionViewInvMatrix"),
      false,
      projectionViewInvMatrix
    );

    // Let quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);

    squareRotation += deltaTime;
    requestAnimationFrame(render);
  }
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

// Creates a shader of the given type, uploads the source and
// compiles it.
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

// Loads six images into a cubemap.
function loadCubeMap(gl){
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
     
  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
      url: 'cubemaps/christmas_polyhaven/px.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
      url: 'cubemaps/christmas_polyhaven/nx.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
      url: 'cubemaps/christmas_polyhaven/py.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
      url: 'cubemaps/christmas_polyhaven/ny.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
      url: 'cubemaps/christmas_polyhaven/pz.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
      url: 'cubemaps/christmas_polyhaven/nz.png',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;
     
    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1024;
    const height = 1024;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
     
    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
     
    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded upload it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return texture;
}

// Loads a texture image to a texture object.
function loadTexture(gl, url) {
  // Create a WebGL texture object
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE; // reads to [0, 255] range, otherwise we would need gl.FLOAT
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  // Create an image object so that we can load an image from file
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  // Assigned url is the path to the image 
  image.src = url;

  return texture;
}

// Checks if image diemensions are power of two.
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}