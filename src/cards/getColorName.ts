import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ColorPort, TextPort, type Port } from "../cardBase/ports/port"

let xkcdRaw = (await import("/src/assets/text/xkcd.txt?raw")).default
xkcdRaw = xkcdRaw.substring(xkcdRaw.indexOf("\n") + 1)
interface ColorDetail {
    colorName: string
    namedColor: string
}

// adapted from:
// https://stackoverflow.com/questions/36120265/how-to-convert-text-file-to-json-in-javascript
const cells = xkcdRaw
    .split("\n")
    .map(function (el) {
        if (el.slice(-1) == `\t`) {
            el = el.slice(0, -1)
        }
        return el.split("\t")
    })
    .slice(0, -1)
const colorDirectory: ColorDetail[] = cells.map(function (el) {
    const obj: ColorDetail = {
        colorName: el[0],
        namedColor: el[1],
    }
    return obj
})
const namedColors = colorDirectory.map((a) => a.namedColor)

/**
 * GetColorName() creates the "get color name" card, which takes in a color as color datatype
 * and returns the closest color name and named color using the XKCD color directory.
 *
 * @remarks Right now, because main is not up to date (presumably) concerning returning promises from
 * evaluate, fetching XKCD colors occurs outside of evaluate.
 * @remarks This uses XKCD, *not* the webcolor directory. It fetches the color directory from a static, local file.
 *
 * @todo Move XKCD fetching into evaluate.
 */
export class GetColorName extends Card {
    title: string = "get color name"
    description?: "Use the webcolor directory or XKCD Color Survey to get a name for this color"
    inputs: Port[]
    outputs: Port[]
    constructor() {
        super()
        this.inputs = [
            new ColorPort("input color", false, dt.color(255, 0, 0, 1)),
        ]
        this.outputs = [
            new TextPort("closest color name"),
            new ColorPort("closest named color"),
        ]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        // grab the appropriate input
        const inputAsRgb = inputs.find(
            (input): input is DataTypeOf<"color"> => input.kind === "color",
        )

        // closeness is determined by evaluating the hex codes, so RGB needs to be
        // translated to Hex prior to evaluation.
        // because of this, a is unusable.
        const inputAsHex = rgbToHex(inputAsRgb?.r, inputAsRgb?.g, inputAsRgb?.b)

        if (inputAsHex == null) {
            throw new Error("hex from RGB returned null")
        }

        // determine the closest hex code from the array of colors available.
        // then take the name of that closest color
        const outputHex = closest(namedColors, inputAsHex)
        const obj = colorDirectory.find((o) => o.namedColor === outputHex)

        // translate the output Hex code back to RGB in order to return in the expected format.
        const outputRgb = hexToRgb(outputHex as string)

        if (outputRgb == null) {
            throw new Error("RGB from hex returned null")
        }

        if (obj == null) {
            throw new Error("Color not found in directory")
        }

        return [
            { kind: "text", value: obj.colorName },
            {
                kind: "color",
                r: outputRgb.r,
                g: outputRgb.g,
                b: outputRgb.b,
                a: inputAsRgb?.a as number,
            },
        ]
    }
    init(): void {}
    cleanup(): void {}
}

//#region-> RGB to Hex to RGB helper functions

// functions borrowed from:
// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function rgbToHex(
    r: number | undefined,
    g: number | undefined,
    b: number | undefined,
): string | null {
    if (r == undefined || g == undefined || b == undefined) return null
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

function hexToRgb(hex: string) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, function (r, g, b) {
        return r + r + g + g + b + b
    })

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null
}

//#endregion

//#region-> closest hex available helper functions

// functions adapted from:
// https://stackoverflow.com/questions/17175664/get-the-closest-color-name-depending-on-an-hex-color
function closest(arr: Array<string>, str: string): string | undefined {
    let min = 0xffffff
    let best, current, i

    while (str.charAt(0) === "#") {
        str = str.substring(1)
    }

    for (i = 0; i < arr.length; i++) {
        const comp = arr[i].substring(1)
        current = dist(comp, str)
        if (current < min) {
            min = current
            best = arr[i]
        }
    }

    return best
}

function dist(comp: string, str: string): number {
    if (!comp.length || !str.length) return 0
    return (
        dist(comp.slice(2), str.slice(2)) +
        Math.abs(parseInt(comp.slice(0, 2), 16) - parseInt(str.slice(0, 2), 16))
    )
}

//#endregion
