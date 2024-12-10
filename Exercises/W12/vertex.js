export function Vertex(position) {
    this.position = position;
    this.edgeIndices = [];
}

Vertex.prototype = {
    constructor: Vertex,
}