export default /*glsl*/`
  precision highp float;
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;
  attribute vec3 aVertexTangent;
  attribute vec3 aVertexBitangent;
  
  uniform vec4 lightPos;

  uniform mat4 uModelMatrix;        // M_model
  uniform mat4 uModelNormalMatrix;  // M_model^-T
  uniform mat4 uViewMatrix;         // M_view
  uniform mat4 uModelViewMatrix;    // M_view * M_model
  uniform mat4 uProjectionMatrix;   // M_projection

  varying vec4 world_normal;
  varying vec4 world_pos;
  varying vec4 world_light;
  varying vec4 world_tang;
  varying vec4 world_bitang;
  varying vec4 color;
  varying vec2 texCoord;

  void main(void) {
    world_normal = uViewMatrix *  uModelNormalMatrix * vec4(aVertexNormal, 0.0);
    world_pos = uModelViewMatrix * aVertexPosition;
    world_light =  uModelViewMatrix * lightPos;
    world_tang = uViewMatrix * uModelNormalMatrix * vec4(aVertexTangent, 0.0);
	  world_bitang = uViewMatrix * uModelNormalMatrix * vec4(aVertexBitangent, 0.0);

    gl_Position = uProjectionMatrix * world_pos;
    color = aVertexColor;
    texCoord = aTextureCoord;
  }
  `;

