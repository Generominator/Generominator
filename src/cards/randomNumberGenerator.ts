import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ValuePort } from "../cardBase/ports/port"

export class RandomNumberCard extends Card {
    title = "pseudorandom number generator"
    description = "Generate a random value!"
    inputs = []
    outputs = [new ValuePort("value")]

    // updated number(newest)
    private lastValue: number = 0
    init() {
        // generate a random number to save a seat
        this.lastValue = Math.random()
    }

    async evaluate(): Promise<DataType[]> {
        this.lastValue = Math.random()

        return [dt.value(this.lastValue)]
    }

    cleanup() {}
}
