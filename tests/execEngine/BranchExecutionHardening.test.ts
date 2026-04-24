import { expect, test } from "vitest"
import { Card, type OutputRoutableCard } from "../../src/cardBase/card"
import type { DataType } from "../../src/cardBase/dataTypes"
import { GenericPort } from "../../src/cardBase/ports/port"
import { ExecutionGraph } from "../../src/execEngine"
import { BranchCard } from "../../src/cards/branchCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"
import { ConstStateCard } from "../testingUtils/testingCards/constStateCard"
import { CountingSinkCard } from "../testingUtils/CountingSinkCard"

class OptionalMergeCounterCard extends Card {
    title = "OptionalMergeCounter"
    description = "Counts evaluations with optional inputs"
    inA = new GenericPort("a")
    inB = new GenericPort("b")
    inputs = [this.inA, this.inB]
    outputs = []
    evaluateCount = 0

    init(): void {
        // Not needed
    }

    cleanup(): void {
        // Not needed
    }

    async evaluate(): Promise<DataType[]> {
        this.evaluateCount++
        return []
    }
}

class NoActiveOutputRouterCard extends Card implements OutputRoutableCard {
    title = "NoActiveOutputRouter"
    description = "Never activates any output"
    inPort = new GenericPort("in", false)
    outPort = new GenericPort("out")
    inputs = [this.inPort]
    outputs = [this.outPort]

    init(): void {
        // Not needed
    }

    cleanup(): void {
        // Not needed
    }

    getActiveOutputIndices(): readonly number[] {
        return []
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        return [inputs[0]]
    }
}

test("BranchCard executes only true path when condition is non-zero", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)
    const cond = new ConstStateCard()
    cond.state = true
    const condNode = graph.addNode(cond, 0, 0)
    const branchNode = graph.addNode(new BranchCard(), 0, 0)
    const trueSink = new CountingSinkCard()
    const falseSink = new CountingSinkCard()
    const trueSinkNode = graph.addNode(trueSink, 0, 0)
    const falseSinkNode = graph.addNode(falseSink, 0, 0)

    graph.connect(xNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, trueSinkNode, 0)
    graph.connect(branchNode, 1, falseSinkNode, 0)

    const results = await graph.run()

    expect(trueSink.evaluateCount).toBe(1)
    expect(falseSink.evaluateCount).toBe(0)
    expect(results.has(trueSinkNode)).toBe(true)
    expect(results.has(falseSinkNode)).toBe(false)
})

test("flipping BranchCard condition removes stale cached outputs from old path", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)
    const cond = new ConstStateCard()
    cond.state = true
    const condNode = graph.addNode(cond, 0, 0)
    const branchNode = graph.addNode(new BranchCard(), 0, 0)
    const trueSink = new CountingSinkCard()
    const falseSink = new CountingSinkCard()
    const trueSinkNode = graph.addNode(trueSink, 0, 0)
    const falseSinkNode = graph.addNode(falseSink, 0, 0)

    graph.connect(xNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, trueSinkNode, 0)
    graph.connect(branchNode, 1, falseSinkNode, 0)

    const run1 = await graph.run()
    expect(run1.has(trueSinkNode)).toBe(true)
    expect(run1.has(falseSinkNode)).toBe(false)

    cond.state = false
    const run2 = await graph.run()
    expect(run2.has(trueSinkNode)).toBe(false)
    expect(run2.has(falseSinkNode)).toBe(true)
    expect(trueSink.evaluateCount).toBe(1)
    expect(falseSink.evaluateCount).toBe(1)
})

test("runFromNode with changed output index re-runs only selected downstream path", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)
    const cond = new ConstStateCard()
    cond.state = false
    const condNode = graph.addNode(cond, 0, 0)
    const branchNode = graph.addNode(new BranchCard(), 0, 0)
    const trueSink = new CountingSinkCard()
    const falseSink = new CountingSinkCard()
    const trueSinkNode = graph.addNode(trueSink, 0, 0)
    const falseSinkNode = graph.addNode(falseSink, 0, 0)

    graph.connect(xNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, trueSinkNode, 0)
    graph.connect(branchNode, 1, falseSinkNode, 0)

    await graph.run()
    expect(trueSink.evaluateCount).toBe(0)
    expect(falseSink.evaluateCount).toBe(1)

    await graph.runFromNode(branchNode, [1])
    expect(trueSink.evaluateCount).toBe(0)
    expect(falseSink.evaluateCount).toBe(2)

    await graph.runFromNode(branchNode, [0])
    expect(trueSink.evaluateCount).toBe(0)
    expect(falseSink.evaluateCount).toBe(2)
})

test("branch pruning does not skip nodes reachable from both outputs", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)
    const cond = new ConstStateCard()
    cond.state = true
    const condNode = graph.addNode(cond, 0, 0)
    const branchNode = graph.addNode(new BranchCard(), 0, 0)
    const merge = new OptionalMergeCounterCard()
    const mergeNode = graph.addNode(merge, 0, 0)

    graph.connect(xNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, mergeNode, 0)
    graph.connect(branchNode, 1, mergeNode, 1)

    await graph.run()
    expect(merge.evaluateCount).toBe(1)

    cond.state = false
    await graph.run()
    expect(merge.evaluateCount).toBe(2)
})

test("nested branches execute only the active leaf path", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)

    const cond1 = new ConstStateCard()
    cond1.state = true
    const cond1Node = graph.addNode(cond1, 0, 0)

    const cond2 = new ConstStateCard()
    cond2.state = false
    const cond2Node = graph.addNode(cond2, 0, 0)

    const branch1Node = graph.addNode(new BranchCard(), 0, 0)
    const branch2Node = graph.addNode(new BranchCard(), 0, 0)

    const sinkTopFalse = new CountingSinkCard()
    const sinkSecondTrue = new CountingSinkCard()
    const sinkSecondFalse = new CountingSinkCard()
    const sinkTopFalseNode = graph.addNode(sinkTopFalse, 0, 0)
    const sinkSecondTrueNode = graph.addNode(sinkSecondTrue, 0, 0)
    const sinkSecondFalseNode = graph.addNode(sinkSecondFalse, 0, 0)

    graph.connect(xNode, 0, branch1Node, 0)
    graph.connect(cond1Node, 0, branch1Node, 1)
    graph.connect(branch1Node, 0, branch2Node, 0)
    graph.connect(cond2Node, 0, branch2Node, 1)
    graph.connect(branch1Node, 1, sinkTopFalseNode, 0)
    graph.connect(branch2Node, 0, sinkSecondTrueNode, 0)
    graph.connect(branch2Node, 1, sinkSecondFalseNode, 0)

    await graph.run()
    expect(sinkTopFalse.evaluateCount).toBe(0)
    expect(sinkSecondTrue.evaluateCount).toBe(0)
    expect(sinkSecondFalse.evaluateCount).toBe(1)

    cond1.state = false
    await graph.run()
    expect(sinkTopFalse.evaluateCount).toBe(1)
    expect(sinkSecondTrue.evaluateCount).toBe(0)
    expect(sinkSecondFalse.evaluateCount).toBe(1)
})

test("runFromNode on condition node recomputes only newly active branch path", async () => {
    const graph = new ExecutionGraph()

    const xNode = graph.addNode(new ConstValueCard(), 0, 0)
    const cond = new ConstStateCard()
    cond.state = false
    const condNode = graph.addNode(cond, 0, 0)
    const branchNode = graph.addNode(new BranchCard(), 0, 0)
    const trueSink = new CountingSinkCard()
    const falseSink = new CountingSinkCard()
    const trueSinkNode = graph.addNode(trueSink, 0, 0)
    const falseSinkNode = graph.addNode(falseSink, 0, 0)

    graph.connect(xNode, 0, branchNode, 0)
    graph.connect(condNode, 0, branchNode, 1)
    graph.connect(branchNode, 0, trueSinkNode, 0)
    graph.connect(branchNode, 1, falseSinkNode, 0)

    await graph.run()
    expect(trueSink.evaluateCount).toBe(0)
    expect(falseSink.evaluateCount).toBe(1)

    cond.state = true
    const result = await graph.runFromNode(condNode)
    expect(trueSink.evaluateCount).toBe(1)
    expect(falseSink.evaluateCount).toBe(1)
    expect(result.has(trueSinkNode)).toBe(true)
    expect(result.has(falseSinkNode)).toBe(false)
})

test("output-routable card with no active outputs prunes all downstream nodes", async () => {
    const graph = new ExecutionGraph()

    const sourceNode = graph.addNode(new ConstValueCard(), 0, 0)
    const routerNode = graph.addNode(new NoActiveOutputRouterCard(), 0, 0)
    const sink = new CountingSinkCard()
    const sinkNode = graph.addNode(sink, 0, 0)

    graph.connect(sourceNode, 0, routerNode, 0)
    graph.connect(routerNode, 0, sinkNode, 0)

    const result = await graph.run()

    expect(sink.evaluateCount).toBe(0)
    expect(result.has(sinkNode)).toBe(false)
})
