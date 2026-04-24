import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ValuePort } from "../cardBase/ports/port"

/**
 * this card returns the time, a number equal to today's date and time
 * in milliseconds since the "epoch"
 */
export class Time extends Card implements EventEmitting {
    title = "time"
    description = "a value that always ticks forward"
    inputs = []
    outputs = [new ValuePort("value")]

    private eventCallback: CardEventCallback | null = null
    private timerId: ReturnType<typeof setInterval> | null = null
    private readonly tickMs = 1000 // update every second

    init() {
        //clear and recreate the timer on init
        if (this.timerId) {
            clearInterval(this.timerId)
        }

        this.timerId = setInterval(() => {
            this.eventCallback?.()
        }, this.tickMs)
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.value(Date.now())]
    }

    cleanup() {
        if (this.timerId) {
            clearInterval(this.timerId)
            this.timerId = null
        }
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }
}
