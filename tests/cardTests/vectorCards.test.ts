import { test, expect } from "vitest"
import { ZeroPad } from "../../src/cards/zeroPad"
import { ZeroPadPowerOf2 } from "../../src/cards/zeroPadPowerOf2"
import { WaveformToVector } from "../../src/cards/waveformToVector"
import { VectorToWaveform } from "../../src/cards/vectorToWaveform"
import { Resample } from "../../src/cards/resample"
import { DEFAULT_AUDIO_SAMPLE_RATE, dt } from "../../src/cardBase/dataTypes"

test("Zero pad adds zeros on the left", async () => {
    const zeropad = new ZeroPad()
    const input = [1, 2, 3, 4, 5]

    // pad on the left to length 7
    const result = await zeropad.evaluate([
        dt.vector(input),
        dt.value(7),
        dt.value(-1),
    ])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        expect(output[0]).toBe(0)
        expect(output[1]).toBe(0)
        for (let i = 0; i < input.length; ++i) {
            expect(output[i + 2]).toBe(input[i])
        }
    }
})

test("Zero pad adds zeros on both sides", async () => {
    const zeropad = new ZeroPad()
    const input = [1, 2, 3, 4, 5]

    // pad on both sides to length 7
    const result = await zeropad.evaluate([
        dt.vector(input),
        dt.value(7),
        dt.value(0),
    ])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        expect(output[0]).toBe(0)
        expect(output[6]).toBe(0)
        for (let i = 0; i < input.length; ++i) {
            expect(output[i + 1]).toBe(input[i])
        }
    }
})

test("Zero pad adds zeros on the right", async () => {
    const zeropad = new ZeroPad()
    const input = [1, 2, 3, 4, 5]

    // pad on the right
    const result = await zeropad.evaluate([
        dt.vector(input),
        dt.value(7),
        dt.value(1),
    ])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        expect(output[5]).toBe(0)
        expect(output[6]).toBe(0)
        for (let i = 0; i < input.length; ++i) {
            expect(output[i]).toBe(input[i])
        }
    }
})

test("Zero pad to power of 2 adds zeros on the left", async () => {
    const zeropad = new ZeroPadPowerOf2()
    const input = [1, 2, 3, 4, 5]
    const expected_length = 8
    const padding_length = expected_length - input.length

    // pad on the left
    const result = await zeropad.evaluate([dt.vector(input), dt.value(-1)])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        if (!(output.length == expected_length)) {
            throw new Error("vector of length 5 was not padded to length 8.")
        }
        for (let i = 0; i < padding_length; ++i) {
            expect(output[i]).toBe(0)
        }

        for (let i = 0; i < input.length; ++i) {
            expect(output[i + padding_length]).toBe(input[i])
        }
    }
})

test("Zero pad to power of 2 adds zeros on both sides", async () => {
    const zeropad = new ZeroPadPowerOf2()
    const input = [1, 2, 3, 4, 5]
    const expected_length = 8

    // pad on both sides
    const result = await zeropad.evaluate([dt.vector(input), dt.value(0)])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        if (!(output.length == expected_length)) {
            throw new Error("vector of length 5 was not padded to length 8.")
        }
        expect(output[0]).toBe(0)
        expect(output[6]).toBe(0)
        expect(output[7]).toBe(0)
        for (let i = 0; i < input.length; ++i) {
            expect(output[i + 1]).toBe(input[i])
        }
    }
})

test("Zero pad to power of 2 adds zeros on the right", async () => {
    const zeropad = new ZeroPadPowerOf2()
    const input = [1, 2, 3, 4, 5]
    const expected_length = 8
    const padding_length = expected_length - input.length

    // pad on the right
    const result = await zeropad.evaluate([dt.vector(input), dt.value(1)])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        if (!(output.length == expected_length)) {
            throw new Error("vector of length 5 was not padded to length 8.")
        }
        for (let i = 0; i < padding_length; ++i) {
            expect(output[input.length + i]).toBe(0)
        }

        for (let i = 0; i < input.length; ++i) {
            expect(output[i]).toBe(input[i])
        }
    }
})

test("Waveform to Vector converts type and preserves data", async () => {
    const convert = new WaveformToVector()
    const input = [1, 2, 3, 4, 5]

    // pad on the right
    const result = await convert.evaluate([dt.waveform(input)])

    expect(result[0].kind).toBe("vector")

    if (result[0].kind === "vector") {
        const value = result[0].value
        if (!("components" in value)) {
            throw new Error("components not found in result.")
        }
        const output = value.components
        for (let i = 0; i < input.length; ++i) {
            expect(output[i]).toBe(input[i])
        }
    }
})

test("Waveform to Vector preserves length and outputs correct sample rate", async () => {
    const convert = new WaveformToVector()
    const sourceRate = 48000
    const inputLength = 480
    const input = Array.from({ length: inputLength }, (_, i) =>
        Math.sin((2 * Math.PI * i) / inputLength),
    )

    const result = await convert.evaluate([dt.waveform(input, sourceRate)])

    expect(result[0].kind).toBe("vector")
    expect(result[0].value.components.length).toBe(inputLength)
    expect(result[1].kind).toBe("value")
    expect(result[1].value).toBe(sourceRate)
})

test("Vector to Waveform converts type and preserves data", async () => {
    const convert = new VectorToWaveform()
    const input = [1, 2, 3, 4, 5]

    // pad on the right
    const result = await convert.evaluate([
        dt.vector(input),
        dt.value(DEFAULT_AUDIO_SAMPLE_RATE),
    ])

    expect(result[0].kind).toBe("waveform")
    console.log(result)

    if (!("samples" in result[0])) {
        throw new Error("components not found in result.")
    }

    const output = result[0].samples

    for (let i = 0; i < input.length; ++i) {
        expect(output[i]).toBe(input[i])
    }

    expect(result[0].sampleRate).toBe(DEFAULT_AUDIO_SAMPLE_RATE)
})

test("Waveform -> Vector -> Waveform preserves length independent of sample rate", async () => {
    const toVector = new WaveformToVector()
    const toWaveform = new VectorToWaveform()
    const sourceRate = 48000
    const inputLength = 480
    const input = Array.from({ length: inputLength }, (_, i) =>
        Math.sin((2 * Math.PI * i) / inputLength),
    )

    const [vectorOut] = await toVector.evaluate([
        dt.waveform(input, sourceRate),
    ])
    const [waveformOut] = await toWaveform.evaluate([
        vectorOut,
        dt.value(DEFAULT_AUDIO_SAMPLE_RATE),
    ])

    expect(waveformOut.kind).toBe("waveform")
    expect(waveformOut.samples.length).toBe(inputLength)
    expect(waveformOut.sampleRate).toBe(DEFAULT_AUDIO_SAMPLE_RATE)
})

test("Resampling standardizes playback sample rate", async () => {
    const resample = new Resample()
    const sourceRate = 48000
    const inputLength = 480
    const input = Array.from({ length: inputLength }, (_, i) =>
        Math.sin((2 * Math.PI * i) / inputLength),
    )

    const [waveformOut] = await resample.evaluate([
        dt.waveform(input, sourceRate),
    ])

    expect(waveformOut.kind).toBe("waveform")
    if (waveformOut.kind === "waveform") {
        expect(waveformOut.sampleRate).toBe(DEFAULT_AUDIO_SAMPLE_RATE)
        const expectedLength = Math.round(
            (inputLength * DEFAULT_AUDIO_SAMPLE_RATE) / sourceRate,
        )
        expect(waveformOut.samples.length).toBe(expectedLength)
    }
})
