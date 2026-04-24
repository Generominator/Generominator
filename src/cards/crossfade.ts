import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ValuePort, WaveformPort, type Port } from "../cardBase/ports/port"

export class Crossfade extends Card {
    title = "Crossfade"
    description = "Blend two audio waveforms with a configurable overlap."
    inputs: Port[] = [
        new WaveformPort("samples A", false),
        new WaveformPort("samples B", false),
        new ValuePort("overlap", true, dt.value(0.5)),
    ]
    outputs: Port[] = [new WaveformPort("samples")]

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
        //check input types
        const waveformInputs = inputs.filter(
            (input): input is DataTypeOf<"waveform"> =>
                input !== null && input.kind === "waveform",
        )

        const samplesA = waveformInputs[0]
        const samplesB = waveformInputs[1]

        //Checks to make sure we have proper inputs
        if (!samplesA || !samplesB) {
            throw new Error("Crossfade requires two waveform inputs.")
        }
        const mixInput = inputs.find(
            (input): input is DataTypeOf<"value"> =>
                input !== null && input.kind === "value",
        )
        //Default mix to 0.5 if not provided,
        const rawMix = mixInput?.value ?? 0.5
        //ensure the mix value is in the proper range
        if (rawMix < 0) {
            throw new Error(
                `Crossfade mix value must be greater than 0, got ${rawMix}`,
            )
        }

        const samplesBAtRateA = this.resampleLinear(
            samplesB.samples,
            samplesB.sampleRate,
            samplesA.sampleRate,
        )

        const overlap = Math.min(
            samplesA.samples.length,
            samplesBAtRateA.length,
            Math.floor(samplesA.sampleRate * rawMix),
        )

        /*
           A:   ========================
           B:                        ===============
           
           Determine length of waveform to output: sample A + sample B, not counting the overlap twice
        */
        const length =
            samplesA.samples.length + samplesBAtRateA.length - overlap
        const pureA = samplesA.samples.length - overlap

        //Blend the two waveforms together based on the mix value, using formula: https://stackoverflow.com/questions/20135362/beginner-python-programming-help-to-crossfade-sounds
        const blended = new Array<number>(length)
        for (let i = 0; i < length; i++) {
            const indexB = i - pureA
            if (i < pureA) {
                blended[i] = samplesA.samples[i]
            } else if (i < samplesA.samples.length) {
                const t = indexB / overlap
                blended[i] =
                    samplesA.samples[i] * (1 - t) + samplesBAtRateA[indexB] * t
            } else {
                blended[i] = samplesBAtRateA[indexB]
            }
        }

        return [dt.waveform(blended, samplesA.sampleRate)]
    }

    init(): void {}
    cleanup(): void {}
}

export default Crossfade
