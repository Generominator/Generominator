import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { WaveformPort } from "../cardBase/ports/port"

// import sample wav file
declare module "*.wav"
import sample from "../assets/audio/sample.wav"

/**
 * input card, so takes no input from other cards.
 * outputs a static sample as waveform (array of floats)
 */
export class Music extends Card {
    title = "music"
    description = "Outputs a constant music file"
    inputs = []
    outputs = [new WaveformPort()]

    init() {
        //no op
    }

    async evaluate(): Promise<DataType[]> {
        const audioContext = new window.AudioContext()

        // fetch file, then decode audio data
        const response = await fetch(sample)
        const buffer = await audioContext.decodeAudioData(
            await response.arrayBuffer(),
        )

        // return the channel data as a series of floats
        return [dt.waveform([...buffer.getChannelData(0)], buffer.sampleRate)]
    }

    cleanup() {
        // no op
    }
}
