import { Card } from "../cardBase/card"
import type { EventEmitting, CardEventCallback } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ColorPort, type Port } from "../cardBase/ports/port"

export class ConstColorCard extends Card implements EventEmitting {
    title = "Const Color"
    description = "Outputs a fixed color from a selection"

    inputs: Port[] = []
    outputs: Port[] = [new ColorPort("color")]
    private eventCallback: CardEventCallback | null = null

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    setSelected(selected: string): void {
        if (this.selected !== selected) {
            this.selected = selected
            this.eventCallback?.()
        }
    }

    // the first few colors from https://xkcd.com/color/rgb.txt (+red, green, blue)
    options: Record<string, DataTypeOf<"color">> = {
        red: dt.color(255, 0, 0),
        green: dt.color(0, 255, 0),
        blue: dt.color(0, 0, 255),
        "cloudy blue": dt.color(172, 194, 217),
        "dark pastel green": dt.color(86, 174, 87),
        dust: dt.color(178, 153, 110),
        "electric lime": dt.color(168, 255, 4),
        "fresh green": dt.color(105, 216, 79),
        "light eggplant": dt.color(137, 69, 133),
        "nasty green": dt.color(112, 178, 63),
        "really light blue": dt.color(212, 255, 255),
        tea: dt.color(101, 171, 124),
        "warm purple": dt.color(149, 46, 143),
        "yellowish tan": dt.color(252, 252, 129),
        cement: dt.color(165, 163, 145),
    }
    selected: string = "red"

    async evaluate(): Promise<DataType[]> {
        return [this.options[this.selected]]
    }

    init(): void {}
    cleanup(): void {}
}
