import { expect, test } from "vitest"
import type { DataTypeOf } from "../../src/cardBase/dataTypes"
import { dt } from "../../src/cardBase/dataTypes"
import { Crossfade } from "../../src/cards/crossfade"

test("Crossfades two waveforms", async () => {
    const card = new Crossfade()

    const samplesA = [1, 2, 3, 4, 5]
    const samplesB = [10, 20, 30, 40, 50]
    const mix = 1 // 1 second

    const outputs = await card.evaluate([
        dt.waveform(samplesA, 2),
        dt.waveform(samplesB, 2),
        dt.value(mix),
    ])

    expect(outputs).toBeDefined()
    expect(outputs.length).toBe(1)

    const result = outputs[0] as DataTypeOf<"waveform">
    expect(result.kind).toBe("waveform")
    expect(result.samples.length).toBe(8)
    expect(result.samples[4]).toBe((samplesA[4] + samplesB[1]) / 2)
})

test("Crossfades two waveforms for too long", async () => {
    const card = new Crossfade()

    const samplesA = [1, 2, 3, 4, 5]
    const samplesB = [10, 20, 30, 40, 50]
    const mix = 10 // 10s crossfade on 2.5s samples

    const outputs = await card.evaluate([
        dt.waveform(samplesA, 2),
        dt.waveform(samplesB, 2),
        dt.value(mix),
    ])

    expect(outputs).toBeDefined()
    expect(outputs.length).toBe(1)

    const result = outputs[0] as DataTypeOf<"waveform">
    expect(result.kind).toBe("waveform")
    expect(result.samples.length).toEqual(5)
})

test("Crossfade resamples B to A sample rate when rates differ", async () => {
    const card = new Crossfade()

    const outputs = await card.evaluate([
        dt.waveform([1, 1], 4),
        dt.waveform([0, 10, 20, 30], 8),
        dt.value(1),
    ])

    const result = outputs[0] as DataTypeOf<"waveform">
    expect(result.kind).toBe("waveform")
    expect(result.sampleRate).toBe(4)
})
