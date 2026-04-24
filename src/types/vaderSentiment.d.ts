declare module "vader-sentiment" {
    interface SentimentScores {
        compound: number
        pos: number
        neu: number
        neg: number
    }

    const SentimentIntensityAnalyzer: {
        polarity_scores(text: string): SentimentScores
    }

    export { SentimentIntensityAnalyzer }
}
