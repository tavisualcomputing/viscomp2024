// custom vertex color
export function calcVertexColor() {
return vec4.fromValues(0.4, 0.59, 0.8, 1.0);
}

// helper function to extract vertex position from array of vertices
export function vec3FromArray(vertices, index) {
    return vec3.fromValues(vertices[3*index+0], vertices[3*index+1], vertices[3*index+2]);
}

// initial 2D array with default value
export function initialize2DArray(h, w, val = null){
  return Array.from({ length: h }).map(() => Array.from({ length: w }).fill(val));
}