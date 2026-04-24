import { Card } from "../cardBase/card"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes"
import {
    GraphPort,
    ShapePort,
    VectorFieldPort,
    type Port,
} from "../cardBase/ports/port"
import { Delaunay } from "d3-delaunay"

export class DelaunayDiagram extends Card {
    inputs: Port[] = [new VectorFieldPort("points", false)]
    outputs: Port[] = [
        new GraphPort("all edges"),
        new ShapePort("triangles"),
        new VectorFieldPort("triangle centers"),
    ]
    title: string = "Delaunay Diagram"
    description: string = ""

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (inputs.length !== 1 || inputs[0].kind !== "vectorfield") {
            throw new Error(
                `DelaunayDiagram expects one vector array input (points), got: ${JSON.stringify(inputs)}`,
            )
        }
        // Converting the input vectorfield to the format d3-delaunay expects
        // The vectorfield is transformed into an array of number tuples
        const points = (inputs[0].vectors as DataTypeOf<"vector">[]).map(
            (vec) => [vec.value.x(), vec.value.y()] as [number, number],
        )
        // Triangulate the points into a delaunay object
        const delaunay = Delaunay.from(points)

        const tris: Triangle[] = []
        const tri_centers: DataTypeOf<"vector">[] = []
        // For each triangle in the delaunay triangulation convert it to a Generominator compatible Shape data type
        // Converting them to Triangles so I can use the circumcenter function for the Centers output port
        Array.from(delaunay.trianglePolygons()).forEach((d_tri) => {
            const tri = new Triangle(
                dt.vector(d_tri[0]),
                dt.vector(d_tri[1]),
                dt.vector(d_tri[2]),
            )
            tris.push(tri)
            tri_centers.push(tri.circumcenter())
        })
        // Make a graph based off the list of Generominator Triangles
        const edges_graph = tris_to_graph(tris)

        // Return graph (Edges), shapes (Triangles), and vectors (Centers)
        return [edges_graph, dt.shape(tris), dt.vectorfield(tri_centers)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
function tris_to_graph(tris: Triangle[]): DataTypeOf<"graph"> {
    const edges_graph: DataTypeOf<"graph"> = dt.graph()
    // Add all triangle vertices to the graph
    tris.forEach((tri) => {
        tri.verts.forEach((vert) => {
            let add = true
            for (let i = 0; i < edges_graph.value.nodes.length; i++) {
                if (edges_graph.value.nodes[i].equals(vert.value)) {
                    add = false
                    break
                }
            }
            if (add) {
                edges_graph.value.add_node(vert.value)
            }
        })
    })
    // Loop over each triangle and add each of its edges as a connection on the graph
    // It does not matter that we will be creating duplicate connections, just a bit redundant
    tris.forEach((tri) => {
        // One intermidiate step is to convert all the vectors that make up a triangle to indices in the graph
        const verts_i: number[] = []
        for (let tri_vert_i = 0; tri_vert_i < 3; tri_vert_i++) {
            const vert = tri.verts[tri_vert_i]
            for (
                let point_i = 0;
                point_i < edges_graph.value.nodes.length;
                point_i++
            ) {
                if (vert.value.equals(edges_graph.value.nodes[point_i])) {
                    verts_i[tri_vert_i] = point_i
                    break
                }
            }
        }
        // Now that we know the node indices for each vertex, we can make the triangles connections on the graph
        for (let i = 0; i < 3; i++) {
            edges_graph.value.connect_edges(verts_i[i], verts_i[(i + 1) % 3])
        }
    })
    return edges_graph
}

class Edge {
    // The two points that define the edge
    a: DataTypeOf<"vector">
    b: DataTypeOf<"vector">
    constructor(a: DataTypeOf<"vector">, b: DataTypeOf<"vector">) {
        this.a = a
        this.b = b
    }
    equals(other: Edge): boolean {
        // Compare both orderings of points to determine edge equality
        return (
            (this.a.value.equals(other.a.value) &&
                this.b.value.equals(other.b.value)) ||
            (this.a.value.equals(other.b.value) &&
                this.b.value.equals(other.a.value))
        )
    }
}
export class Triangle implements Curve {
    verts: DataTypeOf<"vector">[]
    constructor(
        a: DataTypeOf<"vector">,
        b: DataTypeOf<"vector">,
        c: DataTypeOf<"vector">,
    ) {
        this.verts = [a, b, c]
    }
    // Methods to allow referencing a triangles vertices by the typical names, A B C
    a(): DataTypeOf<"vector"> {
        return this.verts[0]
    }
    b(): DataTypeOf<"vector"> {
        return this.verts[1]
    }
    c(): DataTypeOf<"vector"> {
        return this.verts[2]
    }
    getValue(t: number): number[] {
        const segments = 3
        const pos = t * segments
        const i = Math.min(Math.floor(pos), segments - 1)
        const j = (i + 1) % segments
        const localT = pos - Math.floor(pos)
        const start = this.verts[i].value
        const end = this.verts[j].value
        return [
            start.x() * (1 - localT) + end.x() * localT,
            start.y() * (1 - localT) + end.y() * localT,
        ]
    }
    getOutline(): number[][] {
        return this.verts.map((vert) => [vert.value.x(), vert.value.y()])
    }
    equals(other: Triangle): boolean {
        // Check if both this and other contain the same three verts
        for (let offset = 0; offset < 3; offset++) {
            let valid = true
            for (let i = 0; i < 3; i++) {
                const this_v = this.verts[(i + offset) % 3]
                const other_v = other.verts[i]
                if (!this_v.value.equals(other_v.value)) {
                    valid = false
                    break
                }
            }
            if (valid) return true
        }
        return false
    }
    edges(): Edge[] {
        // A list of all the triangles edges
        return [
            new Edge(this.a(), this.b()),
            new Edge(this.b(), this.c()),
            new Edge(this.c(), this.a()),
        ]
    }
    share_edge(other: Triangle) {
        // Loop over all edges of this triangle
        for (let this_i = 0; this_i < 3; this_i++) {
            const this_edge = this.edges()[this_i]
            // loop over all edges of the other triangle
            for (let other_i = 0; other_i < 3; other_i++) {
                const other_edge = other.edges()[other_i]
                // Compare the two edges.
                // If any match then the triangles do in fact share and edge
                if (this_edge.equals(other_edge)) return true
            }
        }
        return false
    }
    has_vert(vert: DataTypeOf<"vector">): boolean {
        // Loop over each vertex of the triangle and compare against the test vert
        for (let i = 0; i < 3; i++) {
            if (this.verts[i].value.equals(vert.value)) {
                // Found a match
                return true
            }
        }
        // No matches found
        return false
    }
    circumcenter(): DataTypeOf<"vector"> {
        // Finds the intersection point of two of the triangles perpendicular bisectors
        // Defualts to the intersection of AB and BC unless of of those lines has an undefined slope

        // The midpoint of side AB
        // or side CA if AB is parallel to the x axis
        const m1: DataTypeOf<"vector"> = dt.vector([0, 0])
        // The slope of the perpendicular bisector of m1
        // we swap to CA when AB is parallel to the x axis to avaid a divide by zero here
        let m1p: number
        // Check to see if the slope is defined
        if (this.b().value.sub(this.a().value).y() != 0) {
            m1.value = this.a().value.add(this.b().value).div(2)
            m1p = -(
                this.b().value.sub(this.a().value).x() /
                this.b().value.sub(this.a().value).y()
            )
        } else {
            m1.value = this.c().value.add(this.a().value).div(2)
            m1p = -(
                this.a().value.sub(this.c().value).x() /
                this.a().value.sub(this.c().value).y()
            )
        }
        // Same as m1 but for side BC (or CA again for the same reason)
        const m2: DataTypeOf<"vector"> = dt.vector([0, 0])
        // Same as m1p but for side BC (or CA again for the same reason)
        let m2p: number
        // Check to see if the slope is defined
        if (this.c().value.sub(this.b().value).y() != 0) {
            m2.value = this.b().value.add(this.c().value).div(2)
            m2p = -(
                this.c().value.sub(this.b().value).x() /
                this.c().value.sub(this.b().value).y()
            )
        } else {
            m2.value = this.c().value.add(this.a().value).div(2)
            m2p = -(
                this.a().value.sub(this.c().value).x() /
                this.a().value.sub(this.c().value).y()
            )
        }
        // The math be mathing. and it be mathing correctly.
        // Trust me (:
        const x =
            (m2.value.y() -
                m1.value.y() -
                m2p * m2.value.x() +
                m1p * m1.value.x()) /
            (m1p - m2p)
        const y = m1.value.y() - m1p * (m1.value.x() - x)
        return dt.vector([x, y])
    }
}
