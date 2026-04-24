import { Card } from "../cardBase/card"
import {
    DEFAULT_AUDIO_SAMPLE_RATE,
    dt,
    type DataType,
} from "../cardBase/dataTypes"
import {
    VectorPort,
    WaveformPort,
    type Port,
    ValuePort,
} from "../cardBase/ports/port"

export class VectorToWaveform extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Vector to Waveform"
    description: string = ""
    constructor() {
        super()
        this.inputs = [
            new VectorPort("vector", false, dt.vector([0, 0, 0])),
            new ValuePort(
                "sample rate",
                false,
                dt.value(DEFAULT_AUDIO_SAMPLE_RATE),
            ),
        ]
        this.outputs = [new WaveformPort("waveform")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 2 ||
            inputs[0].kind !== "vector" ||
            inputs[1].kind !== "value"
        ) {
            throw new Error(
                `VectorToWaveform expects exactly two inputs, got: ${JSON.stringify(inputs)}`,
            )
        }
        return [dt.waveform(inputs[0].value.components, inputs[1].value)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
