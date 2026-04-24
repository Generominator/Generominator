import {
    pipeline,
    type PipelineType,
    type TextToAudioPipeline,
} from "@huggingface/transformers"

const pipelineCache = new Map() // keyed by "task:model"
let initPromise: null | Promise<TextToAudioPipeline> = null // in-flight init promise (one at a time)

const speakerEmbeddings = new Map()
let speakerEmbeddingsPromise: Promise<Float32Array> | null = null

function fetchSpeakerEmbeddings(voice = "M1"): Promise<Float32Array> {
    if (speakerEmbeddings.get(voice)) return speakerEmbeddings.get(voice)
    if (!speakerEmbeddingsPromise) {
        speakerEmbeddingsPromise = new Promise<Float32Array>(
            (resolve, reject) => {
                fetch(
                    `https://huggingface.co/onnx-community/Supertonic-TTS-ONNX/resolve/main/voices/${voice}.bin`,
                )
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(
                                `Failed to fetch speaker embeddings for voice ${voice}: ${response.statusText}`,
                            )
                        }
                        response.arrayBuffer().then((arrayBuffer) => {
                            speakerEmbeddings.set(
                                voice,
                                new Float32Array(arrayBuffer),
                            )
                            speakerEmbeddingsPromise = null
                            resolve(new Float32Array(arrayBuffer))
                        })
                    })
                    .catch((error) => {
                        console.error(
                            `Error fetching speaker embeddings for voice ${voice}:`,
                            error,
                        )
                        // Resolve with an empty array on failure to avoid blocking TTS generation
                        reject(error)
                    })
            },
        )
    }
    return speakerEmbeddingsPromise
}

async function getPipeline(task: PipelineType, model: string) {
    const key = `${task}:${model}`
    if (pipelineCache.has(key)) return pipelineCache.get(key)

    // Serialize concurrent calls — only one pipeline() per key at a time
    if (!initPromise) {
        initPromise = (
            pipeline(task, model, {
                device: "auto",
            }) as unknown as Promise<TextToAudioPipeline>
        )
            .then((instance) => {
                pipelineCache.set(key, instance)
                self.postMessage({
                    type: "ready",
                    task,
                    model,
                })
                initPromise = null
                return instance
            })
            .catch((err) => {
                initPromise = null
                throw err
            })
    }
    return initPromise
}

self.onmessage = async (event) => {
    const { id, type, task, model, input, options } = event.data

    if (!id) {
        // Unrouteable — log and discard rather than posting an unmatched result
        console.warn("[worker] Received message without id, discarding:", type)
        return
    }

    try {
        const pipe = await getPipeline(task, model)

        if (pipe.tokenizer.encode(input).length === 0) {
            self.postMessage({
                id,
                type: "result",
                data: {
                    audio: new Float32Array(),
                    sampling_rate: pipe.model.config.sampling_rate,
                },
            })
            return
        }
        const result = await pipe(input, {
            speaker_embeddings: await fetchSpeakerEmbeddings(
                options.voice ?? "M1",
            ),
            ...options,
        })
        self.postMessage({ id, type: "result", data: result })
    } catch (error) {
        console.error("Error in worker:", error)
        self.postMessage({ id, type: "error", error: (error as Error).message })
    }
}
