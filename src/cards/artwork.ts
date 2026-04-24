import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ImagePort, type Port } from "../cardBase/ports/port"

export class ArtworkCard extends Card implements EventEmitting {
    title = "Image"
    description = "Outputs a selected famous public-domain artwork as an image."

    inputs: Port[] = []
    outputs: Port[] = [new ImagePort("image")]
    private eventCallback: CardEventCallback | null = null

    options: Record<string, string> = {
        "Mona Lisa": "/images/artwork/mona-lisa.jpg",
        "The Starry Night": "/images/artwork/starry-night.jpg",
        "The Treachery of Images": "/images/artwork/treachery-of-images.jpg",
        "Girl with a Pearl Earring":
            "/images/artwork/girl-with-pearl-earring.jpg",
        "The Birth of Venus": "/images/artwork/birth-of-venus.jpg",
        "The Great Wave": "/images/artwork/great-wave.jpg",
        "A Sunday on La Grande Jatte": "/images/artwork/la-grande-jatte.jpg",
        "The Scream": "/images/artwork/the-scream.jpg",
        "Las Meninas": "/images/artwork/las-meninas.jpg",
        "Water Lilies": "/images/artwork/water-lilies.jpg",
        "The Creation of Adam": "/images/artwork/creation-of-adam.jpg",
        "The Night Watch": "/images/artwork/the-night-watch.jpg",
        "American Gothic": "/images/artwork/american-gothic.jpg",
        "The Kiss": "/images/artwork/the-kiss.jpg",
    }
    selected = "Mona Lisa"

    private _cachedUrl: string | null = null
    private _cachedData: ImageData | null = null

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

    async evaluate(): Promise<DataType[]> {
        const url = this.options[this.selected]
        if (url !== this._cachedUrl || !this._cachedData) {
            const img = document.createElement("img")
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = reject
                img.src = url
            })
            const canvas = document.createElement("canvas")
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext("2d")!
            ctx.drawImage(img, 0, 0)
            this._cachedData = ctx.getImageData(
                0,
                0,
                img.naturalWidth,
                img.naturalHeight,
            )
            this._cachedUrl = url
        }
        return [dt.image(this._cachedData)]
    }

    init(): void {}
    cleanup(): void {
        this._cachedUrl = null
        this._cachedData = null
    }
}
