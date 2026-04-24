import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { Port, ValuePort, WaveformPort } from "../cardBase/ports/port"

/**
 * Implements the Sample Amplitude Card.
 *
 * @see https://www.keysight.com/used/us/en/knowledge/guides/how-to-measure-amplitude-engineers-guide
 */
export class SampleAmplitudeCard extends Card {
    title = "Sample amplitude"
    description = "Calculate the current amplitude of a wave"
    inputs: Port[] = [new WaveformPort("some waveform", false)]
    outputs: Port[] = [new ValuePort("amplitude")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const waveform = inputs.find(
            (input): input is DataTypeOf<"waveform"> =>
                input.kind === "waveform",
        )

        if (!waveform || waveform.samples.length === 0) {
            return [dt.value(0)]
        }

        // Returns the peak amplitude of a given wave
        // This is the absolute value of the height from the equilibrium level to the peak of the wave.
        let max = 0
        for (const s of waveform.samples) {
            const abs = Math.abs(s)
            if (abs > max) max = abs
        }
        return [dt.value(max)]
    }

    init(): void {}
    cleanup(): void {}
}
