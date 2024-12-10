export function Edge(indices) {
    if (indices.length != 2) {
        alert("An edge can only be constructed with 2 vertices!");
    } 

    if (indices[0] >= indices[1]) {
        alert("An edge is defined from small vertex index to large vertex index to avoid duplicate!");
    }

    this.vertIndices = indices;
    this.faceIndices = [];
}

Edge.prototype = {
    constructor: Edge,
}