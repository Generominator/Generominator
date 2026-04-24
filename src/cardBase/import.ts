import type { Card } from "./card"

export type CardConstructor = {
    new (): Card
}

// Store extra cards loaded in debug mode
const debugCards: { [id: string]: CardConstructor } = {}

// Expose debugMode globally
export interface DebugWindow extends Window {
    debugMode?: () => Promise<void>
    debugUpdate?: () => void
}
const win = globalThis.window as DebugWindow
if (globalThis.window !== undefined) {
    win.debugMode = async () => {
        // Only load once
        if (Object.keys(debugCards).length > 0) {
            return
        }

        Object.assign(debugCards, getDebugCardDefinitions())

        // Trigger CardBank update
        if (win.debugUpdate) win.debugUpdate()

        console.log("Debug Mode Activated: Extra cards loaded into Card Bank")
    }
}

export default function getCardDefinitions() {
    const cardsImports: { [filename: string]: { [exp: string]: unknown } } =
        import.meta.glob("/src/cards/*.ts", {
            eager: true,
        })
    const cards: { [id: string]: CardConstructor } = {}
    for (const path in cardsImports) {
        if (cardsImports[path]) {
            // If a default export exists, use that
            if ("default" in cardsImports[path]) {
                cards[path] = cardsImports[path].default as CardConstructor
            } else if (Object.keys(cardsImports[path]).length > 0) {
                // Otherwise, take the first named export (some cards don't export default)
                const firstExportKey = Object.keys(cardsImports[path])[0]
                cards[path] = cardsImports[path][
                    firstExportKey
                ] as CardConstructor
            }
        }
    }
    // Merge in debug cards if present
    return { ...cards, ...debugCards }
}

export function getDebugCardDefinitions() {
    // Import just like we do for the main cards, but from the testingCards directory
    const testCardImports: {
        [filename: string]: { [exp: string]: unknown }
    } = import.meta.glob("/tests/testingUtils/testingCards/*.ts", {
        eager: true,
    })
    const debugCardDefinitions: { [id: string]: CardConstructor } = {}
    for (const path in testCardImports) {
        if (testCardImports[path]) {
            if ("default" in testCardImports[path]) {
                debugCardDefinitions[path] = testCardImports[path]
                    .default as CardConstructor
            } else if (Object.keys(testCardImports[path]).length > 0) {
                const firstExportKey = Object.keys(testCardImports[path])[0]
                debugCardDefinitions[path] = testCardImports[path][
                    firstExportKey
                ] as CardConstructor
            }
        }
    }
    return debugCardDefinitions
}
