import React, { useEffect } from "react"
import type { ExecutionGraph } from "../../../../execEngine"
import "./JsonPanel.css"
import SaveModal from "./SaveModal/SaveModal"

function JsonPanel({
    execGraph,
    onLoad,
    onSave,
}: {
    execGraph: ExecutionGraph
    onLoad: (file: File) => void
    onSave: (execGraph: ExecutionGraph) => Promise<string>
}) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [saveOptionsOpen, setSaveOptionsOpen] = React.useState<boolean>(false)
    const [saveModalOpen, setSaveModalOpen] = React.useState<boolean>(false)
    // Override Ctrl S to run save_json instead
    useEffect(() => {
        const handle_key_down = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault()
                setSaveModalOpen(true)
            }
        }
        document.addEventListener("keydown", handle_key_down)
        return () => document.removeEventListener("keydown", handle_key_down)
    }, [execGraph, onSave])

    useEffect(() => {
        const dismiss_on_click_outside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (
                !target.closest(".save-options") &&
                !target.closest(".playback-btn")
            ) {
                setSaveOptionsOpen(false)
            }
        }
        document.addEventListener("mousedown", dismiss_on_click_outside)
        return () =>
            document.removeEventListener("mousedown", dismiss_on_click_outside)
    }, [])

    function openLoad() {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }

    function load(e: React.ChangeEvent<HTMLInputElement>) {
        // Load the input file's contents as a string into json_file_string
        if (e.target.files != null && e.target.files.length > 0) {
            onLoad(e.target.files[0])
            e.target.value = "" // Clear the input so the same file can be loaded again if needed
        }
    }

    const saveFn = React.useCallback(
        () => onSave(execGraph),
        [execGraph, onSave],
    )
    const closeFn = React.useCallback(() => setSaveModalOpen(false), [])

    return (
        <div className="json-panel">
            <button
                className={"playback-btn" + (saveOptionsOpen ? " active" : "")}
                onMouseDown={() => setSaveOptionsOpen((open) => !open)}
            >
                💾
            </button>
            <input
                ref={inputRef}
                style={{ display: "none" }}
                type="file"
                accept=".json, .png"
                onChange={load}
            ></input>
            {saveOptionsOpen && (
                <div className="save-options">
                    <button
                        className="save-option"
                        onMouseUp={() => {
                            setSaveModalOpen(true)
                            setSaveOptionsOpen(false)
                        }}
                    >
                        Save as...
                    </button>
                    <button
                        className="save-option"
                        onMouseUp={() => {
                            openLoad()
                            setSaveOptionsOpen(false)
                        }}
                    >
                        Load from...
                    </button>
                </div>
            )}
            {saveModalOpen && <SaveModal onSave={saveFn} onClose={closeFn} />}
        </div>
    )
}

export default React.memo(JsonPanel)
