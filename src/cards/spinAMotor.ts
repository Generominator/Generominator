import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ValuePort, type Port } from "../cardBase/ports/port"

export class SpinAMotor extends Card {
    title = "Spin a Motor"
    description =
        "Output card that visualizes a motor rotating at rotations per second"
    inputs: Port[] = [new ValuePort("rotations per second", false, dt.value(0))]
    outputs: Port[] = []

    //declare max rotations per second as most people will be on 60 fps, 60 fps felt like the normal limit to set.
    rotationsPerSecond = 0
    private readonly maxRotationsPerSecond = 60
    private readonly nominalFrameRate = 60

    //Create Variables
    private containerDiv: HTMLDivElement | null = null
    private rotorElement: HTMLDivElement | null = null
    private animationHandle: number | null = null
    private lastTimestamp: number | null = null
    private rotationDegrees = 0

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const valueInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )

        const rawValue = valueInput?.value ?? 0
        this.rotationsPerSecond = Math.max(0, rawValue)

        return []
    }

    init(): void {
        if (this.containerDiv) {
            if (!this.containerDiv.isConnected) {
                document
                    .getElementById("card-data")
                    ?.appendChild(this.containerDiv)
            }
            this.startAnimation()
            return
        }

        //create the container for the fan parts
        const container = document.createElement("div")
        container.style.display = "grid"
        container.style.justifyItems = "center"
        container.style.gap = "0"
        container.style.padding = "12px 0 0"
        container.style.maxWidth = "100%"
        container.style.overflow = "hidden"

        //create fan body blades will spin infront of
        const body = document.createElement("div")
        body.style.width = "180px"
        body.style.height = "180px"
        body.style.borderRadius = "50%"
        body.style.background =
            "radial-gradient(circle at 50% 45%, #1f2937, #0b111b)"
        body.style.border = "2px solid #1f2937"
        body.style.position = "relative"
        body.style.boxShadow =
            "inset 0 0 12px rgba(0, 0, 0, 0.7), 0 8px 20px rgba(0, 0, 0, 0.35)"

        const rotor = document.createElement("div")
        rotor.style.position = "absolute"
        rotor.style.inset = "0"
        rotor.style.transformOrigin = "50% 50%"

        //create blades for the fan, 4 different ones all the same at different rotations
        const bladeCount = 4
        for (let i = 0; i < bladeCount; i++) {
            const blade = document.createElement("div")
            blade.style.position = "absolute"
            blade.style.left = "50%"
            blade.style.top = "50%"
            blade.style.width = "52%"
            blade.style.height = "16%"
            blade.style.background = "#cbd5f5"
            blade.style.transformOrigin = "0% 50%"
            blade.style.borderRadius = "999px"
            blade.style.boxShadow = "0 0 6px rgba(148, 163, 184, 0.25)"
            blade.style.transform = `translate(0, -50%) rotate(${(360 / bladeCount) * i}deg)`
            rotor.appendChild(blade)
        }

        //create central hub for the fan
        const hub = document.createElement("div")
        hub.style.position = "absolute"
        hub.style.left = "50%"
        hub.style.top = "50%"
        hub.style.width = "28px"
        hub.style.height = "28px"
        hub.style.transform = "translate(-50%, -50%)"
        hub.style.background = "radial-gradient(circle, #e2e8f0, #64748b)"
        hub.style.borderRadius = "50%"
        hub.style.boxShadow = "0 0 10px rgba(226, 232, 240, 0.35)"

        //append hub to rotor, rotor to body, and body to container
        rotor.appendChild(hub)
        body.appendChild(rotor)
        container.appendChild(body)

        //create a stem for the fan in an attempt to make it look realistic and give the viewer and idea of what its
        //@todo make the stem more realistic and artistic, I just suck at art and drawing with code
        const stem = document.createElement("div")
        stem.style.width = "18px"
        stem.style.height = "22px"
        stem.style.marginTop = "-2px"
        stem.style.background = "linear-gradient(180deg, #374151, #111827)"
        stem.style.borderRadius = "0"
        stem.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.35)"

        //Create Base of the fan
        const base = document.createElement("div")
        base.style.width = "140px"
        base.style.height = "28px"
        base.style.marginTop = "-4px"
        base.style.background = "linear-gradient(90deg, #111827, #1f2937)"
        base.style.borderRadius = "0"
        base.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.35)"

        //append new parts
        container.appendChild(stem)
        container.appendChild(base)

        this.containerDiv = container
        this.rotorElement = rotor

        document.getElementById("card-data")?.appendChild(container)

        this.startAnimation()
    }

    cleanup(): void {
        // Keep preview and animation alive between runs.
    }

    //Start animation loop, using effective rps and rotating the blades created.
    private startAnimation(): void {
        if (this.animationHandle !== null) return

        const step = (timestamp: number) => {
            // Initialize timing on first frame.
            if (this.lastTimestamp === null) {
                this.lastTimestamp = timestamp
            }
            // Convert frame delta to seconds for consistent rotation speed.
            const deltaSeconds = (timestamp - this.lastTimestamp) / 1000
            this.lastTimestamp = timestamp

            // Apply visual slow rotation effect above the visual frame limit.
            const effectiveRps = this.getEffectiveRps(this.rotationsPerSecond)
            const deltaDegrees = effectiveRps * 360 * deltaSeconds
            this.rotationDegrees = (this.rotationDegrees + deltaDegrees) % 360

            if (this.rotorElement) {
                // Update rotor transform for the current frame.
                this.rotorElement.style.transform = `rotate(${this.rotationDegrees}deg)`
            }

            this.animationHandle = requestAnimationFrame(step)
        }

        this.animationHandle = requestAnimationFrame(step)
    }

    //Caculate effective rpm for the visual effect of slow moving fan during high rpm
    private getEffectiveRps(rawRps: number): number {
        if (rawRps <= this.maxRotationsPerSecond) {
            return rawRps
        }

        // Simulate the visual effect caused by high rpm.
        const alias =
            rawRps -
            Math.round(rawRps / this.nominalFrameRate) * this.nominalFrameRate
        return alias
    }
}
