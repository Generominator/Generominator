import type { DataType } from "./dataTypes"
import type { Port } from "./ports/port"

/**
 * Event callback type for card events.
 * The callback can optionally receive output indices that changed.
 */
export type CardEventCallback = (
    changedOutputIndices?: readonly number[],
) => void

export abstract class Card {
    abstract title: string
    abstract description?: string
    // The list of inputs for this card
    abstract inputs: Port[]
    // The list of ouputs for this card
    abstract outputs: Port[]

    // Processes the inputs for the card and outputs the result
    // All cards are treated as async - sync cards can simply return their result directly
    // and the execution engine will wrap it in a Promise automatically via await
    abstract evaluate(inputs: DataType[]): Promise<DataType[]>
    // Initializes the Card
    abstract init(): void
    // Cleans up the Card after running
    abstract cleanup(): void
}

/**
 * Interface for cards that can emit events that trigger subgraph re-evaluation.
 * This allows for the graph to respond to changes in card state dynamically.
 * We should be able to now support cards like the Bluesky feed or potentiometer getting
 * updated while the graph is running.
 */
export interface EventEmitting extends Card {
    /**
     * Called by the ExecutionGraph to provide a callback function.
     * The card should call this callback whenever it wants to trigger re-evaluation.
     * If known, the card can provide which output indices changed, allowing for select re-evaluation.
     */
    setEventCallback(callback: CardEventCallback | null): void
}

/**
 * Check to see if a card is capable of emitting events.
 *
 * @param card The card to check.
 * @returns True if the card implements EventEmitting, false otherwise.
 */
export function isEventEmitting(card: Card): card is EventEmitting {
    return typeof (card as EventEmitting).setEventCallback === "function"
}

export interface OutputRoutableCard extends Card {
    getActiveOutputIndices(inputs: DataType[]): readonly number[]
}

export function isOutputRoutableCard(card: Card): card is OutputRoutableCard {
    return (
        typeof (card as OutputRoutableCard).getActiveOutputIndices ===
        "function"
    )
}
