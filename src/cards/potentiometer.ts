import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ValuePort, type Port } from "../cardBase/ports/port"

export class Potentiometer extends Card implements EventEmitting {
    //card metadata
    title: string = "potentiometer"
    description: string = "Slider input that outputs a numeric value"
    inputs: Port[] = []
    outputs: Port[]
    value = 0
    private eventCallback: CardEventCallback | null = null

    constructor() {
        super()
        this.outputs = [new ValuePort("value")]
    }

    // Allows the ui to set the value and trigger an update
    setValue(newValue: number) {
        if (this.value !== newValue) {
            this.value = newValue
            if (this.eventCallback) this.eventCallback()
        }
    }

    async evaluate(): Promise<DataType[]> {
        //return current value on potentiometer
        return [dt.value(this.value)]
    }

    init(): void {}

    cleanup(): void {
        //Not required
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }
}
