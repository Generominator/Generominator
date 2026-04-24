import { test, expect } from "vitest"
import { SplitImageIntoColorChannels } from "../../src/cards/splitImageIntoChannels"
import { DataTypeOf, dt } from "../../src/cardBase/dataTypes"

test("Splits a simple 1x1 red pixel correctly", async () => {
    const card = new SplitImageIntoColorChannels()

    // A single red pixel (255, 0, 0, 255) as an image
    const mockData = new Uint8ClampedArray([255, 0, 0, 255])
    const mockImage = {
        kind: "image",
        data: { data: mockData, width: 1, height: 1 },
    } as DataTypeOf<"image">

    const results = await card.evaluate([mockImage])

    const redChannel = (results[2] as DataTypeOf<"depthmap">).values
    const greenChannel = (results[3] as DataTypeOf<"depthmap">).values
    const hueChannel = (results[0] as DataTypeOf<"depthmap">).values

    expect(redChannel[0]).toBe(255)
    expect(greenChannel[0]).toBe(0)

    // Hue of pure red is 0
    expect(hueChannel[0]).toBe(0)
})

test("should correctly extract RGB channels from a single pixel", async () => {
    const card = new SplitImageIntoColorChannels()

    // Create a single Purple pixel: R=200, G=50, B=255, A=255
    const width = 1
    const height = 1
    const data = new Uint8ClampedArray([200, 50, 255, 255])

    const inputImage = dt.image({ data, width, height } as ImageData)
    const results = await card.evaluate([inputImage])

    // Split up outputs
    const brightness = results[1] as DataTypeOf<"depthmap">
    const red = results[2] as DataTypeOf<"depthmap">
    const green = results[3] as DataTypeOf<"depthmap">
    const blue = results[4] as DataTypeOf<"depthmap">

    // Check extraction works
    expect(red.values[0]).toBe(200)
    expect(green.values[0]).toBe(50)
    expect(blue.values[0]).toBe(255)

    // Brightness should be about 96.691 (0.2126 * 200 + 0.7152*50 + 0.0722*255 = 42.52 + 35.76 + 18.411)
    expect(brightness.values[0]).toBeCloseTo(96.691, 3)
})

test("Maintain correct dimensions and data length for images", async () => {
    const card = new SplitImageIntoColorChannels()
    const width = 10
    const height = 10

    // 100 pixels * 4 channels = 400 length
    const data = new Uint8ClampedArray(width * height * 4).fill(128)

    const inputImage = dt.image({ data, width, height } as ImageData)
    const results = await card.evaluate([inputImage])

    results.forEach((res) => {
        if (res.kind === "depthmap") {
            expect(res.width).toBe(10)
            expect(res.height).toBe(10)
            expect(res.values.length).toBe(100) // 1 value per pixel
        }
    })
})
