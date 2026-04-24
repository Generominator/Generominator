import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ColorPort, VectorPort, type Port } from "../cardBase/ports/port"

/**
 * Converts HSBA (Hue, Saturation, Brightness, Alpha) to RGB color.
 *
 * Expects a vector with components:
 * [hue (0–359), saturation (0–100), brightness (0–100), alpha (0–1)]
 *
 * This card is STRICT:
 * - Throws errors on invalid or out-of-range inputs
 * - Does not clamp or fix values
 */
export class GenerateColor extends Card {
    title = "HSBA to RGB"
    description = "Convert HSBA color values to RGB"

    inputs: Port[] = [new VectorPort("hsba", false, dt.vector([0, 0, 0, 1]))]
    outputs: Port[] = [new ColorPort("color")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const hsbaInput = inputs.find(
            (input): input is DataTypeOf<"vector"> => input.kind === "vector",
        )

        if (!hsbaInput) {
            throw new Error("HSBA input is missing")
        }

        const hsbLength = hsbaInput.value.dimension

        if (hsbLength < 3 || hsbLength > 4) {
            throw new Error(
                `HSBA vector must have 3 or 4 components (h, s, b, a), got ${hsbLength}`,
            )
        }

        const [h, s, b, a = 1] = hsbaInput.value.components

        //input checks

        if (h < 0 || h >= 360) {
            throw new Error(`Hue out of range: ${h} (expected 0–359)`)
        }

        if (s < 0 || s > 100) {
            throw new Error(`Saturation out of range: ${s} (expected 0–100)`)
        }

        if (b < 0 || b > 100) {
            throw new Error(`Brightness out of range: ${b} (expected 0–100)`)
        }

        if (a < 0 || a > 1) {
            throw new Error(`Alpha out of range: ${a} (expected 0–1)`)
        }

        const color = this.hsbaToRgb(dt.vector([h, s, b, a]))
        return [color]
    }

    private hsbaToRgb(hsba: DataTypeOf<"vector">): DataTypeOf<"color"> {
        const [h, s, b, a] = hsba.value.components

        //conversion expects s and b as fraction between 0-1

        const sat = s / 100
        const bri = b / 100

        //conversion algorithm: https:stackoverflow.com/questions/17242144/how-to-convert-hsb-hsv-color-to-rgb-accurately#:~:text=Ask%20Question,comes%20from%20the%20Math.round

        const c = bri * sat
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
        const m = bri - c

        let r = 0
        let g = 0
        let bVal = 0

        if (h < 60) {
            ;[r, g, bVal] = [c, x, 0]
        } else if (h < 120) {
            ;[r, g, bVal] = [x, c, 0]
        } else if (h < 180) {
            ;[r, g, bVal] = [0, c, x]
        } else if (h < 240) {
            ;[r, g, bVal] = [0, x, c]
        } else if (h < 300) {
            ;[r, g, bVal] = [x, 0, c]
        } else {
            ;[r, g, bVal] = [c, 0, x]
        }

        //return rgb color

        return dt.color(
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((bVal + m) * 255),
            a,
        )
    }

    init(): void {}
    cleanup(): void {}
}
