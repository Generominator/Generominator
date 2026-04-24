import { Card } from "../cardBase/card"
import {
    DEFAULT_AUDIO_SAMPLE_RATE,
    dt,
    type DataType,
} from "../cardBase/dataTypes"
import { ValuePort, WaveformPort, type Port } from "../cardBase/ports/port"

export class Resample extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Resample a Waveform"
    description: string = ""
    constructor() {
        super()
        this.inputs = [
            new WaveformPort("waveform", false, dt.waveform([])),
            new ValuePort(
                "sample rate",
                true,
                dt.value(DEFAULT_AUDIO_SAMPLE_RATE),
            ),
        ]
        this.outputs = [new WaveformPort("waveform")]
    }

    private resampleLinear(
        samples: number[],
        sourceRate: number,
        targetRate: number,
    ): number[] {
        if (samples.length === 0 || sourceRate === targetRate) {
            return [...samples]
        }

        const ratio = sourceRate / targetRate
        const outputLength = Math.max(1, Math.round(samples.length / ratio))
        const output = new Array<number>(outputLength)

        for (let i = 0; i < outputLength; i++) {
            const position = i * ratio
            const left = Math.floor(position)
            const right = Math.min(left + 1, samples.length - 1)
            const fraction = position - left
            const leftValue = samples[Math.min(left, samples.length - 1)] ?? 0
            const rightValue = samples[right] ?? leftValue
            output[i] = leftValue + (rightValue - leftValue) * fraction
        }

        return output
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length < 1 ||
            inputs[0].kind !== "waveform" ||
            (inputs.length > 1 && inputs[1].kind !== "value")
        ) {
            throw new Error(
                `Resample expects oe waveform and one optional value, got: ${JSON.stringify(inputs)}`,
            )
        }

        const newSampleRate =
            inputs.length > 1 && inputs[1].kind === "value"
                ? inputs[1].value
                : DEFAULT_AUDIO_SAMPLE_RATE

        const resampled = this.resampleLinear(
            inputs[0].samples,
            inputs[0].sampleRate,
            newSampleRate,
        )
        return [dt.waveform(resampled, newSampleRate)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
