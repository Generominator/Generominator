import { test, expect } from "vitest"
import { SampleAmplitudeCard } from "../../src/cards/sampleAmplitude"
import { DataTypeOf, dt } from "../../src/cardBase/dataTypes"

test("SampleAmplitude finds the peak amplitude (pos)", async () => {
    const card = new SampleAmplitudeCard()

    // [0, 0.2, 0.8, 0.4] -> Peak should be 0.8
    const input = dt.waveform([0, 0.2, 0.8, 0.4])

    const [result] = await card.evaluate([input])

    expect(result.kind).toBe("value")
    expect((result as DataTypeOf<"value">).value).toBe(0.8)
})

test("SampleAmplitude finds the peak amplitude (neg)", async () => {
    const card = new SampleAmplitudeCard()

    // Waveform: [0, -0.9, 0.1] -> Peak should be =0.9
    const input = dt.waveform([0, -0.9, 0.1])

    const [result] = await card.evaluate([input])

    // Amplitude still positive though because it's the magnitude of displacement
    expect((result as DataTypeOf<"value">).value).toBe(0.9)
})

test("SampleAmplitude handles error states correctly", async () => {
    const card = new SampleAmplitudeCard()
    const [emptyInputResult] = await card.evaluate([dt.waveform([])])
    expect((emptyInputResult as DataTypeOf<"value">).value).toBe(0)
})
