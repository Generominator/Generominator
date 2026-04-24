import { expect, test } from "vitest"
import type { DataTypeOf, DataType } from "../../src/cardBase/dataTypes"
import { dt } from "../../src/cardBase/dataTypes"
import { GenerateColor } from "../../src/cards/generateColor"

// Type guard for color DataType
function isColor(dt: DataType): dt is DataTypeOf<"color"> {
    return dt.kind === "color"
}

//basic HSBA to RGB conversions

test("Converts valid HSBA to RGB correctly", async () => {
    const card = new GenerateColor()

    const outputs = await card.evaluate([dt.vector([210, 100, 50, 0.75])])
    expect(outputs.length).toBe(1)

    const color = outputs[0]
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(0)
    expect(color.g).toBe(64)
    expect(color.b).toBe(128)
    expect(color.a).toBe(0.75)
})

//optional alpha tests

test("Defaults alpha to 1 when missing", async () => {
    const card = new GenerateColor()

    const [color] = await card.evaluate([dt.vector([210, 100, 50])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.a).toBe(1)
})

//hue sector boundary tests

test("Hue 0° produces pure red", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([0, 100, 100, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
})

test("Hue 120° produces pure green", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([120, 100, 100, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(0)
    expect(color.g).toBe(255)
    expect(color.b).toBe(0)
})

test("Hue 240° produces pure blue", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([240, 100, 100, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(0)
    expect(color.g).toBe(0)
    expect(color.b).toBe(255)
})

//desaturation & brightness

test("Zero saturation produces grayscale", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([180, 0, 50, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(128)
    expect(color.g).toBe(128)
    expect(color.b).toBe(128)
})

test("Zero brightness produces black", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([300, 100, 0, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(0)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
})

//precision / rounding checks

test("Mid-range values round correctly", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([30, 50, 50, 1])])
    if (!isColor(color)) throw new Error("Expected color output")

    expect(color.r).toBe(128)
    expect(color.g).toBe(96)
    expect(color.b).toBe(64)
})

//valid edge outliers

test("Accepts upper-bound edge values", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([359, 100, 100, 1])])
    if (!isColor(color)) throw new Error("Expected color output")
    expect(color.kind).toBe("color")
})

test("Accepts lower-bound edge values", async () => {
    const card = new GenerateColor()
    const [color] = await card.evaluate([dt.vector([0, 0, 0, 0])])
    if (!isColor(color)) throw new Error("Expected color output")
    expect(color.r).toBe(0)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(0)
})

//error cases

test("Throws error when HSBA input is missing", async () => {
    const card = new GenerateColor()
    await expect(card.evaluate([])).rejects.toThrow("HSBA input is missing")
})

test("Throws error when HSBA vector does not have 3 or 4 components", async () => {
    const card = new GenerateColor()
    await expect(card.evaluate([dt.vector([120, 50])])).rejects.toThrow(
        "HSBA vector must have 3 or 4 components",
    )
    await expect(
        card.evaluate([dt.vector([120, 50, 50, 0.5, 0.1])]),
    ).rejects.toThrow("HSBA vector must have 3 or 4 components")
})

test("Throws error when hue is out of range", async () => {
    const card = new GenerateColor()
    await expect(card.evaluate([dt.vector([360, 50, 50])])).rejects.toThrow(
        "Hue out of range",
    )
})

test("Throws error when saturation is out of range", async () => {
    const card = new GenerateColor()
    await expect(card.evaluate([dt.vector([120, -1, 50])])).rejects.toThrow(
        "Saturation out of range",
    )
})

test("Throws error when brightness is out of range", async () => {
    const card = new GenerateColor()
    await expect(card.evaluate([dt.vector([120, 50, 101])])).rejects.toThrow(
        "Brightness out of range",
    )
})

test("Throws error when alpha is out of range", async () => {
    const card = new GenerateColor()
    await expect(
        card.evaluate([dt.vector([120, 50, 50, 1.01])]),
    ).rejects.toThrow("Alpha out of range")
})
