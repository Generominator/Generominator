import { expect, test } from "vitest"
import type { DataTypeOf } from "../../src/cardBase/dataTypes"
import { dt } from "../../src/cardBase/dataTypes"
import { ColorPaletteGeneration } from "../../src/cards/colorPalette"

test("Gets data from the color API", async () => {
    const card = new ColorPaletteGeneration()

    const outputs = await card.evaluate([dt.color(1, 20, 200, 4)])

    expect(outputs).toBeDefined()

    // There should be exactly five outputs for this card
    expect(outputs.length).toBe(5)

    const color1 = outputs[0] as DataTypeOf<"color">
    const color2 = outputs[1] as DataTypeOf<"color">
    const color3 = outputs[2] as DataTypeOf<"color">
    const color4 = outputs[3] as DataTypeOf<"color">
    const name = outputs[4] as DataTypeOf<"text">

    // Ensure the port types are correct
    expect(color1.kind).toBe("color")
    expect(color2.kind).toBe("color")
    expect(color3.kind).toBe("color")
    expect(color4.kind).toBe("color")
    expect(name.kind).toBe("text")

    // Validate returned color values match expected API response
    expect(color1.r).toBe(2)
    expect(color1.g).toBe(9)
    expect(color1.b).toBe(71)
    expect(color1.a).toBe(1)

    expect(color2.r).toBe(3)
    expect(color2.g).toBe(16)
    expect(color2.b).toBe(134)
    expect(color2.a).toBe(1)

    expect(color3.r).toBe(3)
    expect(color3.g).toBe(22)
    expect(color3.b).toBe(198)
    expect(color3.a).toBe(1)

    expect(color4.r).toBe(12)
    expect(color4.g).toBe(35)
    expect(color4.b).toBe(252)
    expect(color4.a).toBe(1)

    expect(name.value).toBe("Dark Blue monochrome")
})
