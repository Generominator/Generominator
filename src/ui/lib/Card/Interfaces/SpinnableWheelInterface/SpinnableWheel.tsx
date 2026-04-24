import React from "react"
import "./SpinnableWheel.css"
import type { SpinnableWheelCard } from "../../../../../cards/spinnableWheel"

function SpinnableWheelInterface({ card }: { card: SpinnableWheelCard }) {
    const [rotation, setRotation] = React.useState(0)
    const wheelRef = React.useRef<HTMLDivElement>(null)
    const lastAngle = React.useRef(0)
    const lastTime = React.useRef(0)
    const angularVelocity = React.useRef(0)

    React.useEffect(() => {
        let active = true
        let rafId: number | null = null
        const sync = () => {
            if (!active) return
            setRotation((prev) => (prev === card.angle ? prev : card.angle))
            rafId = requestAnimationFrame(sync)
        }
        rafId = requestAnimationFrame(sync)
        return () => {
            active = false
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [card])

    /**
     * Given the circular UI, to calculate the spinning left (counter-clockwise) or right (clockwise),
     * we would need to know the angle delta (angle diff. between center of the wheel and mouse position).
     *
     * @param {number} clientX - mouse position on x axis
     * @param {number} clientY - mouse position on y axis
     */
    function getMouseAngle(clientX: number, clientY: number) {
        if (!wheelRef.current) return 0
        const rect = wheelRef.current.getBoundingClientRect()
        // Find the center of the wheel
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        // Calculate angle in radians using atan2 given the circular wheel
        return Math.atan2(clientY - centerY, clientX - centerX)
    }

    /**
     * Handle when the wheel is spun (triggered by mouse down event).
     *
     * Calculates how the mouse has moved since the initial spin to then
     * calculate velocity and angles for the inner card logic to work (e.g. tell direction
     * of wheel spinning).
     */
    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation()

        lastAngle.current = getMouseAngle(e.clientX, e.clientY)
        lastTime.current = Date.now()

        const onMouseMove = (moveE: MouseEvent) => {
            const now = Date.now()
            const dt = now - lastTime.current
            if (dt <= 0) return

            const currentAngle = getMouseAngle(moveE.clientX, moveE.clientY)

            // Calculate the change in angle
            let deltaAngle = currentAngle - lastAngle.current

            // handle the wrapping (e.g., jumping from -pi to pi)
            // https://en.wikipedia.org/wiki/Angular_displacement
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

            // Convert radians to degrees for inner card logic
            const deltaDegrees = deltaAngle * (180 / Math.PI)

            angularVelocity.current = deltaDegrees / dt
            card.angle += deltaDegrees

            lastAngle.current = currentAngle
            lastTime.current = now
        }

        const onMouseUp = () => {
            // Apply the velocity as an impulse, multiplied to cool effect (fast spins)
            card.applyImpulse(angularVelocity.current * 100)

            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
    }

    return (
        <div className="wheel-ui-container">
            {/* Needle */}
            <div className="carnival-needle" />

            {/* The wheel! */}
            <div
                ref={wheelRef}
                className="carnival-wheel"
                onMouseDown={handleMouseDown}
                style={{
                    transform: `rotate(${rotation}deg)`,
                }}
            >
                {/* Drawing on the text segments */}
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="wheel-segment-text"
                        style={{
                            transform: `rotate(${i * 36 + 18}deg)`, // Center number text
                        }}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SpinnableWheelInterface
