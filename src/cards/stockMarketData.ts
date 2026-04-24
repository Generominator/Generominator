import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ValuePort, type Port } from "../cardBase/ports/port"

export class StockMarketData extends Card {
    //card creation
    title = "Stock Market Data"
    description = "Fetches a stock price once at init and outputs cached value"

    inputs: Port[] = []
    outputs: Port[] = [new ValuePort("price")]

    //api shenanigans
    private cachedPrice: number = 0
    private readonly symbol = "AAPL"
    private readonly apiKey = "d66nk49r01qnh6sfb74gd66nk49r01qnh6sfb750" // Get from https://finnhub.io

    //returning the cached price
    async evaluate(): Promise<DataType[]> {
        return [dt.value(this.cachedPrice)]
    }

    //async init for testing to work, might have to change back later
    async init(): Promise<void> {
        await this.fetchPrice()
    }

    cleanup(): void {}

    //fetching price from Finnhub API, it works on my end in the card UI and tests, praying it works for you too :)
    private async fetchPrice(): Promise<void> {
        const url = `https://finnhub.io/api/v1/quote?symbol=${this.symbol}&token=${this.apiKey}`

        try {
            const response = await fetch(url)
            const json = (await response.json()) as Record<string, unknown>
            const currentPrice = json?.c

            if (
                typeof currentPrice === "number" &&
                Number.isFinite(currentPrice)
            ) {
                this.cachedPrice = currentPrice
            } else {
                console.warn("Finnhub returned invalid price:", currentPrice)
            }
        } catch (err) {
            console.error("Failed to fetch stock price:", err)
        }
    }
}
