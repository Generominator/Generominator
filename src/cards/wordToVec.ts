import {
    pipeline,
    env,
    FeatureExtractionPipeline,
    Tensor,
} from "@huggingface/transformers"
import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { TextPort, VectorFieldPort, type Port } from "../cardBase/ports/port"

// I don't know about you all but I'm not downloading any local models bleh
env.allowLocalModels = false

// Set cache mode based on environment (for tests n stuff)
env.useBrowserCache = typeof window !== "undefined"

/**
 * Implements the Word2Vec card.
 *
 * @remarks So to my understanding, there's not a really well-supported TS library for Word2Vec,
 * so I settled on doing sentence embeddings through the HuggingFace API to achieve pretty much a similar
 * thing by just splitting the inputs text up.
 * @remarks Too many model downloads from the Hub could give us a 429, but again I just didn't
 * want to download the model myself locally.
 *
 * @todo Check if this aligns with others' implementations regarding evaluate return type.
 *
 * @see https://huggingface.co/Xenova/all-MiniLM-L6-v2
 * @see https://www.npmjs.com/package/@huggingface/transformers
 * @see https://huggingface.co/docs/transformers.js/en/pipelines
 * @see https://huggingface.co/tasks/sentence-similarity
 */
export class Word2Vec extends Card {
    title = "Word2Vec"
    description =
        "Mapping English words according to their machine-learning semantic similarity, or to phonetic similarity."

    inputs: Port[] = [new TextPort("text", false, dt.text("Hello world!"))]
    outputs: Port[] = [new VectorFieldPort("representative vector")]

    /** Saved result of the pipeline handling word extractions. */
    private static extractor: FeatureExtractionPipeline | null = null

    /** A promise that the model is loading, so we don't queue a bunch. */
    private static modelLoadingPromise: Promise<void> | null = null

    /** Data we return while we wait for the pipeline to finish. */
    private cachedVectors: DataTypeOf<"vector">[] = []

    constructor() {
        super()
        this.cachedVectors = []
    }

    /** Loads the model exactly once. */
    private static async loadModel() {
        if (this.extractor) {
            return
        }

        if (!this.modelLoadingPromise) {
            this.modelLoadingPromise = (async () => {
                try {
                    // TODO: extract this into a web worker like the TTS card,
                    // so that it doesn't block the main thread;
                    // not as much of an issue with wordToVec but still something to consider
                    this.extractor = (await pipeline(
                        "feature-extraction",
                        "Xenova/all-MiniLM-L6-v2",
                    )) as unknown as FeatureExtractionPipeline
                    console.log("Word2Vec model loaded.")
                } catch (err) {
                    // Reset the promise so we can retry on next call
                    this.modelLoadingPromise = null
                    throw err
                }
            })()
        }
        return this.modelLoadingPromise
    }

    /**
     * Will return whatever is in the cache, should be responsibility
     * of caller to wait for it to actually be the right result.
     */
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const textInput = inputs.find(
            (input): input is DataTypeOf<"text"> => input.kind === "text",
        )

        // If no input, return empty field
        if (!textInput) {
            return [dt.vectorfield([])]
        }

        const currentText = textInput.value

        // Always update and await embeddings for current input
        await this.updateEmbeddings(currentText)
        // Return the up-to-date vectors
        return [dt.vectorfield(this.cachedVectors)]
    }

    /**
     * Runs Word2Vec.
     *
     * @param {string} text - Any text of any length > 0
     */
    private async updateEmbeddings(text: string) {
        try {
            // Load model if not loaded
            await Word2Vec.loadModel()

            const extractor = Word2Vec.extractor
            if (!extractor) {
                throw new Error("Word2Vec model failed to load")
            }

            // Take out whitespace and non-relevant chars
            const words = text
                .toLowerCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                .trim()
                .split(/\s+/)
                .filter((w) => w.length > 0)

            if (words.length === 0) {
                this.cachedVectors = []
                return
            }

            // Get a tensor back of all our word embeddings
            const results: Tensor[] = await Promise.all(
                words.map((word) =>
                    extractor(word, { pooling: "mean", normalize: true }),
                ),
            )

            // Update the cache with our vectors from tensor
            this.cachedVectors = results.map((res: Tensor) => {
                const vec = Array.from(res.data as Float32Array) as number[]
                return dt.vector(vec)
            })

            console.log(
                `Updated embeddings for "${text}" (${this.cachedVectors[0].value.dimension} dims)`,
            )
        } catch (err) {
            console.error("Word2Vec Inference Error:", err)
        }
    }

    /**
     * Function for initializing card.
     *
     * @remarks Could move load model call here out of `updateEmbeddings`, but
     * was not sure about the direction we wanted to go there until Tuesday.
     */
    init(): void {}

    /** Cleanup function. */
    cleanup(): void {}
}
