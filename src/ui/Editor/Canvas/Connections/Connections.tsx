import React from "react"
import "./Connections.css"
import type { PortSelectionParams } from "../Canvas"
import type { ExecutionGraph } from "../../../../execEngine"

function _InternalConnections({
    connectionPositions,
}: {
    connectionPositions: Array<{ from: [number, number]; to: [number, number] }>
}) {
    return (
        <>
            {connectionPositions.map(
                ({ from: [startX, startY], to: [endX, endY] }, index) => (
                    <path
                        key={index}
                        d={`M${startX} ${startY} C${startX} ${startY + 50} ${endX} ${endY - 50} ${endX} ${endY}`}
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                    />
                ),
            )}
        </>
    )
}

const InternalConnections = React.memo(_InternalConnections)

function Connections({
    zoom,
    offset,
    updateNo,
    execEngine,
    selectedPort,
    selectedStart,
    clientToCanvasCoords,
}: {
    zoom: number
    offset: [number, number]
    updateNo: number
    execEngine: ExecutionGraph
    selectedPort: PortSelectionParams | null
    selectedStart: [number, number] | null
    clientToCanvasCoords: (clientX: number, clientY: number) => [number, number]
}) {
    const [connectionPositions, setConnectionPositions] = React.useState<
        Array<{ from: [number, number]; to: [number, number] }>
    >([])

    const setupConnectionPositions = React.useCallback(() => {
        setConnectionPositions(
            execEngine.edges.map((edge) => {
                const fromPos = getPositionFromPort(
                    edge.from,
                    "output",
                    edge.outIdx,
                )
                const toPos = getPositionFromPort(edge.to, "input", edge.inIdx)
                return { from: fromPos, to: toPos }
            }),
        )
    }, [execEngine, zoom, offset])

    const nodes = execEngine.nodes.size
    const edges = execEngine.edges.length

    // Recalculate connection positions whenever zoom, offset, or graph updates
    React.useEffect(setupConnectionPositions, [nodes, edges, updateNo])

    function getPositionFromPort(
        cardId: string,
        type: "input" | "output",
        index: number,
    ): [number, number] {
        const portElem = document.querySelector(
            `#${cardId} .row-${type} .port[data-port-index='${index}']`,
        )
        if (!portElem) {
            console.log(
                `#${cardId} .row-${type} .port[data-port-index='${index}']`,
            )
            return [0, 0]
        }
        const bounds = portElem.getBoundingClientRect()
        const relativeCoords = clientToCanvasCoords(
            bounds.left + bounds.width / 2,
            bounds.top + (type === "input" ? 0 : bounds.height),
        )
        return [
            relativeCoords[0] / zoom - offset[0],
            relativeCoords[1] / zoom - offset[1],
        ]
    }

    function getSelectedMouse(
        selectedPort: PortSelectionParams | null,
    ): [number, number] | null {
        if (!selectedPort) return null
        const relativeMouse = clientToCanvasCoords(
            selectedPort.mouse[0],
            selectedPort.mouse[1],
        )
        return [
            relativeMouse[0] / zoom - offset[0],
            relativeMouse[1] / zoom - offset[1],
        ]
    }
    const selectedMouse = getSelectedMouse(selectedPort)

    let selectedPath = null
    if (selectedPort && selectedStart) {
        if (selectedPort.type === "output") {
            // output to input
            selectedPath = `M${selectedStart[0]} ${
                selectedStart[1]
            } C${selectedStart[0]} ${selectedStart[1] + 50} ${selectedMouse?.[0] ?? 0} ${(selectedMouse?.[1] ?? 0) - 50} ${selectedMouse?.[0] ?? 0} ${selectedMouse?.[1] ?? 0}`
        } else {
            // input to output
            selectedPath = `M${selectedMouse?.[0] ?? 0} ${
                selectedMouse?.[1] ?? 0
            } C${selectedMouse?.[0]} ${(selectedMouse?.[1] ?? 0) + 50} ${selectedStart[0]} ${(selectedStart[1] ?? 0) - 50} ${selectedStart[0]} ${selectedStart[1]}`
        }
    }

    return (
        <svg
            className="connection-layer"
            style={{
                left: `calc(${offset[0]}px * var(--zoom, 1))`,
                top: `calc(${offset[1]}px * var(--zoom, 1))`,
                transform: `scale(${zoom})`,
            }}
        >
            <InternalConnections connectionPositions={connectionPositions} />
            {selectedPort && selectedPath && (
                <path
                    d={selectedPath}
                    fill="none"
                    stroke={selectedPort.valid ? "lime" : "red"}
                    strokeWidth="4"
                />
            )}
        </svg>
    )
}

export default Connections
