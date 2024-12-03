export default /*glsl*/`
  precision highp float;
  uniform vec4 uCameraPos;             // camera position in world coordinates
  uniform sampler2D uSamplerTexture;   // sampler bauble texture
  uniform sampler2D uSamplerNormalMap; // sampler normal map
  uniform samplerCube uSamplerEnvMap;  // sampler environment map
  uniform mat4 uViewSkyboxMatrix;      // inverted view matrix for skybox

  varying vec4 world_normal;
  varying vec4 world_pos;
  varying vec4 world_light;
  varying vec4 color;
  varying vec2 texCoord;
  varying vec4 world_tang;
  varying vec4 world_bitang;


  // ======== TASK 1a) ========
  // Given the position of the pixel, its normal vector, the position of the camera and the position of the light,
  // (all in world coordinates), compute a 2D vector that contains in its first component the intensity of
  // the diffuse light and in its second component the intensity of the specular light.
  vec2 computeDiffuseSpecIntens(in vec3 position, in vec3 normal, in vec3 cameraPos, in vec3 lightPos)
  {
    // TODO ...

    return vec2(1, 0);	    // Return dummy value
  }
  // ====== END TASK 1a) ======


  void main(void) {
    float ambient=0.3;
    float diffuse=0.9;
    float specular=0.5;


    // ======== TASK 2b) ========
    // Perform a texture lookup into bauble texture.
    // TODO ...

    vec4 txtColor = color;    // Return RGB color value
    // ======== END TASK 2b) ========


    // ======== TASK 3a) ========
    // Perturb the normals using normal map. Look up the RGB color values in the normal map
    // and use them to perturb the world tangent, world bitangent and world normal.
    // TODO ...
  
    vec3 normal = normalize(world_normal.xyz);  // Use pre-computed world normals
    // ======== END TASK 3a) ========
    

    // Phong model
    vec2 diffuseIntensitySpec = computeDiffuseSpecIntens(world_pos.xyz, normal, uCameraPos.xyz, world_light.xyz);
    vec4 vColor = txtColor*(diffuseIntensitySpec.x * diffuse + diffuseIntensitySpec.y * specular + ambient);
    vColor[3] = 1.0;


    // ======== TASK 4a) ========
    // Image-based lighting. Reflect the 'camera to pixel' vector at the normal and use this reflected vector
    // to perform a texture lookup into the cube map 'txtEnvMap', using the 'textureCube' command.
    // TODO ...

    vec4 colReflected = vec4(0.0, 0.0, 0.0, 0.0);  // Use dummy value
    // ======== END TASK 4a) ========
	
    
    gl_FragColor = vColor + 0.8 * colReflected; 
  } 
  `;
 