import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import {
    VectorPort,
    ValuePort,
    WaveformPort,
    type Port,
} from "../cardBase/ports/port"

export class WaveformToVector extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Waveform to Vector"
    description: string = ""
    constructor() {
        super()
        this.inputs = [new WaveformPort("waveform", false, dt.waveform([]))]
        this.outputs = [
            new VectorPort("vector"),
            new ValuePort("sampling rate"),
        ]
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (inputs.length !== 1 || inputs[0].kind !== "waveform") {
            throw new Error(
                `WaveformToVector expects exactly one input, got: ${JSON.stringify(inputs)}`,
            )
        }

        return [
            dt.vector([...inputs[0].samples]),
            dt.value(inputs[0].sampleRate),
        ]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
