import { test, expect } from "vitest"
import { dt, Vector, type DataTypeOf } from "../../src/cardBase/dataTypes"
import { DelaunayDiagram } from "../../src/cards/delaunayDiagram"

test("returns an edge graph and all original points are in that graph", async () => {
    const points: DataTypeOf<"vector">[] = []
    for (let i = 0; i < 10; i++) {
        points.push(
            dt.vector([
                Math.floor(Math.random() * 200) - 100,
                Math.floor(Math.random() * 200) - 100,
            ]),
        )
    }

    const card = new DelaunayDiagram()
    const delaunay_result = await card.evaluate([dt.vectorfield(points)])

    const edge_graph_data = delaunay_result.find(
        (r): r is DataTypeOf<"graph"> => r.kind === "graph",
    )

    expect(edge_graph_data).toBeDefined()
    const edge_graph = edge_graph_data!.value

    let missing_point = false
    for (let gi = 0; gi < edge_graph.nodes.length; gi++) {
        let found = false
        for (let pi = 0; pi < points.length; pi++) {
            if (edge_graph.nodes[gi].equals(points[pi].value)) {
                found = true
                break
            }
        }
        if (!found) {
            missing_point = true
            break
        }
    }
    expect(missing_point).toEqual(false)
})

test("Compare result to known delaunay triangulation", async () => {
    const known_graph_data = dt.graph()
    const known_graph = known_graph_data.value
    known_graph.nodes = [
        new Vector([11.030805704648913, -36.3173772662232]),
        new Vector([-18.249067510833868, 74.87865971165644]),
        new Vector([59.481928844864285, -13.876819738962581]),
        new Vector([-51.62693722069416, 20.977957241914666]),
        new Vector([-67.88666828632559, 62.752995520901834]),
        new Vector([-86.41593581161007, 63.14932192318656]),
        new Vector([-60.72062565085425, -58.172695538915534]),
        new Vector([-74.88601269683375, -54.249197008960316]),
        new Vector([-7.233581781237049, -93.76896164344495]),
        new Vector([-83.97682994756615, -77.59611308176098]),
    ]
    known_graph.edges = [
        [null, 1, 1, 1, null, null, 1, null, 1, null],
        [1, null, 1, 1, 1, 1, null, null, null, null],
        [1, 1, null, null, null, null, null, null, 1, null],
        [1, 1, null, null, 1, 1, 1, 1, null, null],
        [null, 1, null, 1, null, 1, null, null, null, null],
        [null, 1, null, 1, 1, null, null, 1, null, 1],
        [1, null, null, 1, null, null, null, 1, 1, 1],
        [null, null, null, 1, null, 1, 1, null, null, 1],
        [1, null, 1, null, null, null, 1, null, null, 1],
        [null, null, null, null, null, 1, 1, 1, 1, null],
    ]
    const input_points = dt.vectorfield([
        dt.vector([-60.72062565085425, -58.172695538915534]),
        dt.vector([-74.88601269683375, -54.249197008960316]),
        dt.vector([-83.97682994756615, -77.59611308176098]),
        dt.vector([11.030805704648913, -36.3173772662232]),
        dt.vector([-51.62693722069416, 20.977957241914666]),
        dt.vector([59.481928844864285, -13.876819738962581]),
        dt.vector([-7.233581781237049, -93.76896164344495]),
        dt.vector([-67.88666828632559, 62.752995520901834]),
        dt.vector([-18.249067510833868, 74.87865971165644]),
        dt.vector([-86.41593581161007, 63.14932192318656]),
    ])
    const card = new DelaunayDiagram()
    const delaunay_result = await card.evaluate([input_points])

    const graph_data = delaunay_result.find(
        (r): r is DataTypeOf<"graph"> => r.kind === "graph",
    )
    expect(graph_data).toBeDefined()
    const graph = graph_data!.value

    expect(graph.nodes.length).toEqual(known_graph.nodes.length)
    let nodes_equal = true
    for (let i = 0; i < graph.nodes.length; i++) {
        if (!graph.nodes[i].equals(known_graph.nodes[i])) {
            nodes_equal = false
            break
        }
    }
    expect(nodes_equal).toEqual(true)
    let edges_equal = true
    for (let j = 0; j < graph.nodes.length; j++) {
        for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.edges[i][j] != known_graph.edges[i][j]) {
                edges_equal = false
                break
            }
        }
    }
    expect(edges_equal).toEqual(true)
})
