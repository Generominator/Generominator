import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../../src/cardBase/card"
import { ValuePort } from "../../src/cardBase/ports/port"
import { type DataType, dt } from "../../src/cardBase/dataTypes"

/**
 * A test card implementing the event interface that takes in an input, adds its internal value to it, and then
 * outputs that added value. When the event function is called, it increases its internal value.
 */
export class EventEmittingWithInputCard extends Card implements EventEmitting {
    title = "Event Card With Input"
    description = "An event card that also takes an input"
    inputs = [new ValuePort("input")]
    outputs = [new ValuePort("output")]

    private eventCallback: CardEventCallback | null = null
    private internalValue = 0
    evaluateCount = 0

    init(): void {
        // Not required for this card
    }

    cleanup(): void {
        this.eventCallback = null
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    triggerEvent(): void {
        this.internalValue += 1000
        if (this.eventCallback) {
            this.eventCallback()
        }
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        this.evaluateCount++
        const input = inputs[0]
        if (input?.kind === "value") {
            return [dt.value(input.value + this.internalValue)]
        }
        return [dt.value(this.internalValue)]
    }
}
