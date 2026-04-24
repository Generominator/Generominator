import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import { type Port, StatePort } from "../cardBase/ports/port.ts"

export class buttonCard extends Card implements EventEmitting {
    description: string = ""
    inputs: Port[] = []
    outputs: Port[] = [new StatePort()]
    title: string = "Button"
    private eventCallback: CardEventCallback | null = null

    cardState = false

    // Allows the ui to set the value and trigger an update
    setValue(newValue: boolean) {
        this.cardState = newValue
        if (this.eventCallback) this.eventCallback()
    }

    cleanup(): void {}

    async evaluate(): Promise<DataType[]> {
        return [dt.state(this.cardState)]
    }

    init(): void {}

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }
}
