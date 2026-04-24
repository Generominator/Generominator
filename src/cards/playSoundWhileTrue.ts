import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { StatePort, WaveformPort, type Port } from "../cardBase/ports/port"

/**
 * Implements play sound while true card.
 */
export class PlaySoundWhileTrueCard extends Card {
    title: string = "Play sound while true"
    description: string =
        "Play this sound while in the state (or else play the other sound)"

    inputs: Port[] = [
        new StatePort("condition", false, dt.state(false)),
        new WaveformPort("sound", false, dt.waveform([])),
        new WaveformPort("alternate sound", false, dt.waveform([])),
    ]

    outputs: Port[] = [new WaveformPort()]

    private lastState: boolean = false

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const state = inputs[0] as DataTypeOf<"state">
        const soundInput = inputs[1] as DataTypeOf<"waveform">
        const altSoundInput = inputs[2] as DataTypeOf<"waveform">

        const stateActive = state.value
        const soundSamples = soundInput.samples
        const altSoundSamples = altSoundInput.samples

        let outputSamples: number[] = []
        let outputSampleRate = soundInput.sampleRate

        if (stateActive) {
            // Play first sound if state is active or is true
            outputSamples = soundSamples
            outputSampleRate = soundInput.sampleRate
        } else if (this.lastState === true && !stateActive) {
            // Play alt sound if state isn't active currently or is false
            outputSamples = altSoundSamples
            outputSampleRate = altSoundInput.sampleRate
        } else {
            // Output nothing if state / event has done nothing ever
            outputSamples = []
        }

        this.lastState = stateActive
        return [dt.waveform(outputSamples, outputSampleRate)]
    }

    init(): void {}
    cleanup(): void {}
}
