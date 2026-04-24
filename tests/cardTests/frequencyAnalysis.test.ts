import { test, expect } from "vitest"
import { FrequencyAnalysis } from "../../src/cards/frequencyAnalysis"
import { DataTypeOf, dt } from "../../src/cardBase/dataTypes"

test("FrequencyAnalysis on oscillation", async () => {
    const freq = new FrequencyAnalysis()
    const samples = []
    for (let i = 0; i < 16; ++i) {
        samples.push(i % 2)
    }
    const input = dt.waveform(samples, 32)
    const result = await freq.evaluate([input])

    expect(result[0].kind).toBe("vector")
    const result0 = result[0] as DataTypeOf<"vector">
    expect(result[1].kind).toBe("vector")
    const result1 = result[1] as DataTypeOf<"vector">

    if (!("components" in result0.value) || !("components" in result1.value)) {
        throw new Error("components not found in results.")
    }

    expect(result0.value.x()).toBe(0)
    expect(result0.value.y()).toBe(14)
    expect(result1.value.x()).toBe(1)
    expect(result1.value.y()).toBe(1)
})

test("FrequencyAnalysis on a ~1.48s sample of an A4", async () => {
    const freq = new FrequencyAnalysis()
    const samples = []
    const N = 2 ** 16
    const SAMPLE_RATE = 44100 // CD quality sampling
    const FREQUENCY = 440 // note A4
    const AMPLITUDE = 2 ** 15 - 1
    for (let i = 0; i < N; ++i) {
        const t = (FREQUENCY * i) / SAMPLE_RATE
        samples.push(AMPLITUDE * Math.sin(t * 2 * Math.PI))
    }
    const input = dt.waveform(samples)
    const result = await freq.evaluate([input, dt.value(SAMPLE_RATE)])
    const result_vec = result[0] as DataTypeOf<"vector">

    // The top frequency is not exactly 440 due to aliasing, windowing and/or leakage; should be pretty close, though
    if (!("components" in result_vec.value)) {
        throw new Error("components not found in results.")
    }

    expect(Math.abs(result_vec.value.x() - FREQUENCY)).toBeLessThan(2)
})
