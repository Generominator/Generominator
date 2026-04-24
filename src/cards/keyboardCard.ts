import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { EventPort, TextPort, type Port } from "../cardBase/ports/port"
import { dt, type DataType } from "../cardBase/dataTypes"

/**
 * Implements the Keyboard Input Card, which emits an event upon
 * a new alphanumbeic key press.
 *
 * @remarks I based this off the mouse card on another branch, so may need to reimplement
 * if changes are request there.
 */
export class KeyboardCard extends Card implements EventEmitting {
    title: string = "Keyboard"
    description: string = "Make text or key-event."
    inputs: Port[] = []
    outputs: Port[] = [new TextPort("char"), new EventPort("keyboard pressed")]

    // Stores the current character to be outputted for evaluate()
    private lastKey: string = ""
    callback: CardEventCallback | null = null

    // Event handler
    private readonly handleKeyDown = (e: KeyboardEvent) => {
        // Ignore hold-down repeats
        if (e.repeat) return

        this.lastKey = e.key

        const key = e.key.toLowerCase()

        // Emitting chars like "Shift" doesn't make sense to me.
        const isAlphanumeric = /^[a-z0-9]$/.test(key)

        if (isAlphanumeric) {
            this.lastKey = key

            // Re-trigger graph evaluation
            if (this.callback) {
                this.callback()
            }
        }
    }

    init(): void {
        if (typeof globalThis.addEventListener !== "function") return
        globalThis.addEventListener("keydown", this.handleKeyDown)
    }

    cleanup(): void {
        if (typeof globalThis.removeEventListener !== "function") return
        globalThis.removeEventListener("keydown", this.handleKeyDown)
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.text(this.lastKey), dt.event("keydown")]
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.callback = callback
    }
}
