import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ColorPort, TextPort, type Port } from "../cardBase/ports/port"

/**
 * Implements the Color Palette card using The Color API.
 *
 * @see https://www.thecolorapi.com/docs
 */
export class ColorPaletteGeneration extends Card {
    title = "Get Color Palettes"
    description =
        "use an API like COLOURLovers to get palettes using this color"

    inputs: Port[] = [
        new ColorPort("source color", false, dt.color(255, 0, 0, 1)),
    ]
    outputs: Port[] = [
        new ColorPort("color 1"),
        new ColorPort("color 2"),
        new ColorPort("color 3"),
        new ColorPort("color 4"),
        new TextPort("name"),
    ]

    private cachedPalette = [
        { r: 0, g: 0, b: 0 },
        { r: 0, g: 0, b: 0 },
        { r: 0, g: 0, b: 0 },
        { r: 0, g: 0, b: 0 },
    ]

    private cachedName: string = "Random color pallette go."
    private lastInputColorHex: string = ""
    private isFetching: boolean = false

    /** Asynchronous operation which does caching until results are ready (caller is responsible for polling). */
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const colorInput = inputs.find(
            (input): input is DataTypeOf<"color"> => input.kind === "color",
        )

        if (colorInput) {
            // Convert current RGB input to Hex to check for changes
            const currentHex = this.rgbToHex(
                colorInput.r,
                colorInput.g,
                colorInput.b,
            )

            if (currentHex !== this.lastInputColorHex && !this.isFetching) {
                this.lastInputColorHex = currentHex
                await this.fetchPalette(currentHex)
            }
        }

        return [
            dt.color(
                this.cachedPalette[0].r,
                this.cachedPalette[0].g,
                this.cachedPalette[0].b,
            ),
            dt.color(
                this.cachedPalette[1].r,
                this.cachedPalette[1].g,
                this.cachedPalette[1].b,
            ),
            dt.color(
                this.cachedPalette[2].r,
                this.cachedPalette[2].g,
                this.cachedPalette[2].b,
            ),
            dt.color(
                this.cachedPalette[3].r,
                this.cachedPalette[3].g,
                this.cachedPalette[3].b,
            ),
            dt.text(this.cachedName),
        ]
    }

    private async fetchPalette(hex: string) {
        this.isFetching = true
        const cleanHex = hex.replace("#", "")

        try {
            // see https://www.thecolorapi.com/docs#schemes-generate-scheme-get
            const response = await fetch(
                `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=monochrome&count=4`,
            )
            if (!response.ok) {
                throw new Error()
            }

            const data = await response.json()

            this.cachedPalette = data.colors.map(
                (c: { rgb: { r: number; g: number; b: number } }) => ({
                    r: c.rgb.r,
                    g: c.rgb.g,
                    b: c.rgb.b,
                }),
            )

            this.cachedName = data.seed.name.value + " " + data.mode
        } catch (error) {
            console.error("Error fetching color palette:", error)
        } finally {
            this.isFetching = false
        }
    }

    /** Converts RGB (assumed format from ports) to Hex for API comparison. */
    private rgbToHex(r: number, g: number, b: number): string {
        return (
            "#" +
            [r, g, b]
                .map((x) => {
                    const hex = Math.round(x).toString(16)
                    return hex.length === 1 ? "0" + hex : hex
                })
                .join("")
        )
    }

    init(): void {}
    cleanup(): void {}
}
