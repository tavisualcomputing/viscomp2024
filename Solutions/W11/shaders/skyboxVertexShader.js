export default /*glsl*/`
  precision highp float;
  attribute vec4 aPosition;

  varying vec4 v_position;

  void main(void) {
    v_position = aPosition;
    gl_Position = v_position;
    gl_Position.z = 1.0;
  }
  `;

