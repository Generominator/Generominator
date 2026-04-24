import { expect, test } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import { BranchCard } from "../../src/cards/branchCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"
import { Increment } from "../testingUtils/testingCards/Increment"
import { PassThroughDebugCard } from "../testingUtils/PassThroughDebugCard"
import { PassThroughGenericCard } from "../testingUtils/PassThroughGenericCard"

test("BranchCard binds from downstream concrete sink and reverts on disconnect", () => {
    const graph = new ExecutionGraph()
    const branch = new BranchCard()
    const branchNode = graph.addNode(branch, 0, 0)
    const sinkNode = graph.addNode(new Increment(), 0, 0)

    expect(branch.inputPort.dataType).toBe("generic")
    expect(branch.truePort.dataType).toBe("generic")
    expect(branch.falsePort.dataType).toBe("generic")

    graph.connect(branchNode, 0, sinkNode, 0)
    expect(branch.inputPort.dataType).toBe("value")
    expect(branch.truePort.dataType).toBe("value")
    expect(branch.falsePort.dataType).toBe("value")

    expect(graph.disconnectEdge(0)).not.toBeNull()
    expect(branch.inputPort.dataType).toBe("generic")
    expect(branch.truePort.dataType).toBe("generic")
    expect(branch.falsePort.dataType).toBe("generic")
})

test("disconnecting Branch->Branch link unbinds only downstream branch", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const upstream = new BranchCard()
    const downstream = new BranchCard()
    const upstreamNode = graph.addNode(upstream, 0, 0)
    const downstreamNode = graph.addNode(downstream, 0, 0)

    graph.connect(upstreamNode, 0, downstreamNode, 0)
    graph.connect(sourceNode, 0, upstreamNode, 0)

    expect(upstream.inputPort.dataType).toBe("value")
    expect(downstream.inputPort.dataType).toBe("value")

    const linkIndex = graph.edges.findIndex(
        (e) => e.from === upstreamNode && e.to === downstreamNode,
    )
    expect(linkIndex).toBeGreaterThanOrEqual(0)
    expect(graph.disconnectEdge(linkIndex)).not.toBeNull()

    expect(upstream.inputPort.dataType).toBe("value")
    expect(downstream.inputPort.dataType).toBe("generic")
    expect(downstream.truePort.dataType).toBe("generic")
    expect(downstream.falsePort.dataType).toBe("generic")
})

test("deleting concrete source reverts a connected Branch->Branch chain", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const upstream = new BranchCard()
    const downstream = new BranchCard()
    const upstreamNode = graph.addNode(upstream, 0, 0)
    const downstreamNode = graph.addNode(downstream, 0, 0)

    graph.connect(upstreamNode, 0, downstreamNode, 0)
    graph.connect(sourceNode, 0, upstreamNode, 0)
    expect(upstream.inputPort.dataType).toBe("value")
    expect(downstream.inputPort.dataType).toBe("value")

    graph.deleteNode(sourceNode)

    expect(upstream.inputPort.dataType).toBe("generic")
    expect(upstream.truePort.dataType).toBe("generic")
    expect(downstream.inputPort.dataType).toBe("generic")
    expect(downstream.truePort.dataType).toBe("generic")
})

test("node-scoped generic chain binds from source and reverts when source disconnects", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const debugA = new PassThroughDebugCard()
    const debugB = new PassThroughDebugCard()
    const debugANode = graph.addNode(debugA, 0, 0)
    const debugBNode = graph.addNode(debugB, 0, 0)

    graph.connect(debugANode, 0, debugBNode, 0)
    graph.connect(sourceNode, 0, debugANode, 0)

    expect(debugA.inPort.dataType).toBe("value")
    expect(debugA.outPort.dataType).toBe("value")
    expect(debugB.inPort.dataType).toBe("value")
    expect(debugB.outPort.dataType).toBe("value")

    const sourceEdgeIndex = graph.edges.findIndex(
        (e) => e.from === sourceNode && e.to === debugANode,
    )
    expect(sourceEdgeIndex).toBeGreaterThanOrEqual(0)
    expect(graph.disconnectEdge(sourceEdgeIndex)).not.toBeNull()

    expect(debugA.inPort.dataType).toBe("generic")
    expect(debugA.outPort.dataType).toBe("generic")
    expect(debugB.inPort.dataType).toBe("generic")
    expect(debugB.outPort.dataType).toBe("generic")
})

test("node-scoped generic chain binds from downstream concrete sink", () => {
    const graph = new ExecutionGraph()

    const debugA = new PassThroughDebugCard()
    const debugB = new PassThroughDebugCard()
    const debugANode = graph.addNode(debugA, 0, 0)
    const debugBNode = graph.addNode(debugB, 0, 0)
    const sinkNode = graph.addNode(new Increment(), 0, 0)

    graph.connect(debugANode, 0, debugBNode, 0)
    graph.connect(debugBNode, 0, sinkNode, 0)

    expect(debugA.inPort.dataType).toBe("value")
    expect(debugA.outPort.dataType).toBe("value")
    expect(debugB.inPort.dataType).toBe("value")
    expect(debugB.outPort.dataType).toBe("value")
})

test("node-scoped generic chain stays concrete with one anchor removed while other anchor remains", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const debugA = new PassThroughDebugCard()
    const debugB = new PassThroughDebugCard()
    const debugANode = graph.addNode(debugA, 0, 0)
    const debugBNode = graph.addNode(debugB, 0, 0)
    const sinkNode = graph.addNode(new Increment(), 0, 0)

    graph.connect(debugANode, 0, debugBNode, 0)
    graph.connect(sourceNode, 0, debugANode, 0)
    graph.connect(debugBNode, 0, sinkNode, 0)

    const sourceEdgeIndex = graph.edges.findIndex(
        (e) => e.from === sourceNode && e.to === debugANode,
    )
    expect(sourceEdgeIndex).toBeGreaterThanOrEqual(0)
    expect(graph.disconnectEdge(sourceEdgeIndex)).not.toBeNull()

    expect(debugA.inPort.dataType).toBe("value")
    expect(debugA.outPort.dataType).toBe("value")
    expect(debugB.inPort.dataType).toBe("value")
    expect(debugB.outPort.dataType).toBe("value")
})

test("node-scoped generic chain reverts after removing both concrete anchors", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const debugA = new PassThroughDebugCard()
    const debugB = new PassThroughDebugCard()
    const debugANode = graph.addNode(debugA, 0, 0)
    const debugBNode = graph.addNode(debugB, 0, 0)
    const sinkNode = graph.addNode(new Increment(), 0, 0)

    graph.connect(debugANode, 0, debugBNode, 0)
    graph.connect(sourceNode, 0, debugANode, 0)
    graph.connect(debugBNode, 0, sinkNode, 0)

    const sourceEdgeIndex = graph.edges.findIndex(
        (e) => e.from === sourceNode && e.to === debugANode,
    )
    const sinkEdgeIndex = graph.edges.findIndex(
        (e) => e.from === debugBNode && e.to === sinkNode,
    )
    expect(sourceEdgeIndex).toBeGreaterThanOrEqual(0)
    expect(sinkEdgeIndex).toBeGreaterThanOrEqual(0)

    expect(graph.disconnectEdge(sourceEdgeIndex)).not.toBeNull()
    const shiftedSinkEdgeIndex = graph.edges.findIndex(
        (e) => e.from === debugBNode && e.to === sinkNode,
    )
    expect(shiftedSinkEdgeIndex).toBeGreaterThanOrEqual(0)
    expect(graph.disconnectEdge(shiftedSinkEdgeIndex)).not.toBeNull()

    expect(debugA.inPort.dataType).toBe("generic")
    expect(debugA.outPort.dataType).toBe("generic")
    expect(debugB.inPort.dataType).toBe("generic")
    expect(debugB.outPort.dataType).toBe("generic")
})

test("label-based connect resolves indices and stores correct edge", () => {
    const graph = new ExecutionGraph()
    const fromNode = graph.addNode(new PassThroughGenericCard(), 0, 0)
    const toNode = graph.addNode(new PassThroughGenericCard(), 0, 0)

    graph.connect(fromNode, "out", toNode, "in")
    expect(graph.edges).toEqual([
        {
            from: fromNode,
            outIdx: 0,
            to: toNode,
            inIdx: 0,
        },
    ])
})

test("disconnectEdge returns null for invalid indices", () => {
    const graph = new ExecutionGraph()

    expect(graph.disconnectEdge(-1)).toBeNull()
    expect(graph.disconnectEdge(0)).toBeNull()
})
