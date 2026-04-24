import CreateCurves from "./cards/createCurves"
import { Word2Vec } from "./cards/wordToVec"
import { PCA } from "./cards/pca"
import { dt, type Curve, type DataTypeOf } from "./cardBase/dataTypes"

/**
 * Tests small pipeline of Word2Vec -> PCA -> Create Curves, using hard-coded input for weather
 * text for Word2Vec.
 *
 * @todo Is there a better method for waiting for the model to be ready?
 */
async function runTest() {
    // Test Word2Vec -> PCA -> Create Curves
    const word2Vec = new Word2Vec()
    const pca = new PCA()
    const createCurves = new CreateCurves()

    const text =
        "The weather is currently six seven degrees Fahrenheit. Skies are mostly gray, with thick clouds over the sun and giving everything a dim, flat look."
    console.log(`Input Text: ${text}`)

    // Poll Word2Vec until data is ready with loops
    let highDimVectors: DataTypeOf<"vectorfield"> | null = null
    let attempts = 0

    console.log("Waiting for AI model to load and infer...")

    while (true) {
        const w2vResults = await word2Vec.evaluate([dt.text(text)])
        const result = w2vResults[0]

        // Yay results in
        if (result.kind === "vectorfield" && result.vectors.length > 0) {
            highDimVectors = result
            break
        }

        // Break if it's taking too long (e.g., ~20ish seconds)
        if (attempts++ > 2000) {
            throw new Error(
                "Timeout: Word2Vec model failed to produce results in time.",
            )
        }

        // Wait for next "frame"
        await new Promise((r) => setTimeout(r, 100))
    }

    if (!highDimVectors) {
        throw new Error("highDimVectors is undefined.")
    }

    console.log(
        `Success! Generated ${highDimVectors.vectors.length} vectors of dimension ${highDimVectors.vectors[0].value.components.length}`,
    )

    // Since the dimension vary by input text length, use PCA to make it X-Y plottable
    const pcaResults = await pca.evaluate([highDimVectors, dt.value(2)])
    const pcaVectors = pcaResults[0]

    if (pcaVectors.kind !== "vectorfield") throw new Error("Invalid PCA output")

    // Normalize PCA output (-2..2) to Canvas
    // I'm making it roughly the same size as `test-curves.ts`
    const width = 800
    const height = 600
    const padding = 100

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    pcaVectors.vectors.forEach((v) => {
        minX = Math.min(minX, v.value.components[0])
        maxX = Math.max(maxX, v.value.components[0])
        minY = Math.min(minY, v.value.components[1])
        maxY = Math.max(maxY, v.value.components[1])
    })

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // With range/bounds, now these are drawable vectors
    const scaledVectors = pcaVectors.vectors.map((v) => {
        const nX = (v.value.components[0] - minX) / rangeX
        const nY = (v.value.components[1] - minY) / rangeY
        return dt.vector([
            padding + nX * (width - padding * 2),
            padding + nY * (height - padding * 2),
        ])
    })

    // Give PCA-modified curves to "Create Curves" card
    // Pretty similar to `test-curves.ts` case from here onwards
    const curveResults = await createCurves.evaluate([
        dt.vectorfield(scaledVectors),
    ])
    const curveData = curveResults.find(
        (r): r is DataTypeOf<"curve"> => r.kind === "curve",
    )

    if (!curveData) throw new Error("No curve result")

    const svg = document.getElementById("canvas")

    if (svg) {
        svg.innerHTML = ""

        // Draw words + labels
        scaledVectors.forEach((cp, i) => {
            const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
            )
            circle.setAttribute("cx", String(cp.value.components[0]))
            circle.setAttribute("cy", String(cp.value.components[1]))
            circle.setAttribute("r", "6")
            circle.setAttribute("fill", "red")
            svg.appendChild(circle)

            const textLabel = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text",
            )
            textLabel.setAttribute("x", String(cp.value.components[0] + 10))
            textLabel.setAttribute("y", String(cp.value.components[1]))
            textLabel.textContent = text.split(" ")[i]
            textLabel.setAttribute("fill", "black")
            textLabel.setAttribute("font-family", "monospace")
            svg.appendChild(textLabel)
        })

        // Draw bezier curve
        const curve: Curve = curveData.value
        const numSamples = 100
        const points: number[][] = []
        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples
            const point = curve.getValue(t)
            points.push(point)
        }

        const polyline = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline",
        )

        polyline.setAttribute(
            "points",
            points.map((p) => `${p[0]},${p[1]}`).join(" "),
        )

        polyline.setAttribute("fill", "none")
        polyline.setAttribute("stroke", "blue")
        polyline.setAttribute("stroke-width", "2")
        svg.appendChild(polyline)
    }
}

// Start the async test
runTest().catch((e) => console.error(e))
