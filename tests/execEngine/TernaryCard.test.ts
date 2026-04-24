import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { TernaryCard } from "../../src/cards/ternaryCard"
import { ExecutionGraph } from "../../src/execEngine"
import { ConstStateCard } from "../testingUtils/testingCards/constStateCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"

test("TernaryCard outputs input a when cond is true", async () => {
    const graph = new ExecutionGraph()

    const condCard = new ConstStateCard()
    condCard.state = true
    const condNode = graph.addNode(condCard, 0, 0)

    const aCard = new ConstValueCard()
    aCard.number = 11
    const bCard = new ConstValueCard()
    bCard.number = 22
    const aNode = graph.addNode(aCard, 0, 0)
    const bNode = graph.addNode(bCard, 0, 0)
    const ifNode = graph.addNode(new TernaryCard(), 0, 0)

    graph.connect(condNode, 0, ifNode, 0)
    graph.connect(aNode, 0, ifNode, 1)
    graph.connect(bNode, 0, ifNode, 2)

    const result = await graph.run()
    expect(result.get(ifNode)?.[0]).toEqual(dt.value(11))
})

test("TernaryCard outputs input b when cond is false", async () => {
    const graph = new ExecutionGraph()

    const condCard = new ConstStateCard()
    condCard.state = false
    const condNode = graph.addNode(condCard, 0, 0)

    const aCard = new ConstValueCard()
    aCard.number = 11
    const bCard = new ConstValueCard()
    bCard.number = 22
    const aNode = graph.addNode(aCard, 0, 0)
    const bNode = graph.addNode(bCard, 0, 0)
    const ifNode = graph.addNode(new TernaryCard(), 0, 0)

    graph.connect(condNode, 0, ifNode, 0)
    graph.connect(aNode, 0, ifNode, 1)
    graph.connect(bNode, 0, ifNode, 2)

    const result = await graph.run()
    expect(result.get(ifNode)?.[0]).toEqual(dt.value(22))
})

test("TernaryCard node-scoped generic ports bind from concrete connections", () => {
    const graph = new ExecutionGraph()
    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const ternaryCard = new TernaryCard()
    const ifNode = graph.addNode(ternaryCard, 0, 0)

    expect(ternaryCard.aPort.dataType).toBe("generic")
    expect(ternaryCard.bPort.dataType).toBe("generic")
    expect(ternaryCard.outPort.dataType).toBe("generic")

    graph.connect(valueNode, 0, ifNode, 1)

    expect(ternaryCard.aPort.dataType).toBe("value")
    expect(ternaryCard.bPort.dataType).toBe("value")
    expect(ternaryCard.outPort.dataType).toBe("value")
})
