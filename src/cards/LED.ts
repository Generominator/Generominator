import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ValuePort, ColorPort, type Port } from "../cardBase/ports/port"

export class LED extends Card {
    title = "LED"
    description = "Light an LED"
    inputs: Port[] = [
        new ValuePort("brightness", false, dt.value(1)),
        new ColorPort("color", false, dt.color(255, 0, 0, 1)),
    ]
    outputs: Port[] = []

    //Create Variables
    private LEDelement: HTMLDivElement | null = null
    private cellElement: HTMLDivElement | null = null

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const valueInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )
        const brightness = Math.max(0, Math.min(1, valueInput?.value ?? 1))

        let color = { r: 255, g: 0, b: 0 }
        if (inputs.length > 1) {
            if (inputs[1].kind !== "color") {
                throw new Error(
                    `LED takes an optional color values, got: ${JSON.stringify(inputs)}`,
                )
            }
            color = inputs[1]
        }

        const { r, g, b } = color
        if (this.LEDelement == null) throw new Error(`LED Element not found`)
        this.LEDelement.style.background = `rgb(${r}, ${g}, ${b})`
        this.LEDelement.style.boxShadow = `0 0 ${8 * brightness}px ${4 * brightness}px rgba(${r}, ${g}, ${b}, ${brightness})`

        return []
    }

    init(): void {
        let container = document.getElementById("LEDs")

        if (!container) {
            container = document.createElement("div")
            container.id = "LEDs"
            container.style.display = "flex"
            container.style.flexWrap = "wrap"
            container.style.gap = "0"
            container.style.padding = "12px 0 0"
            container.style.maxWidth = "100%"
            document.getElementById("card-data")?.appendChild(container)
        }

        const cell = document.createElement("div")
        cell.style.width = "56px"
        cell.style.height = "56px"
        cell.style.display = "flex"
        cell.style.alignItems = "center"
        cell.style.justifyContent = "center"

        const led = document.createElement("div")
        led.style.width = "28px"
        led.style.height = "28px"
        led.style.borderRadius = "50%"
        led.style.background = "#000000"
        led.style.border = "0px"

        cell.appendChild(led)
        container.appendChild(cell)

        this.cellElement = cell
        this.LEDelement = led
    }

    cleanup(): void {
        this.cellElement?.remove()
        this.cellElement = null
        this.LEDelement = null
    }
}
