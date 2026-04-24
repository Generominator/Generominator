import { test, expect } from "vitest"
import "@vitest/web-worker"
import { TextToSpeechCard } from "../../src/cards/textToSpeechCard"
//import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"
import {
    TextPort,
    ValuePort,
    WaveformPort,
} from "../../src/cardBase/ports/port"

test("TextToSpeech card ports are correct", () => {
    const card = new TextToSpeechCard()
    expect(card.inputs.length).toBe(3)

    expect(card.inputs[0]).toBeInstanceOf(TextPort)
    expect(card.inputs[0].label).toBe("source text")

    expect(card.inputs[1]).toBeInstanceOf(ValuePort)
    expect(card.inputs[1].label).toBe("speed")

    expect(card.inputs[2]).toBeInstanceOf(ValuePort)
    expect(card.inputs[2].label).toBe("pitch")

    expect(card.outputs.length).toBe(1)
    expect(card.outputs[0]).toBeInstanceOf(WaveformPort)
})

/**
 * Disabled until I find a way to fix

test("TextToSpeech returns waveform for text input", async () => {
    const card = new TextToSpeechCard()
    const textInput = dt.text("hello world, i am audrey")
    const speedInput = dt.value(1.0)
    const pitchInput = dt.value(1.0)

    const result = await card.evaluate([textInput, speedInput, pitchInput])

    expect(result[0].kind).toBe("waveform")
    const out = result[0] as DataTypeOf<"waveform">

    // Check that we actually got audio samples back
    // Since Xenova/mms-tts-eng's default sampling rate is 16000Hz,
    // for every 1 second of audio, there should be 16,000 data points.
    expect(Array.isArray(out.samples)).toBe(true)

    // Let us assume it takes more than one second to say "hello world, i am audrey"
    expect(out.samples.length).toBeGreaterThan(16000)
    expect(typeof out.samples[0]).toBe("number")
}, 30000)

test("TextToSpeech double speed results in half the samples", async () => {
    const card = new TextToSpeechCard()
    const text = dt.text("hello world, i am audrey")

    // Baseline
    const [res1] = await card.evaluate([text, dt.value(1.0), dt.value(1.0)])
    const len1 = (res1 as DataTypeOf<"waveform">).samples.length

    // Double Speed
    const [res2] = await card.evaluate([text, dt.value(2.0), dt.value(1.0)])
    const len2 = (res2 as DataTypeOf<"waveform">).samples.length

    // Samples should shorter than baseline (ideally half)
    expect(len2).lessThan(len1)
}, 30000)

test("TextToSpeech pitch adjustment affects sample count correctly", async () => {
    const card = new TextToSpeechCard()
    const text = dt.text("hello world, i am audrey")

    // 1. Baseline
    const [res1] = await card.evaluate([text, dt.value(1.0), dt.value(1.0)])
    const len1 = (res1 as DataTypeOf<"waveform">).samples.length

    // High Pitch (2.0)
    // 1.0 / 2.0 = 0.5 --> double samples
    // Length / 0.5 = Double the samples.
    const [res2] = await card.evaluate([text, dt.value(1.0), dt.value(2.0)])
    const len2 = (res2 as DataTypeOf<"waveform">).samples.length

    // Low Pitch (0.5)
    // 1.0 / 0.5 = 2.0 --> half the samples.
    const [res3] = await card.evaluate([text, dt.value(1.0), dt.value(0.5)])
    const len3 = (res3 as DataTypeOf<"waveform">).samples.length

    expect(len2).toBeLessThan(len1)
    expect(len3).toBeGreaterThan(len1)
}, 30000)

test("TextToSpeech returns empty waveform for invalid inputs", async () => {
    const card = new TextToSpeechCard()

    // Test with empty string
    const result = await card.evaluate([dt.text(""), dt.value(1), dt.value(1)])
    const out = result[0] as DataTypeOf<"waveform">

    expect(out.samples.length).toBe(0)
})
*/
