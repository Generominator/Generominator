import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { VectorPort, WaveformPort, type Port } from "../cardBase/ports/port"
import ft from "fourier-transform"

export class FourierTransform extends Card {
    title = "Fourier Transform"
    description = "Turn an audio signal into multiple frequencies."
    inputs: Port[] = [new WaveformPort("samples", false, dt.waveform([]))]
    outputs: Port[] = [new VectorPort("spectrum")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const samples = inputs.find(
            (input): input is DataTypeOf<"waveform"> =>
                input.kind === "waveform",
        )

        const result = ft(samples!.samples)

        if (!samples) {
            throw new Error("samples is undefined.")
        }

        return [dt.vector(result)]
    }

    init(): void {}
    cleanup(): void {}
}

export default FourierTransform
