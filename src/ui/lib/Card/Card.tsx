import React from "react"
import "./card.css"
import type { Card as CardType } from "../../../cardBase/card"
import Port from "./Port/Port"
import type { DataType, DataTypeName } from "../../../cardBase/dataTypes"
import type { Text } from "../../../cards/text"
import type { ConstColorCard } from "../../../cards/constColorCard"
import ConstValueInterface from "./Interfaces/ConstValueInterface/ConstValueInterface"
import TextInterface from "./Interfaces/TextInterface/TextInterface"
import ConstColorInterface from "./Interfaces/ConstColorInterface/ConstColorInterface"
import PotentiometerInterface from "./Interfaces/PotentiometerInterface/PotentiometerInterface"
import type { Potentiometer } from "../../../cards/potentiometer"
import CombineDepthMapInterface from "./Interfaces/CombineDepthMapInterface/CombineDepthMapInterface"
import type { CombineDepthMapsCard } from "../../../cards/depthMapCombine"
import ScaleMethodInterface from "./Interfaces/ScaleMethodInterface/ScaleMethodInterface"
import type { Scaling } from "../../../cards/scaling"
import type { ScaleVector } from "../../../cards/scaleVector"
import type { ScaleVectorfield } from "../../../cards/scaleVectorfield"
import ConstTextInterface from "./Interfaces/ConstStringnterface/ConstTextInterface.tsx"
import type { buttonCard } from "../../../cards/buttonCard"
import ButtonInterface from "./Interfaces/ButtonInterface/ButtonInterface"
import ImageInterface from "./Interfaces/ImageInterface/ImageInterface"
import type { ArtworkCard } from "../../../cards/artwork"
import BasicShapeInterface from "./Interfaces/BasicShapeInterface/BasicShapeInterface"
import type { BasicShapeCard } from "../../../cards/basicShape"
import { getDebugCardDefinitions } from "../../../cardBase/import.ts"
import SpinnableWheelInterface from "./Interfaces/SpinnableWheelInterface/SpinnableWheel.tsx"
import type { SpinnableWheelCard } from "../../../cards/spinnableWheel.ts"

// Define an InnerCard component that doesn't need to be rerendered when dragging
function _InnerCard({
    card,
    connections,
    defaultInputs,
    onDefaultInputChange,
    result,
    disabled,
    docked,
}: {
    card: CardType
    connections?: null | { inputs: boolean[]; outputs: boolean[] }
    defaultInputs: Array<DataType | null>
    onDefaultInputChange: (portIndex: number, data: DataType | null) => void
    result: DataType[] | null
    disabled?: boolean
    docked?: boolean
}) {
    return (
        <>
            <div
                className={
                    "row-input" + (card.inputs.length === 0 ? " empty" : "")
                }
            >
                {card.inputs.map((port, index) => (
                    <Port
                        connected={docked || connections?.inputs[index]}
                        values={defaultInputs}
                        setConstValue={onDefaultInputChange.bind(null, index)}
                        key={index}
                        type="input"
                        index={index}
                        port={port}
                    />
                ))}
            </div>
            <div className="row-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                {card.title === "Const Value" && (
                    <ConstValueInterface
                        card={card as CardType & { number: number }}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Const Text" && (
                    <ConstTextInterface
                        card={
                            card as CardType & {
                                cardString: string
                                setValue: (v: string) => void
                            }
                        }
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "potentiometer" && (
                    <PotentiometerInterface
                        card={card as Potentiometer}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Button" && (
                    <ButtonInterface
                        card={card as buttonCard}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Spinnable wheel" && (
                    <SpinnableWheelInterface
                        card={card as SpinnableWheelCard}
                    />
                )}
                {card.title === "Text" && (
                    <TextInterface
                        card={card as Text}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Const Color" && (
                    <ConstColorInterface
                        card={card as ConstColorCard}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Combine Depth Maps" && (
                    <CombineDepthMapInterface
                        card={card as CombineDepthMapsCard}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Scaling" && (
                    <ScaleMethodInterface
                        card={card as Scaling}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Scale Vector" && (
                    <ScaleMethodInterface
                        card={card as ScaleVector}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Scale Vectorfield" && (
                    <ScaleMethodInterface
                        card={card as ScaleVectorfield}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Image" && (
                    <ImageInterface
                        card={card as ArtworkCard}
                        disabled={disabled || docked}
                    />
                )}
                {card.title === "Basic Shape" && (
                    <BasicShapeInterface
                        card={card as BasicShapeCard}
                        disabled={disabled || docked}
                    />
                )}
            </div>
            <div
                className={
                    "row-output" + (card.outputs.length === 0 ? " empty" : "")
                }
            >
                {card.outputs.map((port, index) => (
                    <Port
                        key={index}
                        type="output"
                        connected={connections?.outputs[index]}
                        index={index}
                        port={port}
                        values={result ?? null}
                    />
                ))}
            </div>
        </>
    )
}

const InnerCard = React.memo(_InnerCard, (prevProps, nextProps) => {
    // Don't update when callback changes, since React creates a new one on every render
    return (
        prevProps.card === nextProps.card &&
        prevProps.result === nextProps.result &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.docked === nextProps.docked &&
        // If docked, we don't care about connections or defaultInputs since they won't be shown
        (nextProps.docked ||
            (prevProps.defaultInputs === nextProps.defaultInputs &&
                prevProps.connections === nextProps.connections))
    )
})

const debugCards = Object.values(getDebugCardDefinitions()).map((x) => x.name)

// The only way to get card details is to instantiate the class
function Card({
    card,
    id = undefined,
    connections = null,
    defaultInputs = [],
    result = null,
    disabled = false,
    docked = false,
    style = {},
    onDrag = () => {},
    onDrop = () => {},
    onDefaultInputChange = () => {},
}: {
    card: CardType
    id?: string
    connections?: null | { inputs: boolean[]; outputs: boolean[] }
    defaultInputs?: Array<DataType | null>
    result?: DataType[] | null
    disabled?: boolean
    docked?: boolean
    style?: React.CSSProperties
    onDrag?: (
        mouseX: number,
        mouseY: number,
        cardOffsetX: number,
        cardOffsetY: number,
    ) => void
    onDrop?: (
        mouseX: number,
        mouseY: number,
        cardOffsetX: number,
        cardOffsetY: number,
    ) => void
    onDefaultInputChange?: (portIndex: number, data: DataType | null) => void
}) {
    const [position, setPosition] = React.useState<[number, number] | null>(
        null,
    )
    const [cursorOffset, setCursorOffset] = React.useState<
        [number, number] | null
    >(null)
    const [activePointerId, setActivePointerId] = React.useState<number | null>(
        null,
    )
    const ref = React.createRef<HTMLDivElement>()
    const onDefaultInputChangeRef = React.useRef(onDefaultInputChange)
    const initialConcreteType = React.useRef<DataTypeName | null>(
        [...card.inputs, ...card.outputs].find(
            (port) => port.dataType !== "generic",
        )?.dataType ?? null,
    )
    React.useEffect(() => {
        onDefaultInputChangeRef.current = onDefaultInputChange
    }, [onDefaultInputChange])
    const forwardDefaultInputChange = React.useCallback(
        (portIndex: number, data: DataType | null) => {
            onDefaultInputChangeRef.current(portIndex, data)
        },
        [],
    )

    function detectCardColor() {
        const inputs = [...card.inputs, ...card.outputs]

        if (inputs.length === 0) {
            return "#888888"
        }
        // If the card started with a concrete type, keep that stable.
        // If it started fully generic, follow runtime bindings.
        const dataType =
            initialConcreteType.current ??
            inputs.find((port) => port.dataType !== "generic")?.dataType ??
            "generic"
        switch (dataType) {
            case "content":
            case "person":
            case "sensor":
                return "hsl(235, 60%, 90%)"
            case "value":
            case "waveform":
                return "hsl(220, 10%, 90%)"
            case "event":
                return "hsl(5, 80%, 90%)"
            case "state":
            case "vectorfield":
                return "hsl(25, 80%, 90%)"
            case "geolocation":
                return "hsl(225, 80%, 90%)"
            case "shape":
                return "hsl(280, 70%, 90%)"
            case "graph":
            case "curve":
            case "particle":
            case "vector":
                return "hsl(200, 70%, 90%)"
            case "text":
                return "hsl(155, 50%, 90%)"
            case "trimesh":
            case "voxel":
                return "hsl(320, 70%, 90%)"
            case "color":
                return "hsl(95, 70%, 90%)"
            case "depthmap":
            case "image":
                return "hsl(50,80%, 90%)"
        }
        return "#888888"
    }
    const cardColor = detectCardColor()

    // For variables to be available to the event listeners,
    // we have to resubscribe whenever the event changes
    React.useEffect(() => {
        if (position && cursorOffset && activePointerId !== null) {
            document.addEventListener(
                "pointermove",
                handleDrag as unknown as EventListener,
            )
            document.addEventListener(
                "pointerup",
                handleDragEnd as unknown as EventListener,
            )
            document.addEventListener(
                "pointercancel",
                handleDragEnd as unknown as EventListener,
            )
            return () => {
                document.removeEventListener(
                    "pointermove",
                    handleDrag as unknown as EventListener,
                )
                document.removeEventListener(
                    "pointerup",
                    handleDragEnd as unknown as EventListener,
                )
                document.removeEventListener(
                    "pointercancel",
                    handleDragEnd as unknown as EventListener,
                )
            }
        }
        // We don't want to listen to position here,
        // as it changes every time mousemove is fired
    }, [cursorOffset, activePointerId])

    function startDrag(e: React.PointerEvent) {
        if (e.button === 2) return
        const target = e.target as HTMLElement
        if (!ref.current) return
        // Let canvas handle port gestures (wiring).
        if (target.closest(".port")) return
        // Keep pointer interactions inside card controls from falling through to canvas.
        if (
            target.closest(
                "input, select, textarea, button, [contenteditable], .potentiometer, .floating-editor, .carnival-wheel",
            )
        ) {
            e.stopPropagation()
            return
        }
        e.stopPropagation()
        if (e.pointerType === "mouse" && e.button !== 0) return
        if (e.pointerType !== "mouse") {
            e.preventDefault()
        }
        const rect = ref.current.getBoundingClientRect()
        setPosition([rect.left, rect.top])
        document.body.classList.add("dragging")
        setCursorOffset([e.clientX - rect.left, e.clientY - rect.top])
        setActivePointerId(e.pointerId)
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    function getCanvasBounds() {
        const canvas = document.getElementById("canvas-area")
        return canvas?.getBoundingClientRect() || null
    }

    function handleDrag(e: PointerEvent) {
        if (!position || !cursorOffset) return
        if (activePointerId !== null && e.pointerId !== activePointerId) return
        const canvasBounds = getCanvasBounds()
        e.stopPropagation()
        const x = e.clientX
        const y = e.clientY
        setPosition([e.clientX - cursorOffset[0], e.clientY - cursorOffset[1]])
        if (canvasBounds && e.clientX > canvasBounds.left) {
            onDrag(
                x - canvasBounds.left,
                y - canvasBounds.top,
                cursorOffset[0],
                cursorOffset[1],
            )
        }
    }

    function handleDragEnd(e: PointerEvent) {
        if (activePointerId !== null && e.pointerId !== activePointerId) return
        const canvasBounds = getCanvasBounds()
        if (canvasBounds && position && cursorOffset) {
            e.stopPropagation()
            const x = e.clientX
            const y = e.clientY
            // Dispatch a custom event to notify the canvas of the new card position
            onDrop(
                x - canvasBounds.left,
                y - canvasBounds.top,
                cursorOffset[0],
                cursorOffset[1],
            )
        }
        document.body.classList.remove("dragging")
        setPosition(null)
        setCursorOffset(null)
        setActivePointerId(null)
    }

    return (
        <>
            {position && docked && <div className="card card-placeholder" />}
            <div
                id={id}
                ref={ref}
                className={
                    "card" +
                    (debugCards.includes(
                        Object.getPrototypeOf(card).constructor.name,
                    )
                        ? " debug"
                        : "") +
                    (docked ? " docked" : "") +
                    (disabled ? " disabled" : "") +
                    (position ? " dragging" : "") +
                    ((card as CardType & { isDebug?: boolean }).isDebug
                        ? " debug"
                        : "")
                }
                style={
                    {
                        backgroundColor: cardColor,
                        "--card-bg": cardColor,
                        ...style,
                        ...(position !== null
                            ? {
                                  position: "fixed",
                                  zIndex: 1000,
                                  left: position[0],
                                  top: position[1],
                              }
                            : {}),
                    } as React.CSSProperties
                }
                onPointerDown={startDrag}
            >
                {/* Define an InnerCard that doesn't need to be rerendered on drag */}
                <InnerCard
                    card={card}
                    connections={docked ? null : connections}
                    defaultInputs={docked ? [] : defaultInputs}
                    onDefaultInputChange={forwardDefaultInputChange}
                    result={docked ? null : result}
                    disabled={disabled}
                    docked={docked}
                />
            </div>
        </>
    )
}

export default React.memo(Card)
