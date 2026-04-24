import { test, expect } from "vitest"
import { FourierTransform } from "../../src/cards/fourierTransform"
import { DataTypeOf, dt } from "../../src/cardBase/dataTypes"

test("FourierTransform on oscillation", async () => {
    const fourier = new FourierTransform()
    const samples = []
    for (let i = 0; i < 16; ++i) {
        samples.push(i % 2)
    }
    const input = dt.waveform(samples)
    const result = await fourier.evaluate([input])

    expect(result[0].kind).toBe("vector")
    const result_vec = result[0] as DataTypeOf<"vector">

    if (!("components" in result_vec.value)) {
        throw new Error("Components not found in result.")
    }

    expect(result_vec.value.components[0]).toBeGreaterThan(0.5)
    expect(result_vec.value.components[7]).toBeGreaterThan(0.5)
    let sum = 0
    for (let i = 1; i < 7; ++i) {
        sum += result_vec.value.components[i]
    }
    expect(sum).toBe(0)
})
