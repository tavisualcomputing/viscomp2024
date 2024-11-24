export default /*glsl*/ `
  varying lowp vec4 vColor;

  void main(void) {
    // the simplest fragment shader you can think of
    gl_FragColor = vColor; 
  } 
  `;