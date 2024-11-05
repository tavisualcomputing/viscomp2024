export default `
  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform vec4 lightPos;

  varying lowp vec4 vColor;

  float computeDiffuseIntens(in vec3 position, in vec3 normal, in vec3 lightPos)
  {
    normal = normalize(normal);
    vec3 vecToLight = normalize(lightPos.xyz - position.xyz);
    
    float diffuseIntensity = dot(normal, vecToLight);
    diffuseIntensity = clamp(diffuseIntensity, 0.0, 1.0);
    
    return diffuseIntensity;
  }

  void main(void) {

    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    float diffuseIntensity = computeDiffuseIntens(aVertexPosition.xyz, aVertexNormal, lightPos.xyz);
    float ambientIntensity = 0.8; // some value between 0.0 and 1.0
    vColor = vec4(0.3, 0.3, 0.3, 1.0) * (diffuseIntensity + ambientIntensity) / 2.0;
    vColor[3] = 1.0;
  }
  `;
