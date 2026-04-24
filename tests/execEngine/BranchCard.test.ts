import { expect, test } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import { BranchCard } from "../../src/cards/branchCard"
import { dt } from "../../src/cardBase/dataTypes"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"
import { ConstStateCard } from "../testingUtils/testingCards/constStateCard"
import { PassThroughGenericCard } from "../testingUtils/PassThroughGenericCard"
import { CountingSinkCard } from "../testingUtils/CountingSinkCard"

test("BranchCard binds generic type from input and forwards value", async () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)

    const condCard = new ConstStateCard()
    condCard.state = true
    const condNode = graph.addNode(condCard, 0, 0)

    const branch = new BranchCard()
    const branchNode = graph.addNode(branch, 0, 0)

    const passThroughNode = graph.addNode(new PassThroughGenericCard(), 0, 0)

    graph.connect(valueNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, passThroughNode, 0)

    const results = await graph.run()

    expect(branch.inputPort.boundType).toBe("value")
    expect(branch.truePort.boundType).toBe("value")
    expect(branch.falsePort.boundType).toBe("value")

    expect(results.get(passThroughNode)?.[0]).toEqual(dt.value(5))
})

test("ExecutionGraph only executes nodes downstream of the active BranchCard output", async () => {
    const graph = new ExecutionGraph()

    const inputNode = graph.addNode(new ConstValueCard(), 0, 0)

    const condCard = new ConstStateCard()
    condCard.state = false // false path
    const condNode = graph.addNode(condCard, 0, 0)

    const branchNode = graph.addNode(new BranchCard(), 0, 0)

    const trueSink = new CountingSinkCard()
    const falseSink = new CountingSinkCard()
    const trueSinkNode = graph.addNode(trueSink, 0, 0)
    const falseSinkNode = graph.addNode(falseSink, 0, 0)

    graph.connect(inputNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, trueSinkNode, 0)
    graph.connect(branchNode, 1, falseSinkNode, 0)

    await graph.run()

    expect(trueSink.evaluateCount).toBe(0)
    expect(falseSink.evaluateCount).toBe(1)
})

test("BranchCard outputs bind immediately when x is connected to a concrete type", () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const branch = new BranchCard()
    const branchNode = graph.addNode(branch, 0, 0)

    expect(branch.truePort.dataType).toBe("generic")
    expect(branch.falsePort.dataType).toBe("generic")

    graph.connect(valueNode, 0, branchNode, 0)

    expect(branch.inputPort.boundType).toBe("value")
    expect(branch.truePort.dataType).toBe("value")
    expect(branch.falsePort.dataType).toBe("value")
})

test("disconnectEdge removes and returns the branch input edge", () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const branch = new BranchCard()
    const branchNode = graph.addNode(branch, 0, 0)

    graph.connect(valueNode, 0, branchNode, 0)
    const removed = graph.disconnectEdge(0)

    expect(removed).toEqual({
        from: valueNode,
        outIdx: 0,
        to: branchNode,
        inIdx: 0,
    })
    expect(branch.inputPort.boundType).toBe(null)
    expect(branch.truePort.dataType).toBe("generic")
    expect(branch.falsePort.dataType).toBe("generic")
    expect(graph.edges).toHaveLength(0)
})

test("concrete type cascades through connected BranchCards", () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const topBranch = new BranchCard()
    const downstreamBranch = new BranchCard()
    const topBranchNode = graph.addNode(topBranch, 0, 0)
    const downstreamBranchNode = graph.addNode(downstreamBranch, 0, 0)

    graph.connect(topBranchNode, 0, downstreamBranchNode, 0)
    expect(topBranch.truePort.dataType).toBe("generic")
    expect(downstreamBranch.inputPort.dataType).toBe("generic")

    graph.connect(sourceNode, 0, topBranchNode, 0)

    expect(topBranch.inputPort.dataType).toBe("value")
    expect(topBranch.truePort.dataType).toBe("value")
    expect(downstreamBranch.inputPort.dataType).toBe("value")
    expect(downstreamBranch.truePort.dataType).toBe("value")
    expect(downstreamBranch.falsePort.dataType).toBe("value")
})
