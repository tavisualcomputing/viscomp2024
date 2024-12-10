export function Face(indices) {
    if (indices.length != 3) {
        alert("Faces must be triangles!")
    } 

    this.vertIndices = indices;
    this.edgeIndices = [];
}

Face.prototype = {
    constructor: Face,
}