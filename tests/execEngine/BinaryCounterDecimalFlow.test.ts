import { expect, test } from "vitest"
import { buttonCard } from "../../src/cards/buttonCard"
import { StateMemoryCard } from "../../src/cards/stateMemoryCard"
import { NotCard } from "../../src/cards/notCard"
import { TernaryCard } from "../../src/cards/ternaryCard"
import { ArithmeticCard } from "../../src/cards/arithmetic"
import { ValueToScreenCard } from "../../src/cards/valueToScreen"
import { ExecutionGraph } from "../../src/execEngine"
import { dt } from "../../src/cardBase/dataTypes"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"
import { ConstTextCard } from "../testingUtils/testingCards/constText"

test("3-bit ripple counter + ternary weighted decimal flow counts 0..7 on button presses", async () => {
    const graph = new ExecutionGraph()

    // Clock input
    const button = new buttonCard()
    const buttonNode = graph.addNode(button, 0, 0)
    button.setEventCallback(null)

    // Ripple counter bits
    const bit0Node = graph.addNode(new StateMemoryCard(), 0, 0)
    const bit1Node = graph.addNode(new StateMemoryCard(), 0, 0)
    const bit2Node = graph.addNode(new StateMemoryCard(), 0, 0)

    const not0Node = graph.addNode(new NotCard(), 0, 0)
    const not1Node = graph.addNode(new NotCard(), 0, 0)

    graph.connect(buttonNode, 0, bit0Node, 2)
    graph.connect(bit0Node, 0, not0Node, 0)
    graph.connect(not0Node, 0, bit1Node, 2)
    graph.connect(bit1Node, 0, not1Node, 0)
    graph.connect(not1Node, 0, bit2Node, 2)

    // Decimal display flow: b0?1:0 + b1?2:0 + b2?4:0
    const ternary0Node = graph.addNode(new TernaryCard(), 0, 0)
    const ternary1Node = graph.addNode(new TernaryCard(), 0, 0)
    const ternary2Node = graph.addNode(new TernaryCard(), 0, 0)

    const constOne = new ConstValueCard()
    constOne.number = 1
    const constTwo = new ConstValueCard()
    constTwo.number = 2
    const constFour = new ConstValueCard()
    constFour.number = 4
    const constZeroA = new ConstValueCard()
    constZeroA.number = 0
    const constZeroB = new ConstValueCard()
    constZeroB.number = 0
    const constZeroC = new ConstValueCard()
    constZeroC.number = 0

    const oneNode = graph.addNode(constOne, 0, 0)
    const twoNode = graph.addNode(constTwo, 0, 0)
    const fourNode = graph.addNode(constFour, 0, 0)
    const zeroANode = graph.addNode(constZeroA, 0, 0)
    const zeroBNode = graph.addNode(constZeroB, 0, 0)
    const zeroCNode = graph.addNode(constZeroC, 0, 0)

    graph.connect(bit0Node, 0, ternary0Node, 0)
    graph.connect(oneNode, 0, ternary0Node, 1)
    graph.connect(zeroANode, 0, ternary0Node, 2)

    graph.connect(bit1Node, 0, ternary1Node, 0)
    graph.connect(twoNode, 0, ternary1Node, 1)
    graph.connect(zeroBNode, 0, ternary1Node, 2)

    graph.connect(bit2Node, 0, ternary2Node, 0)
    graph.connect(fourNode, 0, ternary2Node, 1)
    graph.connect(zeroCNode, 0, ternary2Node, 2)

    const arithmeticNode = graph.addNode(new ArithmeticCard(), 0, 0)
    const equationCard = new ConstTextCard()
    equationCard.cardString = "a+b+c"
    const equationNode = graph.addNode(equationCard, 0, 0)

    graph.connect(ternary0Node, 0, arithmeticNode, 0)
    graph.connect(ternary1Node, 0, arithmeticNode, 1)
    graph.connect(ternary2Node, 0, arithmeticNode, 2)
    graph.connect(equationNode, 0, arithmeticNode, 4)

    // Include the display sink to mirror the exact flow.
    const displayNode = graph.addNode(new ValueToScreenCard(), 0, 0)
    graph.connect(arithmeticNode, 0, displayNode, 0)

    await graph.run()

    const expectedAfterPress = [1, 2, 3, 4, 5, 6, 7, 0]
    for (const expected of expectedAfterPress) {
        button.setValue(true)
        const pressResult = await graph.run()
        expect(pressResult.get(arithmeticNode)?.[0]).toEqual(dt.value(expected))

        // Release should not increment again.
        button.setValue(false)
        const releaseResult = await graph.run()
        expect(releaseResult.get(arithmeticNode)?.[0]).toEqual(
            dt.value(expected),
        )
    }
})
