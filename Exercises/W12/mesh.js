import { vec3FromArray, initialize2DArray } from "./helper.js";
import { Face } from "./face.js";
import { Edge } from "./edge.js";
import { Vertex } from "./vertex.js";

// helper function that updates mesh.faces, mesh.edges and mesh.vertices given new indices and vertex positions
function updateMesh(mesh) {
    mesh.faces = [];
    mesh.edges = [];

    var vertIndexToEdge = [];

    // init faces, edges and vertices
    for (var i = 0; i < mesh.indices.length / 3; i++) {
        var face = new Face(mesh.indices.slice(i*3, i*3+3));
        for (var v = 0; v < 3; v++) {
            const vertIndex = face.vertIndices[v];
            const vertIndexNext = face.vertIndices[(v + 1) % 3];

            const vertIndexMax = Math.max(vertIndex, vertIndexNext);
            const vertIndexMin = Math.min(vertIndex, vertIndexNext);

            if (vertIndexToEdge[vertIndexMin] == null) {
                vertIndexToEdge[vertIndexMin] = [];
            }

            var edgeIndex = vertIndexToEdge[vertIndexMin][vertIndexMax];

            if (edgeIndex == null) {
                var edge = new Edge([vertIndexMin, vertIndexMax]);
                edgeIndex = mesh.edges.length;
                vertIndexToEdge[vertIndexMin][vertIndexMax] = edgeIndex;
                mesh.edges.push(edge);
            }

            if (face.edgeIndices.indexOf(edgeIndex) == -1) {
                face.edgeIndices.push(edgeIndex);
            }
        }

        for (var e = 0; e < 3; e++) {
            const edgeIndex = face.edgeIndices[e];
            var edge = mesh.edges[edgeIndex];
            edge.faceIndices.push(i);

            for (var ve = 0; ve < 2; ve++) {
                const vertIndex = edge.vertIndices[ve];
                var vert = mesh.vertices[vertIndex];
                if (vert.edgeIndices.indexOf(edgeIndex) == -1) {
                    vert.edgeIndices.push(edgeIndex);
                }
            }
        }

        mesh.faces.push(face);
    }
}

// ===== Task 2c =====
// Implement loop subdivision algorithm
// Ref. https://github.com/libigl/libigl/blob/main/include/igl/loop.cpp
// We assume there's no boundary edges, i.e., each edge has 2 neigbour faces
export function LoopSubdivision(mesh) {
    // compute adjacency information for the algorithm
    var [FF, FFi] = mesh.faceAdjacency();
    var VV = mesh.vertexAdjacency();

    // We add 3 new faces for each face in the original mesh
    // new_indices is of size (#faces, 3) and new_indices[i][j] is the id of the new vertex add to the jth edge of face i
    var new_indices = initialize2DArray(mesh.faces.length, 3, -1);
    var counter = 0;

    // compute the coefficient matrix for new vertex positions
    // coeffs is a matrix of size (#new_mesh_vertices, #current_mesh_vertices)
    const n_newverts = mesh.vertices.length + counter;
    var coeffs = initialize2DArray(n_newverts, mesh.vertices.length, 0);

    // compute weights to update exisitng vertices

    // compute weights to update new added vertices

    // construct new mesh indices
    // we split each face in the old mesh into 4 new faces
    // so we need to push in total #old_mesh_faces * 4 * 3 numbers into mesh.indices

    // update mesh vertices with the computed coeff matrix

    // ====== End Task 2c ======

    updateMesh(mesh);
}

export function Mesh(vertices, indices) {
    this.vertices = [];
    for (var i = 0; i < vertices.length/3; i++) {
        var vert = new Vertex(vertices.slice(i*3, i*3+3));
        this.vertices.push(vert);
    }

    this.indices = indices;
    this.faces = [];
    this.edges = [];

    updateMesh(this);
}

Mesh.prototype = {
    constructor: Mesh,

    // update this.vertices from a coefficeint matrix
    // coeffs is a matrix of size (#new_mesh_vertices, #verts)
    updateVertices: function(coeffs, verts) {
        this.vertices = [];

        for (var i = 0; i < coeffs.length; i++) {
            var pos = vec3.fromValues(0., 0., 0.);
            for (var j = 0; j < coeffs[i].length; j++) {
                pos[0] += coeffs[i][j] * verts[j].position[0];
                pos[1] += coeffs[i][j] * verts[j].position[1];
                pos[2] += coeffs[i][j] * verts[j].position[2];
            }
            var vert = new Vertex(pos);
            this.vertices.push(vert);
        }
    },

    faceAdjacency: function() {
        var FF = initialize2DArray(this.faces.length, 3, -1);
        var FFi = initialize2DArray(this.faces.length, 3, -1);

        // ===== Task 2b =====
        // Compute 2D array FF and FFi
        // FF is #faces by #3 adjacent matrix, the element i,j is the id of the face adjacent to the j edge of face i
        // FFi is #faces by #3 adjacent matrix, the element i,j is the id of edge of the face FF[i][j] that is adjacent with face i

        // ===== End Task 2b =====
        return [FF, FFi];
    },

    vertexAdjacency: function() {
        var VV = [];

        // ===== Task 2b =====
        // Compute 2D array VV, which has varying size per row
        // VV contains at row i the adjacent vertex indices of vertex i

        // ===== End Task 2b =====

        return VV;
    },

    getVertices: function() {
        var vertices = [];
        for (var i = 0; i < this.vertices.length; i++) {
            var pos = this.vertices[i].position;
            vertices.push(pos[0]);
            vertices.push(pos[1]);
            vertices.push(pos[2]);
        }
        return vertices;
    },

    getWireframeVertices: function() {
        var verts = this.getVertices();
        var vertices = [];
        for (var i = 0; i < this.edges.length; i++) {
            var v0 = vec3FromArray(verts, this.edges[i].vertIndices[0]);
            var v1 = vec3FromArray(verts, this.edges[i].vertIndices[1]);
            
            vertices.push(v0[0]);
            vertices.push(v0[1]);
            vertices.push(v0[2]);
    
            vertices.push(v1[0]);
            vertices.push(v1[1]);
            vertices.push(v1[2]);
        }
    
        return vertices;
    }
}