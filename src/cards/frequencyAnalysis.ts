import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { VectorPort, WaveformPort, type Port } from "../cardBase/ports/port"
import ft from "fourier-transform"

export class FrequencyAnalysis extends Card {
    title = "Frequency Analysis"
    description =
        "Take an audio signal and extract the energy of the most prevalent frequencies."
    inputs: Port[] = [new WaveformPort("samples", false, dt.waveform([]))]
    outputs: Port[] = [
        new VectorPort("frequencies"),
        new VectorPort("energies"),
    ]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const samples = inputs.find(
            (input): input is DataTypeOf<"waveform"> =>
                input.kind === "waveform",
        )

        if (!samples) {
            throw new Error("sample is undefined.")
        }

        const result = ft(samples.samples)
        const N = samples.samples.length

        // Build array of {frequency, energy} pairs
        const pairs = result.map((energy, i) => ({
            frequency: (i * samples.sampleRate) / N,
            energy: energy,
        }))

        // Sort by energy descending
        pairs.sort((a, b) => b.energy - a.energy)

        // Extract sorted arrays
        const frequencies = pairs.map((p) => p.frequency)
        const energies = pairs.map((p) => p.energy)

        return [dt.vector(frequencies), dt.vector(energies)]
    }

    init(): void {}
    cleanup(): void {}
}

export default FrequencyAnalysis
