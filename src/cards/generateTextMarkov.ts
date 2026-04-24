import { Card } from "../cardBase/card.ts"
import { type Port, TextPort } from "../cardBase/ports/port.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"

type MarkovChain = Record<string, string[]>

export class GenerateTextMarkov extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string
    description: string

    private chain: MarkovChain = {}
    private isInitialized = false

    constructor() {
        super()
        this.title = "Markov Text Generator"
        this.description = "Get some nonsense out of a Markov text generator."
        this.inputs = []
        this.outputs = [new TextPort("output")]
    }

    cleanup(): void {
        // No cleanup necessary for this card
    }

    async evaluate(): Promise<DataType[]> {
        if (!this.isInitialized) {
            this.init()
        }

        const generatedText = this.generate(50)
        return [dt.text(generatedText)]
    }

    init(): void {
        try {
            const modules = import.meta.glob("/src/assets/text/*.txt", {
                query: "?raw",
                import: "default",
                eager: true,
            })

            const corpus = Object.values(modules).join(" ")
            if (corpus) {
                this.buildChain(corpus)
                this.isInitialized = true
            }
        } catch (error) {
            console.error("Failed to load markov text corpus:", error)
        }
    }

    private buildChain(text: string) {
        const words = text.split(/\s+/).filter(Boolean)
        this.chain = {}

        for (let i = 0; i < words.length - 2; i++) {
            const state = `${words[i]} ${words[i + 1]}`
            const nextWord = words[i + 2]
            if (!this.chain[state]) {
                this.chain[state] = []
            }
            this.chain[state].push(nextWord)
        }
    }

    private generate(length: number, seed?: string): string {
        const states = Object.keys(this.chain)
        if (states.length === 0) {
            return "Unable to generate text: Markov chain is empty."
        }

        // Try to start with the seed if we can otherwise pick a random state
        let currentState =
            (seed && states.find((s) => s.startsWith(seed))) ||
            states[Math.floor(Math.random() * states.length)]

        const result = currentState.split(" ")

        for (let i = 0; i < length; i++) {
            const possibleNextWords = this.chain[currentState]
            if (!possibleNextWords || possibleNextWords.length === 0) {
                const backupState =
                    states[Math.floor(Math.random() * states.length)]
                if (!backupState) {
                    break
                }
                result.push(...backupState.split(" "))
                currentState = backupState
                continue
            }
            const nextWord =
                possibleNextWords[
                    Math.floor(Math.random() * possibleNextWords.length)
                ]
            result.push(nextWord)
            currentState = `${result.at(-2)} ${nextWord}`
        }
        return result.join(" ")
    }
}
