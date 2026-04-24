import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { ExecutionGraph } from "../../src/execEngine"
import { SelectCard } from "../../src/cards/selectCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"

test("SelectCard outputs the exact indexed input", async () => {
    const graph = new ExecutionGraph()

    const in0 = new ConstValueCard()
    in0.number = 10
    const in1 = new ConstValueCard()
    in1.number = 20
    const in2 = new ConstValueCard()
    in2.number = 30
    const index = new ConstValueCard()
    index.number = 1

    const in0Node = graph.addNode(in0, 0, 0)
    const in1Node = graph.addNode(in1, 0, 0)
    const in2Node = graph.addNode(in2, 0, 0)
    const indexNode = graph.addNode(index, 0, 0)
    const selectNode = graph.addNode(new SelectCard(), 0, 0)

    graph.connect(in0Node, 0, selectNode, 0)
    graph.connect(in1Node, 0, selectNode, 1)
    graph.connect(in2Node, 0, selectNode, 2)
    graph.connect(indexNode, 0, selectNode, 3)

    const result = await graph.run()
    expect(result.get(selectNode)?.[0]).toEqual(dt.value(20))
})

test("SelectCard clamps index below 0 to input 0", async () => {
    const graph = new ExecutionGraph()

    const in0 = new ConstValueCard()
    in0.number = 11
    const in1 = new ConstValueCard()
    in1.number = 22
    const in2 = new ConstValueCard()
    in2.number = 33
    const index = new ConstValueCard()
    index.number = -5

    const in0Node = graph.addNode(in0, 0, 0)
    const in1Node = graph.addNode(in1, 0, 0)
    const in2Node = graph.addNode(in2, 0, 0)
    const indexNode = graph.addNode(index, 0, 0)
    const selectNode = graph.addNode(new SelectCard(), 0, 0)

    graph.connect(in0Node, 0, selectNode, 0)
    graph.connect(in1Node, 0, selectNode, 1)
    graph.connect(in2Node, 0, selectNode, 2)
    graph.connect(indexNode, 0, selectNode, 3)

    const result = await graph.run()
    expect(result.get(selectNode)?.[0]).toEqual(dt.value(11))
})

test("SelectCard clamps index above 2 to input 2", async () => {
    const graph = new ExecutionGraph()

    const in0 = new ConstValueCard()
    in0.number = 100
    const in1 = new ConstValueCard()
    in1.number = 200
    const in2 = new ConstValueCard()
    in2.number = 300
    const index = new ConstValueCard()
    index.number = 99

    const in0Node = graph.addNode(in0, 0, 0)
    const in1Node = graph.addNode(in1, 0, 0)
    const in2Node = graph.addNode(in2, 0, 0)
    const indexNode = graph.addNode(index, 0, 0)
    const selectNode = graph.addNode(new SelectCard(), 0, 0)

    graph.connect(in0Node, 0, selectNode, 0)
    graph.connect(in1Node, 0, selectNode, 1)
    graph.connect(in2Node, 0, selectNode, 2)
    graph.connect(indexNode, 0, selectNode, 3)

    const result = await graph.run()
    expect(result.get(selectNode)?.[0]).toEqual(dt.value(300))
})
