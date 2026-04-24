import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { AndCard } from "../../src/cards/andCard"
import { buttonCard } from "../../src/cards/buttonCard"
import { CompareCard } from "../../src/cards/compareCard"
import { StateMemoryCard } from "../../src/cards/stateMemoryCard"
import { TernaryCard } from "../../src/cards/ternaryCard"
import { ExecutionGraph } from "../../src/execEngine"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"

test("alarm flow: latched mode gates pulse signal into 0/1 output", async () => {
    const graph = new ExecutionGraph()

    // Mode latch controlled by button presses.
    const button = new buttonCard()
    const buttonNode = graph.addNode(button, 0, 0)
    button.setEventCallback(null)

    const modeMemoryNode = graph.addNode(new StateMemoryCard(), 0, 0)
    graph.connect(buttonNode, 0, modeMemoryNode, 2) // toggle

    // Pulse source and threshold comparison (pulse = signal > threshold).
    const signal = new ConstValueCard()
    signal.number = 0
    const threshold = new ConstValueCard()
    threshold.number = 0.85
    const signalNode = graph.addNode(signal, 0, 0)
    const thresholdNode = graph.addNode(threshold, 0, 0)
    const compareNode = graph.addNode(new CompareCard(), 0, 0)

    graph.connect(signalNode, 0, compareNode, 0)
    graph.connect(thresholdNode, 0, compareNode, 1)

    // strobeActive = mode && pulse
    const andNode = graph.addNode(new AndCard(), 0, 0)
    graph.connect(modeMemoryNode, 0, andNode, 0)
    graph.connect(compareNode, 2, andNode, 1) // ">" output

    // Output value: strobeActive ? 1 : 0
    const hi = new ConstValueCard()
    hi.number = 1
    const lo = new ConstValueCard()
    lo.number = 0
    const hiNode = graph.addNode(hi, 0, 0)
    const loNode = graph.addNode(lo, 0, 0)
    const ternaryNode = graph.addNode(new TernaryCard(), 0, 0)

    graph.connect(andNode, 0, ternaryNode, 0)
    graph.connect(hiNode, 0, ternaryNode, 1)
    graph.connect(loNode, 0, ternaryNode, 2)

    // Initial: mode off, no pulse.
    let results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(0))

    // Pulse high while mode off -> still off.
    signal.number = 0.9
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(0))

    // Press button: mode toggles on.
    button.setValue(true)
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(1))

    // Release: mode stays on.
    button.setValue(false)
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(1))

    // Pulse low while mode on -> off output.
    signal.number = 0.2
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(0))

    // Pulse high while mode on -> on output.
    signal.number = 0.95
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(1))

    // Press button again: mode toggles off.
    button.setValue(true)
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(0))

    // Release: stays off.
    button.setValue(false)
    results = await graph.run()
    expect(results.get(ternaryNode)?.[0]).toEqual(dt.value(0))
})
