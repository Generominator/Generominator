import { Card } from "../cardBase/card.ts"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes.ts"
import { ValuePort, TextPort, type Port } from "../cardBase/ports/port"

import { SentimentIntensityAnalyzer } from "vader-sentiment"

export class SentimentAnalysis extends Card {
    title = "Sentiment Analysis"
    description = "Determine the sentiment value of a given text"
    inputs: Port[] = [new TextPort("text", false, dt.text("Hello world!"))]
    outputs: Port[] = [new ValuePort("sentiment")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const inputText = inputs.find(
            (input): input is DataTypeOf<"text"> => input.kind === "text",
        )

        if (!inputText) {
            throw new Error("inputText is undefined.")
        }

        const intensity = SentimentIntensityAnalyzer.polarity_scores(
            inputText.value,
        )

        return [dt.value(intensity.compound)]
    }

    init(): void {}
    cleanup(): void {}
}

export default SentimentAnalysis
