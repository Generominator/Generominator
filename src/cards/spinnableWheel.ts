import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import {
    EventPort,
    StatePort,
    ValuePort,
    type Port,
} from "../cardBase/ports/port"
import { dt, type DataType } from "../cardBase/dataTypes"

/**
 * Implements the Spinnable Wheel Card, which emits an event upon a wheel press and change in direction.
 *
 * @remarks I based this off the mouse card on another branch. I thought also emitting a final value
 * would be funny.
 */
export class SpinnableWheelCard extends Card implements EventEmitting {
    title: string = "Spinnable wheel"
    description: string = "A wheel that can tell how fast it is being spun."
    inputs: Port[] = []
    outputs: Port[] = [
        new ValuePort("Speed"),
        new ValuePort("Result"),
        new StatePort("Is Spinning"),
        new EventPort("Changes Direction"),
    ]

    public angle: number = 0
    public velocity: number = 0

    private isSpinning: boolean = false
    private directionChanged: "left" | "right" | "still" = "still"
    private friction: number = 0.98 // More drag for longer spins
    private rafId: number | null = null // The spinnable wheel logic conflicts with the grabbing logic in the UI (see editor.tsx), so this helps manage that.
    private lastSign: number = 0 // Left = -1, right = 1, still = 0

    private callback: CardEventCallback | null = null
    private lastEmitted = {
        speed: 0,
        segment: 1,
        spinning: false,
        direction: "still" as "left" | "right" | "still",
    }

    private getSpeed(): number {
        return Number(Math.abs(this.velocity).toFixed(2))
    }

    private getSegment(): number {
        // Pointer is fixed at 12 o'clock, wheel rotates under it.
        // Invert wheel rotation to read the slice currently under the pointer.
        const normalizedAngle = ((-this.angle % 360) + 360) % 360
        return Math.floor((normalizedAngle / 360) * 10) + 1
    }

    private emitChangedOutputs() {
        const current = {
            speed: this.getSpeed(),
            segment: this.getSegment(),
            spinning: this.isSpinning,
            direction: this.directionChanged,
        }
        const changedOutputIndices: number[] = []

        if (current.speed !== this.lastEmitted.speed)
            changedOutputIndices.push(0)
        if (current.segment !== this.lastEmitted.segment)
            changedOutputIndices.push(1)
        if (current.spinning !== this.lastEmitted.spinning)
            changedOutputIndices.push(2)
        if (current.direction !== this.lastEmitted.direction)
            changedOutputIndices.push(3)

        if (changedOutputIndices.length > 0 && this.callback) {
            this.callback(changedOutputIndices)
        }
        this.lastEmitted = current
    }

    public applyImpulse(impulse: number) {
        const newSign = Math.sign(impulse)

        // Track any change in direction
        if (newSign !== this.lastSign && newSign !== 0) {
            this.directionChanged = newSign === 1 ? "right" : "left"
        }

        this.velocity = impulse
        this.lastSign = newSign

        // Only let one spin happen at a time
        if (!this.isSpinning) {
            this.isSpinning = true
            this.startPhysicsLoop()
        }

        this.emitChangedOutputs()
    }

    private startPhysicsLoop() {
        const update = () => {
            // Floating point comparison protection
            if (Math.abs(this.velocity) < 0.01) {
                this.velocity = 0
                this.isSpinning = false
                this.lastSign = 0
                this.directionChanged = "still"
                this.emitChangedOutputs()
                this.rafId = null
                return
            }

            // We do a little simplified euler integration for angular velocity
            this.angle += this.velocity
            this.velocity *= this.friction

            this.emitChangedOutputs()
            this.rafId = requestAnimationFrame(update)
        }
        this.rafId = requestAnimationFrame(update)
    }

    async evaluate(): Promise<DataType[]> {
        const eventValue = this.directionChanged

        return [
            dt.value(this.getSpeed()),
            dt.value(this.getSegment()),
            dt.state(this.isSpinning),
            dt.event(eventValue),
        ]
    }

    init(): void {}
    cleanup(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
        }
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.callback = callback
    }
}
