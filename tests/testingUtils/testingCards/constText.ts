import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../../../src/cardBase/card.ts"
import { type Port, TextPort } from "../../../src/cardBase/ports/port.ts"
import { type DataType, dt } from "../../../src/cardBase/dataTypes.ts"

export class ConstTextCard extends Card implements EventEmitting {
    title = "Const Text"
    description = "A card that outputs a constant text value."
    inputs: Port[] = []
    outputs: Port[] = [new TextPort()]
    private eventCallback: CardEventCallback | null = null

    // Default to an empty string to later be set via ui
    cardString = "Change Me :)"

    cleanup(): void {
        // Not req
    }

    // Allows the ui to set the value and trigger an update
    setValue(newString: string) {
        if (this.cardString !== newString) {
            this.cardString = newString
            if (this.eventCallback) this.eventCallback()
        }
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.text(this.cardString)]
    }

    init(): void {
        // Not required
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }
}
