import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { CompareToZeroCard } from "../../src/cards/compareToZeroCard"
import { ExecutionGraph } from "../../src/execEngine"
import { CountingSinkCard } from "../testingUtils/CountingSinkCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"

test("CompareToZeroCard binds generic type from input and forwards value", async () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const numberCard = new ConstValueCard()
    numberCard.number = 0
    const numberNode = graph.addNode(numberCard, 0, 0)
    const compare = new CompareToZeroCard()
    const compareNode = graph.addNode(compare, 0, 0)

    graph.connect(valueNode, 0, compareNode, 0)
    graph.connect(numberNode, 0, compareNode, 1)

    const results = await graph.run()

    expect(compare.valuePort.boundType).toBe("value")
    expect(compare.lessThanZeroPort.boundType).toBe("value")
    expect(compare.equalZeroPort.boundType).toBe("value")
    expect(compare.greaterThanZeroPort.boundType).toBe("value")
    expect(results.get(compareNode)).toEqual([
        dt.value(5),
        dt.value(5),
        dt.value(5),
    ])
})

test("CompareToZeroCard executes only '<0' downstream path for negative n", async () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const numberCard = new ConstValueCard()
    numberCard.number = -1
    const numberNode = graph.addNode(numberCard, 0, 0)
    const compareNode = graph.addNode(new CompareToZeroCard(), 0, 0)

    const ltSink = new CountingSinkCard()
    const eqSink = new CountingSinkCard()
    const gtSink = new CountingSinkCard()
    const ltSinkNode = graph.addNode(ltSink, 0, 0)
    const eqSinkNode = graph.addNode(eqSink, 0, 0)
    const gtSinkNode = graph.addNode(gtSink, 0, 0)

    graph.connect(valueNode, 0, compareNode, 0)
    graph.connect(numberNode, 0, compareNode, 1)
    graph.connect(compareNode, 0, ltSinkNode, 0)
    graph.connect(compareNode, 1, eqSinkNode, 0)
    graph.connect(compareNode, 2, gtSinkNode, 0)

    const results = await graph.run()

    expect(ltSink.evaluateCount).toBe(1)
    expect(eqSink.evaluateCount).toBe(0)
    expect(gtSink.evaluateCount).toBe(0)
    expect(results.has(ltSinkNode)).toBe(true)
    expect(results.has(eqSinkNode)).toBe(false)
    expect(results.has(gtSinkNode)).toBe(false)
})

test("CompareToZeroCard executes only '=0' downstream path for zero n", async () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const numberCard = new ConstValueCard()
    numberCard.number = 0
    const numberNode = graph.addNode(numberCard, 0, 0)
    const compareNode = graph.addNode(new CompareToZeroCard(), 0, 0)

    const ltSink = new CountingSinkCard()
    const eqSink = new CountingSinkCard()
    const gtSink = new CountingSinkCard()
    const ltSinkNode = graph.addNode(ltSink, 0, 0)
    const eqSinkNode = graph.addNode(eqSink, 0, 0)
    const gtSinkNode = graph.addNode(gtSink, 0, 0)

    graph.connect(valueNode, 0, compareNode, 0)
    graph.connect(numberNode, 0, compareNode, 1)
    graph.connect(compareNode, 0, ltSinkNode, 0)
    graph.connect(compareNode, 1, eqSinkNode, 0)
    graph.connect(compareNode, 2, gtSinkNode, 0)

    const results = await graph.run()

    expect(ltSink.evaluateCount).toBe(0)
    expect(eqSink.evaluateCount).toBe(1)
    expect(gtSink.evaluateCount).toBe(0)
    expect(results.has(ltSinkNode)).toBe(false)
    expect(results.has(eqSinkNode)).toBe(true)
    expect(results.has(gtSinkNode)).toBe(false)
})

test("CompareToZeroCard executes only '>0' downstream path for positive n", async () => {
    const graph = new ExecutionGraph()

    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const numberCard = new ConstValueCard()
    numberCard.number = 1
    const numberNode = graph.addNode(numberCard, 0, 0)
    const compareNode = graph.addNode(new CompareToZeroCard(), 0, 0)

    const ltSink = new CountingSinkCard()
    const eqSink = new CountingSinkCard()
    const gtSink = new CountingSinkCard()
    const ltSinkNode = graph.addNode(ltSink, 0, 0)
    const eqSinkNode = graph.addNode(eqSink, 0, 0)
    const gtSinkNode = graph.addNode(gtSink, 0, 0)

    graph.connect(valueNode, 0, compareNode, 0)
    graph.connect(numberNode, 0, compareNode, 1)
    graph.connect(compareNode, 0, ltSinkNode, 0)
    graph.connect(compareNode, 1, eqSinkNode, 0)
    graph.connect(compareNode, 2, gtSinkNode, 0)

    const results = await graph.run()

    expect(ltSink.evaluateCount).toBe(0)
    expect(eqSink.evaluateCount).toBe(0)
    expect(gtSink.evaluateCount).toBe(1)
    expect(results.has(ltSinkNode)).toBe(false)
    expect(results.has(eqSinkNode)).toBe(false)
    expect(results.has(gtSinkNode)).toBe(true)
})
