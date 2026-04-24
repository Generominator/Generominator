import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card.ts"
import { type Port, DepthMapPort } from "../cardBase/ports/port.ts"
import { type DataType, type DataTypeOf, dt } from "../cardBase/dataTypes.ts"

export class CombineDepthMapsCard extends Card implements EventEmitting {
    title = "Combine Depth Maps"
    description = "Merges two depth maps pixel-wise."
    inputs: Port[] = [
        new DepthMapPort("depth map A", false),
        new DepthMapPort("depth map B", false),
    ]
    outputs: Port[] = [new DepthMapPort("combined depth map")]

    options: Record<string, (a: number, b: number) => number> = {
        max: (a, b) => Math.max(a, b),
        min: (a, b) => Math.min(a, b),
        add: (a, b) => Math.max(0, Math.min(255, a + b)),
        subtract: (a, b) => Math.max(0, Math.min(255, Math.abs(a - b))),
        multiply: (a, b) => Math.max(0, Math.min(255, (a * b) / 255)),
        average: (a, b) => (a + b) / 2,
    }
    selected = "max"
    private eventCallback: CardEventCallback | null = null

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    setSelected(selected: string): void {
        if (!(selected in this.options) || this.selected === selected) {
            return
        }
        this.selected = selected
        this.eventCallback?.([0])
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const depthmaps = inputs.filter(
            (i): i is DataTypeOf<"depthmap"> => i.kind === "depthmap",
        )
        if (depthmaps.length < 2) {
            throw new Error("Combine Depth Maps requires two depth map inputs")
        }
        const [a, b] = depthmaps
        const op = this.options[this.selected]
        const len = Math.min(a.values.length, b.values.length)
        const result = new Array<number>(len)
        for (let i = 0; i < len; i++) {
            result[i] = op(a.values[i], b.values[i])
        }
        return [dt.depthmap(result, a.width, a.height)]
    }

    init(): void {}
    cleanup(): void {}
}
