import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { GraphPort, VectorFieldPort, type Port } from "../cardBase/ports/port"

export class VectorsToGraph extends Card {
    title: string = "Vectors To Graph"
    description?: string | undefined
    inputs: Port[] = [
        new VectorFieldPort("Nodes"),
        new VectorFieldPort("Edges (by index)"),
    ]
    outputs: Port[] = [new GraphPort("graph")]
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        this.validate(inputs)
        const nodes = inputs[0] as DataTypeOf<"vectorfield">
        const edges = inputs[1] as DataTypeOf<"vectorfield">
        const graph = dt.graph()
        nodes.vectors.forEach((node) => {
            graph.value.add_node(node.value)
        })
        edges.vectors.forEach((edge) => {
            graph.value.connect_edges(edge.value.x(), edge.value.y())
        })
        return [graph]
    }
    validate(inputs: DataType[]): void {
        if (
            (inputs.length !== 2 || inputs[0].kind !== "vectorfield",
            inputs[1].kind !== "vectorfield")
        ) {
            throw new Error(
                `DelaunayDiagram expects two vectorfield inputs (nodes and edges), got: ${JSON.stringify(inputs)}`,
            )
        }
        const nodes = inputs[0] as DataTypeOf<"vectorfield">
        const edges = inputs[1] as DataTypeOf<"vectorfield">
        const base_error =
            "All scalar components of 'edges' must be less than the size of nodes"
        for (let i = 0; i < edges.vectors.length; i++) {
            const edge = edges.vectors[i].value
            const a = edge.x()
            const b = edge.y()
            if (!Number.isInteger(a) || a < 0 || a >= nodes.vectors.length) {
                throw new Error(
                    `${base_error}\nThe first component of edge ${edge.toString()} is out of range`,
                )
            }
            if (!Number.isInteger(b) || b < 0 || b >= nodes.vectors.length) {
                throw new Error(
                    `${base_error}\nThe second component of edge ${edge.toString()} is out of range`,
                )
            }
        }
    }
    init(): void {
        // No init Needed
    }
    cleanup(): void {
        // No cleanup Needed
    }
}
