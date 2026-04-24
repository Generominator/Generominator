import { Card } from "../cardBase/card"
import {
    dt,
    PolygonCurve,
    Vector,
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

export class VoronoiDiagram extends Card {
    inputs: Port[] = [new VectorFieldPort("sites", false)]
    outputs: Port[] = [
        new GraphPort("region edges"),
        new ShapePort("regions"),
        new VectorFieldPort("region centers"),
    ]
    title: string = "Voronoi Diagram"
    description: string = ""
  
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (inputs.length !== 1 || inputs[0].kind !== "vectorfield") {
            throw new Error(
                `Voronoi Diagram expects one vectorfield input (points), got: ${JSON.stringify(inputs)}`,
            )
        }

        // Converting the input vectorfield to the format d3-delaunay expects
        // The vectorfield is transformed into an array of number tuples
        const points = (inputs[0].vectors as DataTypeOf<"vector">[]).map(
            (vec) => [vec.value.x(), vec.value.y()] as [number, number],
        )
        // Find the bounds of the given vectorfield
        // Needed to close of the voronoi regions that mathematically extend to infinity
        const bounds = {
            x_min: Number.MAX_SAFE_INTEGER,
            y_min: Number.MAX_SAFE_INTEGER,
            x_max: Number.MIN_SAFE_INTEGER,
            y_max: Number.MIN_SAFE_INTEGER,
        }
        points.forEach((point) => {
            if (point[0] < bounds.x_min) bounds.x_min = point[0]
            if (point[0] > bounds.x_max) bounds.x_max = point[0]
            if (point[1] < bounds.y_min) bounds.y_min = point[1]
            if (point[1] > bounds.y_max) bounds.y_max = point[1]
        })
        // Give the points at the edge of the bound some room to breathe
        bounds.x_min -= 10
        bounds.y_min -= 10
        bounds.x_max += 10
        bounds.y_max += 10
        // First get a delaunay triangulation from points
        const delaunay = Delaunay.from(points)
        // Then get a voronoi diagram from the delaunay triangulation
        // We pass in bounds here to bind the infinate regions for the voronoi diagram
        const voronoi = delaunay.voronoi([
            bounds.x_min,
            bounds.y_min,
            bounds.x_max,
            bounds.y_max,
        ])

        const voronoi_graph = dt.graph()
        const voronoi_regions: PolygonCurve[] = []
        const cell_polygons = Array.from(voronoi.cellPolygons())
        // Load each voronoi region vertices into the graph object
        // while also filling shape output with curve-compatible polygons
        cell_polygons.forEach((v_cell) => {
            const cell_region: [number, number][] = []
            for (let i = 0; i < v_cell.length - 1; i++) {
                const point = [v_cell[i][0], v_cell[i][1]] as [number, number]
                const vert = new Vector(point)
                cell_region.push(point)
                // Filling the graph with vertices for the graph (Graph) output port
                if (!voronoi_graph.value.has_node(vert)) {
                    voronoi_graph.value.add_node(vert)
                }
            }
            // Filling the array for the regions (Shape) output port
            voronoi_regions.push(new PolygonCurve(cell_region))
        })
        // Second loop over all regions to connect graph edges
        cell_polygons.forEach((v_cell) => {
            const all_nodes = voronoi_graph.value.nodes
            for (let i = 0; i < v_cell.length - 1; i++) {
                const vert_a = new Vector(v_cell[i])
                const vert_b = new Vector(v_cell[i + 1])
                let ai = -1
                let bi = -1
                // locate the indices for the two nodes we want to connect.
                for (let i = 0; i < all_nodes.length; i++) {
                    if (all_nodes[i].equals(vert_a)) {
                        ai = i
                    } else if (all_nodes[i].equals(vert_b)) {
                        bi = i
                    }
                }
                // Final check that we actually found two distinct node indices before trying to connect them
                // I've never seen this error actually get thrown, but it never hurts to check
                if (ai == -1 || bi == -1 || ai == bi) {
                    throw new Error(
                        `An Error Occured while converting voronoi diagram data to a graph`,
                    )
                }
                voronoi_graph.value.connect_edges(ai, bi)
            }
        })

        // Return graph (Edges), shapes (Regions), and vectors (Centers)
        return [voronoi_graph, dt.shape(voronoi_regions), inputs[0]]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
