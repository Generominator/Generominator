import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../../../src/cardBase/card"
import { Port, ValuePort } from "../../../src/cardBase/ports/port"
import { type DataType, dt } from "../../../src/cardBase/dataTypes"

/**
 * A test card that implements the event interface. Has a method that simulates an event being triggered.
 */
export class EventEmittingTestCard extends Card implements EventEmitting {
    title = "Event Test Card"
    description = "A card that can emit events"
    inputs: Port[] = []
    outputs = [new ValuePort("value")]

    private eventCallback: CardEventCallback | null = null
    private internalValue = 0

    init(): void {
        // Not needed for this card
    }

    cleanup(): void {
        this.eventCallback = null
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    // Simulates an event being triggered in the card. Increments internalValue and calls the event callback.
    triggerEvent(): void {
        this.internalValue++
        if (this.eventCallback) {
            this.eventCallback()
        }
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.value(this.internalValue)]
    }
}
