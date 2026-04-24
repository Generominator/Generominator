import "./canvas.css"
import React from "react"
import Card from "../../lib/Card/Card"
import type { ExecutionGraph } from "../../../execEngine"
import type { Card as CardType } from "../../../cardBase/card"
import type { DataType } from "../../../cardBase/dataTypes"
import getCardDefinitions from "../../../cardBase/import"
import QuickAddPopup, { type QuickAddPopupOption } from "./QuickAddPopup.tsx"
import Connections from "./Connections/Connections.tsx"
import { JsonSaveLoad } from "../../../jsonLoading/jsonSaveLoad.ts"

export interface PortParams {
    cardId: string
    card: CardType
    type: "input" | "output"
    index: number
    elem: HTMLElement
}

export interface PortSelectionParams extends PortParams {
    startMouse: [number, number]
    mouse: [number, number]
    selected: PortParams | null
    valid: boolean
}

interface QuickAddOption extends QuickAddPopupOption {
    constructor: { new (): CardType }
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 5

function clampZoom(value: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function Canvas({
    execEngine,
    results,
    offset,
    setOffset,
    zoom,
    setZoom,
    renderConnections,
    onGraphUpdate = () => {},
    onConnectionChange = () => {},
    onCanvasMove = () => {},
    playing = false,
}: {
    execEngine: ExecutionGraph
    results?: Map<string, DataType[]>
    offset: [number, number]
    setOffset: (offset: [number, number]) => void
    zoom: number
    setZoom: (zoom: number) => void
    renderConnections: boolean
    onGraphUpdate?: () => void
    onConnectionChange?: (toNodeId: string) => void
    onCanvasMove?: () => void
    playing?: boolean
}) {
    const [draggingCanvas, setDraggingCanvas] = React.useState<null | {
        button: number
        mouse: [number, number]
        initialOffset: [number, number]
    }>(null)
    const [selectedPort, setSelectedPort] =
        React.useState<PortSelectionParams | null>(null)
    const [selectedCardIds, setSelectedCardIds] = React.useState<
        string[] | null
    >(null)
    const ref = React.useRef<HTMLDivElement>(null)
    const [connectionUpdateNo, updateConnection] = React.useState<number>(0)
    const [quickAdd, setQuickAdd] = React.useState<null | {
        source: PortParams
        canvasPos: [number, number]
        popupPos: [number, number]
        options: QuickAddOption[]
    }>(null)
    const [activePointerId, setActivePointerId] = React.useState<number | null>(
        null,
    )
    const touchPointersRef = React.useRef<Map<number, [number, number]>>(
        new Map(),
    )
    const pinchGestureRef = React.useRef<null | {
        initialDistance: number
        initialZoom: number
        initialOffset: [number, number]
        initialCenter: [number, number]
    }>(null)
    const isQuickAddTarget = (target: EventTarget | null) =>
        target instanceof Element && target.closest(".quick-add-popup") !== null

    React.useEffect(() => {
        const canvasElem = ref.current
        if (!canvasElem) return

        const preventBrowserPinchZoom = (event: WheelEvent) => {
            if (isQuickAddTarget(event.target)) return
            event.preventDefault()
        }

        canvasElem.addEventListener("wheel", preventBrowserPinchZoom, {
            passive: false,
        })

        return () => {
            canvasElem.removeEventListener("wheel", preventBrowserPinchZoom)
        }
    }, [])

    // --- Connections ---
    // Since connections need to know where the DOM elements are,
    // we want to know whenever they change so we can recalculate positions.
    // All connection changes should go through this internal handler
    const _onConnectionChange = (toNodeId: string) => {
        updateConnection((u) => u + 1)
        onConnectionChange(toNodeId)
    }
    const _onGraphUpdate = () => {
        updateConnection((u) => u + 1)
        onGraphUpdate()
    }

    function clientToCanvasCoords(
        clientX: number,
        clientY: number,
    ): [number, number] {
        const canvasBounds = ref.current?.getBoundingClientRect()
        if (!canvasBounds) return [clientX, clientY]
        return [clientX - canvasBounds.left, clientY - canvasBounds.top]
    }

    function getPortFromTarget(target: HTMLElement): PortParams | null {
        const clickedPort = target.closest(".port")
        const isInput =
            clickedPort?.parentElement?.classList.contains("row-input")
        const clickedCard = clickedPort?.closest(".card")
        if (!clickedPort || !clickedCard) return null

        const card = execEngine.nodes.get(clickedCard.id as string)
        if (!card) return null

        return {
            cardId: clickedCard.id,
            card: card.card,
            type: isInput ? "input" : "output",
            index: Number(clickedPort.getAttribute("data-port-index")),
            elem: clickedPort as HTMLElement,
        }
    }

    function getPortFromPoint(clientX: number, clientY: number) {
        const target = document.elementFromPoint(clientX, clientY)
        if (!(target instanceof HTMLElement)) return null
        return getPortFromTarget(target)
    }

    function getTouchPinchMetrics() {
        const points = Array.from(touchPointersRef.current.values())
        if (points.length < 2) return null

        const p1 = clientToCanvasCoords(points[0][0], points[0][1])
        const p2 = clientToCanvasCoords(points[1][0], points[1][1])
        const distance = Math.max(1, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]))
        const center: [number, number] = [
            (p1[0] + p2[0]) / 2,
            (p1[1] + p2[1]) / 2,
        ]
        return { distance, center }
    }

    function pruneStaleTouchPointers() {
        if (!ref.current) return
        for (const pointerId of touchPointersRef.current.keys()) {
            if (!ref.current.hasPointerCapture(pointerId)) {
                touchPointersRef.current.delete(pointerId)
            }
        }
    }

    function startPinchGesture() {
        const metrics = getTouchPinchMetrics()
        if (!metrics) return

        setDraggingCanvas(null)
        setSelectedPort(null)
        document.body.classList.remove("connecting")
        setActivePointerId(null)

        pinchGestureRef.current = {
            initialDistance: metrics.distance,
            initialZoom: zoom,
            initialOffset: offset,
            initialCenter: metrics.center,
        }
    }

    // --- Pointer events ---

    function startPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (isQuickAddTarget(e.target)) return

        if (e.pointerType === "touch") {
            pruneStaleTouchPointers()
            touchPointersRef.current.set(e.pointerId, [e.clientX, e.clientY])
            e.currentTarget.setPointerCapture(e.pointerId)
            setQuickAdd(null)

            if (touchPointersRef.current.size >= 2) {
                e.preventDefault()
                startPinchGesture()
                return
            }
        }

        if (activePointerId !== null && activePointerId !== e.pointerId) return

        setActivePointerId(e.pointerId)
        e.currentTarget.setPointerCapture(e.pointerId)
        setQuickAdd(null)

        let portParams = getPortFromTarget(e.target as HTMLElement)
        if (!portParams) {
            // Dragging the canvas, not a port
            setDraggingCanvas({
                button: e.button ?? 0,
                mouse: [e.clientX, e.clientY],
                initialOffset:
                    e.button === 2
                        ? clientToCanvasCoords(e.clientX, e.clientY)
                        : (offset.map((x) => x * zoom) as [number, number]),
            })
            return
        }

        e.preventDefault()
        e.stopPropagation()

        // If an edge does exist to this port (and it's an input), disconnect it and start with the other side
        // We don't do this for outputs, since you can have an output connected to multiple inputs
        const edgeIndex =
            portParams.type === "input"
                ? execEngine.edges.findIndex(
                      (edge) =>
                          edge.to === portParams?.cardId &&
                          edge.inIdx === portParams?.index,
                  )
                : -1
        if (edgeIndex !== -1) {
            const edgeToRemove = execEngine.disconnectEdge(edgeIndex)
            if (!edgeToRemove) return
            _onGraphUpdate()
            const type =
                edgeToRemove.from === portParams.cardId ? "input" : "output"
            const cardId =
                type === "output" ? edgeToRemove.from : edgeToRemove.to
            const index =
                type === "output" ? edgeToRemove.outIdx : edgeToRemove.inIdx
            // switch to the other end of the edge
            const otherPortElem = document.querySelector(
                `#${cardId} .row-${type} .port[data-port-index='${index}']`,
            )
            if (otherPortElem) {
                const newPortParams = getPortFromTarget(
                    otherPortElem as HTMLElement,
                )
                if (newPortParams) {
                    portParams = newPortParams
                }
            }
        }

        setSelectedPort({
            ...portParams,
            startMouse: [e.clientX, e.clientY],
            mouse: [e.clientX, e.clientY],
            selected: null,
            valid: false,
        })
        document.body.classList.add("connecting")
    }

    function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (
            e.pointerType === "touch" &&
            touchPointersRef.current.has(e.pointerId)
        ) {
            touchPointersRef.current.set(e.pointerId, [e.clientX, e.clientY])

            const pinchGesture = pinchGestureRef.current
            if (pinchGesture) {
                const metrics = getTouchPinchMetrics()
                if (!metrics) return

                e.preventDefault()
                e.stopPropagation()

                const zoomFactor =
                    metrics.distance / pinchGesture.initialDistance
                const newZoom = clampZoom(pinchGesture.initialZoom * zoomFactor)
                const worldX =
                    pinchGesture.initialCenter[0] / pinchGesture.initialZoom -
                    pinchGesture.initialOffset[0]
                const worldY =
                    pinchGesture.initialCenter[1] / pinchGesture.initialZoom -
                    pinchGesture.initialOffset[1]

                setZoom(newZoom)
                setOffset([
                    metrics.center[0] / newZoom - worldX,
                    metrics.center[1] / newZoom - worldY,
                ])
                return
            }
        }

        if (activePointerId !== null && e.pointerId !== activePointerId) return

        if (selectedPort) {
            const portParams = getPortFromPoint(e.clientX, e.clientY)
            if (portParams && selectedPort.elem !== portParams.elem) {
                const portBounds = portParams.elem.getBoundingClientRect()
                const x = portBounds.left + portBounds.width / 2
                const y =
                    portBounds.top +
                    (portParams.type === "input" ? 0 : portBounds.height)
                setSelectedPort({
                    ...selectedPort,
                    mouse: [x, y],
                    selected: portParams,
                    valid:
                        validatePortConnection(selectedPort, portParams) !==
                        false,
                })
            } else {
                setSelectedPort({
                    ...selectedPort,
                    mouse: [e.clientX, e.clientY],
                    selected: null,
                    valid: false,
                })
            }
        } else if (draggingCanvas) {
            if (draggingCanvas.button === 2) {
                // Don't set offset if it's a right click
                setDraggingCanvas({
                    ...draggingCanvas,
                    mouse: [e.clientX, e.clientY],
                })
                return
            }
            const dx = e.clientX - draggingCanvas.mouse[0]
            const dy = e.clientY - draggingCanvas.mouse[1]
            setOffset([
                (draggingCanvas.initialOffset[0] + dx) / zoom,
                (draggingCanvas.initialOffset[1] + dy) / zoom,
            ])
        }
    }

    // Validate port connection as part of mousemove
    function validatePortConnection(from: PortParams, to: PortParams) {
        // Prevent connecting ports of the same type
        if (from.type === to.type) return false

        // try to make a link
        const fromPort = {
            cardId: from.cardId,
            index: from.index,
            port: from.card[`${from.type}s`][from.index],
        }
        const toPort = {
            cardId: to.cardId,
            index: to.index,
            port: to.card[`${to.type}s`][to.index],
        }
        const order =
            to.type === "output" ? [toPort, fromPort] : [fromPort, toPort]

        const fromType = fromPort.port.dataType
        const toType = toPort.port.dataType
        const fromConcrete = fromType !== "generic"
        const toConcrete = toType !== "generic"
        if (fromConcrete && toConcrete && fromType !== toType) return false

        if (
            // Don't create duplicate edges, OR have multiple edges go to one input
            execEngine.edges.some(
                (e) =>
                    (e.from === order[0].cardId &&
                        e.outIdx === order[0].index &&
                        e.to === order[1].cardId &&
                        e.inIdx === order[1].index) ||
                    (e.to === order[1].cardId && e.inIdx === order[1].index),
            )
        ) {
            return false // connection already exists
        }

        return order
    }

    function endPointerInteraction(cancelled = false) {
        if (selectedPort) {
            if (cancelled) {
                setSelectedPort(null)
                document.body.classList.remove("connecting")
                return
            }
            if (
                selectedPort.selected &&
                selectedPort.selected.type !== selectedPort.type
            ) {
                const portOrder = validatePortConnection(
                    selectedPort,
                    selectedPort.selected,
                )
                if (portOrder) {
                    execEngine.connect(
                        portOrder[0].cardId,
                        portOrder[0].index,
                        portOrder[1].cardId,
                        portOrder[1].index,
                    )
                    onGraphUpdate()
                    _onConnectionChange(portOrder[1].cardId)
                } else {
                    console.warn(`Can't connect ports`)
                }
            } else if (!selectedPort.selected) {
                const dragDistance = Math.hypot(
                    selectedPort.mouse[0] - selectedPort.startMouse[0],
                    selectedPort.mouse[1] - selectedPort.startMouse[1],
                )
                if (dragDistance < 12) {
                    setSelectedPort(null)
                    document.body.classList.remove("connecting")
                    return
                }
                const options = getCompatibleCards(selectedPort)
                if (options.length > 0) {
                    const rect = ref.current?.getBoundingClientRect()
                    if (rect) {
                        const localX = selectedPort.mouse[0] - rect.left
                        const localY = selectedPort.mouse[1] - rect.top
                        const popupPos: [number, number] = [
                            Math.max(0, Math.min(localX, rect.width - 300)),
                            Math.max(0, Math.min(localY, rect.height - 280)),
                        ]
                        setQuickAdd({
                            source: selectedPort,
                            canvasPos: [
                                localX / zoom - offset[0],
                                localY / zoom - offset[1],
                            ],
                            popupPos,
                            options,
                        })
                    }
                }
            }

            setSelectedPort(null)
            document.body.classList.remove("connecting")
        } else if (draggingCanvas) {
            if (draggingCanvas.button === 2) {
                // Detect all cards within the dragged area and select them
                const relativeMouse = clientToCanvasCoords(
                    draggingCanvas.mouse[0],
                    draggingCanvas.mouse[1],
                )
                const selected = []
                const rect = {
                    left: Math.min(
                        relativeMouse[0],
                        draggingCanvas.initialOffset[0],
                    ),
                    right: Math.max(
                        relativeMouse[0],
                        draggingCanvas.initialOffset[0],
                    ),
                    top: Math.min(
                        relativeMouse[1],
                        draggingCanvas.initialOffset[1],
                    ),
                    bottom: Math.max(
                        relativeMouse[1],
                        draggingCanvas.initialOffset[1],
                    ),
                }
                for (const cardId of execEngine.nodes.keys()) {
                    const cardElem = document.getElementById(cardId)
                    if (!cardElem) continue
                    const cardBounds = cardElem.getBoundingClientRect()
                    const cardTopLeft = clientToCanvasCoords(
                        cardBounds.left,
                        cardBounds.top,
                    )
                    const cardBottomRight = clientToCanvasCoords(
                        cardBounds.left + cardBounds.width,
                        cardBounds.top + cardBounds.height,
                    )
                    if (
                        !(
                            cardTopLeft[0] > rect.right ||
                            cardBottomRight[0] < rect.left
                        ) &&
                        !(
                            cardTopLeft[1] > rect.bottom ||
                            cardBottomRight[1] < rect.top
                        )
                    ) {
                        selected.push(cardId)
                    }
                }
                setSelectedCardIds(selected.length > 0 ? selected : null)
            } else if (
                Math.abs(draggingCanvas.initialOffset[0] - offset[0] * zoom) <
                    5 &&
                Math.abs(draggingCanvas.initialOffset[1] - offset[1] * zoom) < 5
            ) {
                // If the offset didn't actually change, clear the selection
                setSelectedCardIds(null)
            }
            setDraggingCanvas(null)
            onCanvasMove()
        }
    }

    function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerType === "touch") {
            touchPointersRef.current.delete(e.pointerId)
        }
        if (ref.current?.hasPointerCapture(e.pointerId)) {
            ref.current.releasePointerCapture(e.pointerId)
        }

        if (pinchGestureRef.current) {
            if (touchPointersRef.current.size < 2) {
                pinchGestureRef.current = null
                onCanvasMove()
            }
            return
        }

        if (activePointerId !== null && e.pointerId !== activePointerId) return

        endPointerInteraction(false)
        setActivePointerId(null)
    }

    function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerType === "touch") {
            touchPointersRef.current.delete(e.pointerId)
        }
        if (ref.current?.hasPointerCapture(e.pointerId)) {
            ref.current.releasePointerCapture(e.pointerId)
        }

        if (pinchGestureRef.current) {
            if (touchPointersRef.current.size < 2) {
                pinchGestureRef.current = null
                onCanvasMove()
            }
            return
        }

        if (activePointerId !== null && e.pointerId !== activePointerId) return

        endPointerInteraction(true)
        setActivePointerId(null)
    }

    function onLostPointerCapture(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerType !== "touch") return
        touchPointersRef.current.delete(e.pointerId)
        if (pinchGestureRef.current && touchPointersRef.current.size < 2) {
            pinchGestureRef.current = null
            onCanvasMove()
        }
    }

    function onMouseWheel(e: React.WheelEvent) {
        if (isQuickAddTarget(e.target)) return
        if (draggingCanvas) return // Don't handle gestures while dragging the canvas

        const delta = -e.deltaY
        const zoomSensitivity = 500
        const zoomFactor = Math.exp(delta / zoomSensitivity)
        const newZoom = clampZoom(zoom * zoomFactor)
        setZoom(newZoom)
        // adjust offset so that the zoom is centered on the mouse position
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const pixelX = e.clientX - rect.left
        const pixelY = e.clientY - rect.top
        setOffset([
            offset[0] - (pixelX / zoom - pixelX / newZoom),
            offset[1] - (pixelY / zoom - pixelY / newZoom),
        ])
        onCanvasMove()
    }

    function getCompatibleCards(from: PortParams): QuickAddOption[] {
        const sourcePort = from.card[`${from.type}s`][from.index]
        if (!sourcePort) return []
        const targetType = from.type === "output" ? "inputs" : "outputs"

        const options = Object.entries(getCardDefinitions())
            .map(([key, constructor]) => {
                const instance = new constructor()
                const matchingPortIndex = instance[targetType].findIndex(
                    (port) =>
                        port.dataType === sourcePort.dataType ||
                        port.dataType === "generic" ||
                        sourcePort.dataType === "generic",
                )
                if (matchingPortIndex === -1) return null
                return {
                    key,
                    title: instance.title,
                    description: instance.description || "",
                    constructor,
                    portIndex: matchingPortIndex,
                    totalPorts: instance[targetType].length,
                } satisfies QuickAddOption
            })
            .filter((x): x is QuickAddOption => x !== null)

        return options.sort((a, b) => a.title.localeCompare(b.title))
    }

    function createCardFromQuickAdd(option: QuickAddOption) {
        if (!quickAdd) return

        const cardWidth = 220 - 3.08 * 2 // padding
        const cardHeight = 146.667 - 3.08 * 2 // padding
        const estimatedPortX =
            quickAdd.canvasPos[0] -
            (((option.portIndex + 0.5) / option.totalPorts) * cardWidth + 3.08)
        const estimatedPortY =
            quickAdd.canvasPos[1] -
            (quickAdd.source.type === "input" ? cardHeight + 6.16 : 3.08)

        const card = new option.constructor()
        const cardId = execEngine.addNode(card, estimatedPortX, estimatedPortY)
        if (playing) {
            card.init()
        }

        if (quickAdd.source.type === "output") {
            execEngine.connect(
                quickAdd.source.cardId,
                quickAdd.source.index,
                cardId,
                option.portIndex,
            )
            _onGraphUpdate()
            _onConnectionChange(cardId)
        } else {
            execEngine.connect(
                cardId,
                option.portIndex,
                quickAdd.source.cardId,
                quickAdd.source.index,
            )
            _onGraphUpdate()
            _onConnectionChange(quickAdd.source.cardId)
        }

        setQuickAdd(null)
    }

    // --- Card updates ---

    function setCardPos(cardId: string, pos: [number, number]) {
        execEngine.setNode(cardId, { pos })
        execEngine.nodes = new Map(execEngine.nodes)
        _onGraphUpdate()
    }

    function _setCardDefaultInputValue(
        cardId: string,
        portIndex: number,
        value: DataType | null,
    ) {
        const card = execEngine.nodes.get(cardId)
        if (!card) return
        const input = card.card.inputs[portIndex]
        if (!input) return
        if (
            value !== null &&
            input.dataType !== "generic" &&
            input.dataType !== value.kind
        ) {
            console.warn(
                `Data type mismatch: expected ${input.dataType}, got ${value.kind}`,
            )
            return
        }
        const defaultInputs = card.defaultInputs || []
        defaultInputs[portIndex] = value
        execEngine.setNode(cardId, { defaultInputs })
        // Since the default value changed, it's technically
        // a change in connections (think connecting a different const value)
        _onConnectionChange(cardId)
    }
    const setCardDefaultInputValue = React.useCallback(
        _setCardDefaultInputValue,
        [execEngine, _onConnectionChange],
    )

    function deleteCard(cardId: string) {
        execEngine.deleteNode(cardId)
        _onGraphUpdate()
    }

    let selectedStart = null
    if (selectedPort) {
        const bounds = selectedPort.elem.getBoundingClientRect()
        const relativeStart = clientToCanvasCoords(
            bounds.left + bounds.width / 2,
            bounds.top + (selectedPort.type === "input" ? 0 : bounds.height),
        )
        selectedStart = [
            relativeStart[0] / zoom - offset[0],
            relativeStart[1] / zoom - offset[1],
        ] as [number, number]
    }

    // Identify which ports are connected to use in Card components
    const cards = [...execEngine.nodes.entries()]
    function setupConnections() {
        const connections: {
            [cardId: string]: { inputs: boolean[]; outputs: boolean[] }
        } = {}
        function connect(id: string, port: number, type: "inputs" | "outputs") {
            if (!connections[id]) {
                const card = execEngine.nodes.get(id)
                if (!card) return
                connections[id] = {
                    inputs: new Array(card.card.inputs.length).fill(false),
                    outputs: new Array(card.card.outputs.length).fill(false),
                }
            }
            connections[id][type][port] = true
        }

        for (const edge of execEngine.edges) {
            connect(edge.from, edge.outIdx, "outputs")
            connect(edge.to, edge.inIdx, "inputs")
        }
        return connections
    }

    const [connections, setConnections] = React.useState<{
        [cardId: string]: { inputs: boolean[]; outputs: boolean[] }
    }>(setupConnections())

    React.useEffect(() => {
        setConnections(setupConnections())
    }, [execEngine.edges.length, cards.length])

    React.useEffect(() => {
        const copyPaste = async (e: KeyboardEvent) => {
            if (selectedCardIds && selectedCardIds.length > 0) {
                if (
                    (e.key === "c" || e.key === "x") &&
                    (e.metaKey || e.ctrlKey)
                ) {
                    e.preventDefault()
                    const map = new Map()
                    for (const id of selectedCardIds || []) {
                        const card = execEngine.nodes.get(id)
                        if (!card) continue
                        map.set(id, card)
                    }
                    const json = await JsonSaveLoad.save_json(
                        {
                            nodes: map,
                            edges: execEngine.edges.filter(
                                (edge) =>
                                    selectedCardIds?.includes(edge.from) &&
                                    selectedCardIds?.includes(edge.to),
                            ),
                        } as ExecutionGraph,
                        true,
                    )
                    navigator.clipboard.writeText(json)
                }
                if (
                    e.key === "Backspace" ||
                    e.key === "Delete" ||
                    (e.key === "x" && (e.metaKey || e.ctrlKey))
                ) {
                    e.preventDefault()
                    selectedCardIds.map((id) => deleteCard(id))
                    setSelectedCardIds(null)
                }
            }
        }

        const paste = async (e: ClipboardEvent) => {
            const data = e.clipboardData?.getData("text")
            if (!data) return
            const oldNodes = [...execEngine.nodes.keys()]
            JsonSaveLoad.load_json(execEngine, data, false)
            const newCardIds = [...execEngine.nodes.keys()].filter(
                (id) => !oldNodes.includes(id),
            )
            setSelectedCardIds(newCardIds)
            newCardIds.map((id) => {
                const card = execEngine.nodes.get(id)
                if (!card) return
                setCardPos(id, [card.pos[0] + 20, card.pos[1] + 20]) // offset pasted cards to avoid overlap
            })
            updateConnection((u) => u + 1)
        }

        window.addEventListener("keydown", copyPaste)
        window.addEventListener("paste", paste)
        return () => {
            window.removeEventListener("keydown", copyPaste)
            window.removeEventListener("paste", paste)
        }
    }, [selectedCardIds, execEngine.nodes, execEngine.edges])

    function _onCardDrag(
        key: string,
        mouseX: number,
        mouseY: number,
        cardOffsetX: number,
        cardOffsetY: number,
    ) {
        if (selectedCardIds && selectedCardIds.includes(key)) {
            // If multiple cards are selected, move all of them together
            const card = execEngine.nodes.get(key)
            if (!card) return
            const dx = (mouseX - cardOffsetX) / zoom - offset[0] - card.pos[0]
            const dy = (mouseY - cardOffsetY) / zoom - offset[1] - card.pos[1]
            for (const cardId of selectedCardIds) {
                if (cardId === key) {
                    setCardPos(key, [
                        (mouseX - cardOffsetX) / zoom - offset[0],
                        (mouseY - cardOffsetY) / zoom - offset[1],
                    ])
                } else {
                    const card = execEngine.nodes.get(cardId)
                    if (!card) continue
                    const newX = card.pos[0] + dx
                    const newY = card.pos[1] + dy
                    setCardPos(cardId, [newX, newY])
                }
            }
        } else {
            setCardPos(key, [
                (mouseX - cardOffsetX) / zoom - offset[0],
                (mouseY - cardOffsetY) / zoom - offset[1],
            ])
        }
    }
    const onCardDrag = React.useCallback(_onCardDrag, [
        offset,
        execEngine.nodes,
        selectedCardIds,
        setCardPos,
    ])

    function _onCardDrop(
        key: string,
        mouseX: number,
        mouseY: number,
        cardOffsetX: number,
        cardOffsetY: number,
    ) {
        if (mouseX < 0 || mouseY < 0) {
            if (selectedCardIds && selectedCardIds.includes(key)) {
                selectedCardIds.map((id) => deleteCard(id))
                setSelectedCardIds(null)
            } else {
                deleteCard(key)
            }
        } else {
            onCardDrag(key, mouseX, mouseY, cardOffsetX, cardOffsetY)
        }
    }
    const onCardDrop = React.useCallback(_onCardDrop, [
        offset,
        zoom,
        execEngine.nodes,
        setCardPos,
        selectedCardIds,
    ])

    return (
        <div
            className={"canvas" + (draggingCanvas ? " dragging" : "")}
            ref={ref}
            id="canvas-area"
            style={
                {
                    "--zoom": zoom,
                    backgroundPositionX: `${offset[0] * zoom}px`,
                    backgroundPositionY: `${offset[1] * zoom}px`,
                } as React.CSSProperties
            }
            onPointerDown={startPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
            onWheel={onMouseWheel}
            onContextMenu={(e) => e.preventDefault()}
        >
            {quickAdd && (
                <QuickAddPopup
                    dataType={
                        quickAdd.source.card[`${quickAdd.source.type}s`][
                            quickAdd.source.index
                        ].dataType
                    }
                    options={quickAdd.options}
                    style={{
                        left: quickAdd.popupPos[0],
                        top: quickAdd.popupPos[1],
                    }}
                    onSelect={createCardFromQuickAdd}
                    onClose={() => setQuickAdd(null)}
                />
            )}
            {cards.map(([key, card], index) => {
                return (
                    <Card
                        id={key}
                        key={key}
                        card={card.card}
                        connections={connections[key]}
                        defaultInputs={card.defaultInputs}
                        result={results?.get(key) || null}
                        style={
                            {
                                "--percent": index / cards.length,
                                position: "absolute",
                                outline: selectedCardIds?.includes(key)
                                    ? "2px solid aqua"
                                    : undefined,
                                left: (card.pos[0] + offset[0]) * zoom,
                                top: (card.pos[1] + offset[1]) * zoom,
                            } as React.CSSProperties
                        }
                        onDrag={onCardDrag.bind(null, key)}
                        onDrop={onCardDrop.bind(null, key)}
                        onDefaultInputChange={setCardDefaultInputValue.bind(
                            null,
                            key,
                        )}
                    />
                )
            })}
            {renderConnections && (
                <Connections
                    zoom={zoom}
                    offset={offset}
                    updateNo={connectionUpdateNo}
                    execEngine={execEngine}
                    clientToCanvasCoords={clientToCanvasCoords}
                    selectedPort={selectedPort}
                    selectedStart={selectedStart}
                />
            )}
            {draggingCanvas &&
                draggingCanvas.button === 2 &&
                (() => {
                    const relativeMouse = clientToCanvasCoords(
                        draggingCanvas.mouse[0],
                        draggingCanvas.mouse[1],
                    )
                    return (
                        <div
                            className="drag-selector"
                            style={{
                                left: Math.min(
                                    relativeMouse[0],
                                    draggingCanvas.initialOffset[0],
                                ),
                                top: Math.min(
                                    relativeMouse[1],
                                    draggingCanvas.initialOffset[1],
                                ),
                                width: Math.abs(
                                    relativeMouse[0] -
                                        draggingCanvas.initialOffset[0],
                                ),
                                height: Math.abs(
                                    relativeMouse[1] -
                                        draggingCanvas.initialOffset[1],
                                ),
                            }}
                        />
                    )
                })()}
        </div>
    )
}

export default Canvas
