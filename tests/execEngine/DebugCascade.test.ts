import { expect, test } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"
import { PassThroughDebugCard } from "../testingUtils/PassThroughDebugCard"

test("concrete type cascades through a node-scoped generic chain", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const debugA = new PassThroughDebugCard()
    const debugB = new PassThroughDebugCard()

    const debugANode = graph.addNode(debugA, 0, 0)
    const debugBNode = graph.addNode(debugB, 0, 0)

    graph.connect(debugANode, 0, debugBNode, 0)
    expect(debugA.inPort.dataType).toBe("generic")
    expect(debugA.outPort.dataType).toBe("generic")
    expect(debugB.inPort.dataType).toBe("generic")
    expect(debugB.outPort.dataType).toBe("generic")

    graph.connect(sourceNode, 0, debugANode, 0)

    expect(debugA.inPort.dataType).toBe("value")
    expect(debugA.outPort.dataType).toBe("value")
    expect(debugB.inPort.dataType).toBe("value")
    expect(debugB.outPort.dataType).toBe("value")
})
