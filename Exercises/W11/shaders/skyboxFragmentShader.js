export default /*glsl*/`
    precision highp float;
    uniform mat4 uProjectionViewInvMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelSkyboxMatrix;
    uniform mat4 uViewMatrix;
    uniform samplerCube uSamplerSkybox;
    varying vec4 v_position;

    void main(void) {
        vec4 t = uProjectionViewInvMatrix * v_position;
        gl_FragColor = textureCube(uSamplerSkybox, normalize(t.xyz / t.w));
    }
  `;

