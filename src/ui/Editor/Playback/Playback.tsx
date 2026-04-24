import type { ExecutionGraph } from "../../../execEngine"
import JsonPanel from "./JsonLoading/JsonPanel"
import "./playback.css"

function Playback({
    enabled,
    playing,
    error = null,
    onPlay = () => {},
    execGraph,
    onLoad = () => {},
    onSave = () => new Promise((resolve) => resolve("")),
}: {
    enabled?: boolean
    playing?: boolean
    error?: string | null
    onPlay?: () => void
    execGraph: ExecutionGraph
    onLoad?: (file: File) => void
    onSave?: (execGraph: ExecutionGraph) => Promise<string>
}) {
    return (
        <div className="playback">
            <h1>Generominator</h1>
            <div className="btn-row">
                <button
                    className={
                        "playback-btn " + (playing ? "playing" : "stopped")
                    }
                    onClick={() => onPlay()}
                    disabled={!enabled}
                >
                    {playing ? "Stop Execution" : "Run System"}
                </button>
                <JsonPanel
                    execGraph={execGraph}
                    onLoad={onLoad}
                    onSave={onSave}
                />
            </div>
            {error && <div className="error-message">{error}</div>}
        </div>
    )
}

export default Playback
