import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import {
    EventPort,
    type Port,
    StatePort,
    VectorPort,
} from "../cardBase/ports/port"
import { dt, type DataType } from "../cardBase/dataTypes"

export class MouseCard extends Card implements EventEmitting {
    description: string = "Outputs mouse position and button states."
    inputs: Port[] = []
    outputs: Port[] = [
        new VectorPort("Pointer Position"),
        new StatePort("Left Mouse Button"),
        new StatePort("Right Mouse Button"),
        new EventPort("Mouse being Held"),
    ]
    title: string = "Mouse"

    private pointer: [number, number] = [0, 0]
    private leftDown = false
    private rightDown = false
    private held = false
    callback: CardEventCallback | null = null
    private readonly handleContextMenu = (e: Event) => e.preventDefault()

    // The following three handlers track the mouse and update the card's state accordingly.
    // They also trigger the event callback when relevant changes occur.
    private readonly handleMove = (e: MouseEvent) => {
        const newPointer: [number, number] = [e.clientX, e.clientY]
        if (
            this.pointer[0] !== newPointer[0] ||
            this.pointer[1] !== newPointer[1]
        ) {
            this.pointer = newPointer
            if (this.callback) this.callback([0])
        }
    }
    private readonly handleDown = (e: MouseEvent) => {
        const changedOutputIndices: number[] = []
        if (e.button === 0 && !this.leftDown) {
            this.leftDown = true
            changedOutputIndices.push(1)
        }
        if (e.button === 2 && !this.rightDown) {
            this.rightDown = true
            changedOutputIndices.push(2)
        }
        const wasHeld = this.held
        this.held = this.leftDown || this.rightDown
        if (wasHeld !== this.held) {
            changedOutputIndices.push(3)
        }
        if (changedOutputIndices.length > 0) {
            if (this.callback) this.callback(changedOutputIndices)
        }
    }
    private readonly handleUp = (e: MouseEvent) => {
        const changedOutputIndices: number[] = []
        if (e.button === 0 && this.leftDown) {
            this.leftDown = false
            changedOutputIndices.push(1)
        }
        if (e.button === 2 && this.rightDown) {
            this.rightDown = false
            changedOutputIndices.push(2)
        }
        const wasHeld = this.held
        this.held = this.leftDown || this.rightDown
        if (wasHeld !== this.held) {
            changedOutputIndices.push(3)
        }
        if (changedOutputIndices.length > 0) {
            if (this.callback) this.callback(changedOutputIndices)
        }
    }

    cleanup(): void {
        if (typeof globalThis.removeEventListener !== "function") return
        globalThis.removeEventListener("mousemove", this.handleMove)
        globalThis.removeEventListener("mousedown", this.handleDown)
        globalThis.removeEventListener("mouseup", this.handleUp)
        globalThis.removeEventListener("contextmenu", this.handleContextMenu)
    }

    async evaluate(): Promise<DataType[]> {
        return [
            dt.vector([this.pointer[0], this.pointer[1]]),
            dt.state(this.leftDown),
            dt.state(this.rightDown),
            dt.event(this.held ? "held" : "released"),
        ]
    }

    init(): void {
        if (typeof globalThis.addEventListener !== "function") return
        globalThis.addEventListener("mousemove", this.handleMove)
        globalThis.addEventListener("mousedown", this.handleDown)
        globalThis.addEventListener("mouseup", this.handleUp)
        globalThis.addEventListener("contextmenu", this.handleContextMenu)
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.callback = callback
    }
}
