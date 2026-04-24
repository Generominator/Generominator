import React from "react"
import CardBank from "./CardBank/CardBank.tsx"
import Canvas from "./Canvas/Canvas.tsx"
import Playback from "./Playback/Playback.tsx"
import "./editor.css"
import type { Card as CardType } from "../../cardBase/card.ts"
import { ExecutionGraph } from "../../execEngine.ts"
import type { DataType } from "../../cardBase/dataTypes.ts"
import { JsonSaveLoad } from "../../jsonLoading/jsonSaveLoad.ts"
import { unweave } from "./Playback/JsonLoading/steganography.ts"

function Editor() {
    const [execEngine] = React.useState<ExecutionGraph>(new ExecutionGraph())
    // Card panel
    const [cardPanelOpen, setCardPanelOpen] = React.useState<boolean>(false)
    const [sidebarCollapsed, setSidebarCollapsed] =
        React.useState<boolean>(false)
    // Canvas
    const [canvasOffset, setCanvasOffset] = React.useState<[number, number]>([
        0, 0,
    ])
    const [canvasZoom, setCanvasZoom] = React.useState<number>(1)
    // Playback
    const [playing, setPlaying] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | undefined>(undefined)
    const [results, setResults] = React.useState<
        undefined | Map<string, DataType[]>
    >(undefined)
    // Dropzone
    const [dropzoneState, setDropzoneState] = React.useState<
        null | "visible" | "loading" | "error"
    >(null)
    const [loadedCard, setLoadedCard] = React.useState<string | null>(null)
    const dragElement = React.useRef<EventTarget | null>(null)
    // Rerender trigger
    const [, setUpdate] = React.useState<number>(0)

    React.useEffect(() => {
        if (!playing) return
        let rafId: number | null = null
        let pending: Map<string, DataType[]> | null = null

        const unsubscribe = execEngine.subscribeToResults((nextResults) => {
            pending = new Map(nextResults)
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null
                    if (pending) {
                        setResults(pending)
                        pending = null
                    }
                })
            }
        })

        return () => {
            unsubscribe()
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
                rafId = null
            }
        }
    }, [execEngine, playing])

    async function loadFile(file: File) {
        const error = () => {
            setDropzoneState("error")
            setTimeout(() => setDropzoneState(null), 1250)
        }

        setDropzoneState("loading")
        const reader = new FileReader()
        const isJSON =
            file.type === "application/json" || file.name.endsWith(".json")
        const isImage = file.type.startsWith("image/")
        if (!isJSON && !isImage) {
            return error()
        }
        const data = await new Promise((r) => {
            reader.onload = () => r(reader.result)
            if (isJSON) {
                reader.readAsText(file)
            } else {
                reader.readAsDataURL(file)
            }
        })
        let json_string: string | null = null
        if (isJSON && typeof data === "string") {
            json_string = data
        } else if (isImage) {
            const image = new Image()
            image.src = data as string
            await image.decode()
            const canvas = document.createElement("canvas")
            canvas.width = image.width
            canvas.height = image.height
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                return error()
            }
            ctx.drawImage(image, 0, 0)
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            )

            json_string = new TextDecoder()
                .decode(unweave(imageData.data.buffer))
                .split("\0")[0]
        }
        if (!json_string) {
            return error()
        }
        try {
            const state = JsonSaveLoad.load_json(execEngine, json_string ?? "")
            if (!state) {
                return error()
            } else {
                setDropzoneState(null)
                setResults(undefined)
                setPlaying(false)
                document.getElementById("card-data")!.innerHTML = ""

                if (execEngine.nodes.size > 0) {
                    // Scale the canvas to fit the loaded graph
                    let [minX, minY, maxX, maxY] = [0, 0, 0, 0]
                    execEngine.nodes.forEach((node) => {
                        minX = Math.min(minX, node.pos[0])
                        minY = Math.min(minY, node.pos[1])
                        maxX = Math.max(maxX, node.pos[0] + 220)
                        maxY = Math.max(maxY, node.pos[1] + 146.667)
                    })
                    const canvasWidth = maxX - minX + 20
                    const canvasHeight = maxY - minY + 20
                    const actualWidth =
                        window.innerWidth -
                        (sidebarCollapsed || window.innerWidth <= 900 ? 0 : 300)
                    const actualHeight =
                        window.innerHeight -
                        (!sidebarCollapsed && window.innerWidth <= 900
                            ? Math.min(
                                  180,
                                  Math.max(340, window.innerHeight * 0.42),
                              )
                            : 0) +
                        0
                    const scaleX = actualWidth / canvasWidth
                    const scaleY = actualHeight / canvasHeight
                    const newZoom = Math.min(scaleX, scaleY, 1)
                    setCanvasZoom(newZoom)
                    setCanvasOffset([
                        -minX * newZoom +
                            (actualWidth - canvasWidth * newZoom) / 2,
                        -minY * newZoom +
                            (actualHeight - canvasHeight * newZoom) / 2,
                    ])
                }

                setLoadedCard(isImage ? (data as string) : null)
                setTimeout(() => {
                    setLoadedCard(null)
                    setUpdate((u) => u + 1)
                }, 1600)
            }
        } catch (e) {
            console.error(e)
            return error()
        }
    }

    React.useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault()
            dragElement.current = e.target
            setDropzoneState("visible")
        }
        const handleDragLeave = (e: DragEvent) => {
            if (e.target === dragElement.current || e.target === document) {
                e.preventDefault()
                setDropzoneState(null)
            }
        }

        window.addEventListener("dragenter", handleDragEnter)
        window.addEventListener("dragleave", handleDragLeave)
        return () => {
            window.removeEventListener("dragenter", handleDragEnter)
            window.removeEventListener("dragleave", handleDragLeave)
        }
    })

    function _createCard(
        offset: [number, number],
        zoom: number,
        card: CardType,
        mousePos: [number, number],
        cardOffset: [number, number],
    ) {
        // Position is absolute; use canvas offset to convert to relative coordinates
        execEngine.addNode(
            card,
            (mousePos[0] - cardOffset[0] * zoom) / zoom - offset[0],
            (mousePos[1] - cardOffset[1] * zoom) / zoom - offset[1],
        )
        setUpdate((u) => u + 1)

        // If we're currently playing, we need to initialize the card immediately
        if (playing) {
            card.init()
        }
    }
    const [createCard, setCreateCard] = React.useState<
        (
            card: CardType,
            mousePos: [number, number],
            cardOffset: [number, number],
        ) => void
    >(() => _createCard.bind(null, canvasOffset, canvasZoom))
    React.useEffect(() => {
        // Keep CardBank's onCreate callback in sync with playback state
        // Otherwise it can capture stale pay state and skip init.
        setCreateCard(() => _createCard.bind(null, canvasOffset, canvasZoom))
    }, [playing])

    function onCanvasMove() {
        // When the canvas drag ends, we want to update the createCard function
        // so that when new cards are created, they use the new canvas offset and zoom
        // [I originally did this with a useCallback, but I really don't want all the cards
        // to rerender every time the offset changes, which is many times during a drag]
        setCreateCard(() => _createCard.bind(null, canvasOffset, canvasZoom))
    }

    async function startPlay() {
        if (playing) return
        setError(undefined)
        setResults(undefined)
        setPlaying(true)
        document.getElementById("card-data")!.innerHTML = ""
        await new Promise((r) => setTimeout(r, 0)) // allow UI to update
        await execEngine.initCards() // Init cards before running
        try {
            const result = await execEngine.run()
            setResults(new Map(result))
            console.log(result)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
            console.error(e)
            execEngine.destroyCards()
            setPlaying(false)
        }
    }

    function stopPlay() {
        if (!playing) return
        execEngine.destroyCards()
        setPlaying(false)
    }

    function togglePlay() {
        if (playing) {
            stopPlay()
            return
        }
        void startPlay()
    }

    async function _rerunGraph(toNodeId: string) {
        if (!playing) return
        // When connections change, we need to re-run the graph from the affected node to update results downstream
        try {
            await execEngine.runFromNode(toNodeId)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
            console.error(e)
            return
        }
        setError(undefined)
    }
    const rerunGraph = React.useCallback(_rerunGraph, [execEngine, playing])

    const onLoad = React.useCallback((file: File) => {
        loadFile(file).then(() => {
            setUpdate((u) => u + 1)
        })
    }, [])

    return (
        <div
            className={
                "editor" +
                (sidebarCollapsed ? " sidebar-collapsed" : "") +
                (loadedCard ? " loaded-json" : "")
            }
        >
            <aside id="editor-sidebar">
                <Playback
                    onPlay={togglePlay}
                    error={error}
                    playing={playing}
                    enabled={execEngine.edges.length > 0 || playing}
                    execGraph={execEngine}
                    onLoad={onLoad}
                    onSave={JsonSaveLoad.save_json}
                />
                <CardBank onCreate={createCard} />
            </aside>
            <Canvas
                execEngine={execEngine}
                results={results}
                offset={canvasOffset}
                setOffset={setCanvasOffset}
                zoom={canvasZoom}
                setZoom={setCanvasZoom}
                renderConnections={!loadedCard}
                onGraphUpdate={() => setUpdate((u) => u + 1)}
                onConnectionChange={rerunGraph}
                onCanvasMove={onCanvasMove}
                playing={playing}
            />
            <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="toggle-sidebar-edge"
                aria-controls="editor-sidebar"
                aria-expanded={!sidebarCollapsed}
                aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
                {sidebarCollapsed ? ">" : "<"}
            </button>
            <button
                onClick={() => setCardPanelOpen((v) => !v)}
                className="toggle-card-bank"
            >
                {cardPanelOpen ? "Hide" : "Show"} Card Data
            </button>
            <div
                id="card-data"
                className={cardPanelOpen ? "visible" : "hidden"}
            ></div>
            <div
                id="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer?.files.length) {
                        loadFile(e.dataTransfer.files[0])
                    } else {
                        setDropzoneState(null)
                    }
                }}
                className={dropzoneState ?? "hidden"}
            >
                <p>
                    {dropzoneState === "error"
                        ? "Not a valid Card"
                        : dropzoneState === "loading"
                          ? "Loading..."
                          : "Drop a Card image or JSON to load it"}
                </p>
            </div>
            {loadedCard && (
                <img
                    src={loadedCard}
                    alt="Loaded Card"
                    className="loaded-card"
                />
            )}
        </div>
    )
}

export default Editor
