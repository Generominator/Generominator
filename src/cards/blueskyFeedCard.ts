import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card.ts"
import { type Port, TextPort } from "../cardBase/ports/port.ts"
import type { DataType } from "../cardBase/dataTypes.ts"
import { dt } from "../cardBase/dataTypes.ts"
import { Jetstream } from "@skyware/jetstream"

// Type for Bluesky post event
type CreateEvent = { commit?: { record?: { text?: string } } }

/**
 * BlueskyFeedCard
 * Listens for Bluesky posts containing the given input string.
 * Shares a single Jetstream connection across all instances for efficiency.
 */
export class BlueskyFeedCard extends Card implements EventEmitting {
    title = "Bluesky Feed Card"
    description = "Listens for Bluesky posts containing the given input."
    inputs: Port[] = [
        new TextPort("", false, dt.text("TheStringHasNotBeenSetYet")),
    ]
    outputs: Port[] = [new TextPort()]

    stringToMatch: string = "TheStringHasNotBeenSetYet"
    private unsubscribe: (() => void) | null = null
    private eventCallback: CardEventCallback | null = null
    private latestPost: string = "No matching posts yet."

    ////***** Shared Jetstream logic (static, for all cards) *****////
    private static jetstream: Jetstream | null = null
    private static nextId = 1
    private static subscribers = new Map<number, (text: string) => void>()

    /**
     * Handles incoming Bluesky post events and fans out to all subscribers.
     */
    private static handleCreate(event: CreateEvent): void {
        const text = event?.commit?.record?.text ?? ""
        BlueskyFeedCard.subscribers.forEach((handler) => handler(text))
    }

    /**
     * Ensures the shared Jetstream connection is started and event handler is registered.
     */
    private static ensureStarted(): void {
        if (BlueskyFeedCard.jetstream) return
        BlueskyFeedCard.jetstream = new Jetstream()
        BlueskyFeedCard.jetstream.onCreate(
            "app.bsky.feed.post",
            BlueskyFeedCard.handleCreate,
        )
        BlueskyFeedCard.jetstream.start()
    }

    /**
     * Closes Jetstream if there are no more subscribers.
     */
    private static stopIfIdle(): void {
        if (
            BlueskyFeedCard.subscribers.size === 0 &&
            BlueskyFeedCard.jetstream
        ) {
            BlueskyFeedCard.jetstream.close()
            BlueskyFeedCard.jetstream = null
            console.log("Jetstream connection closed due to no subscribers.")
        }
    }

    /**
     * Subscribe to Bluesky posts. Returns an unsubscribe function.
     */
    private static subscribeToPosts(
        handler: (text: string) => void,
    ): () => void {
        BlueskyFeedCard.ensureStarted()
        const id = BlueskyFeedCard.nextId++
        BlueskyFeedCard.subscribers.set(id, handler)
        return () => {
            BlueskyFeedCard.subscribers.delete(id)
            BlueskyFeedCard.stopIfIdle()
        }
    }

    ////***** Non-static card instance logic *****////
    constructor() {
        super()
    }

    init(): void {
        this.startListening()
    }

    cleanup(): void {
        this.stopListening()
    }

    /**
     * Register this card's handler with the shared Jetstream manager.
     */
    private startListening(): void {
        if (this.unsubscribe) return
        this.unsubscribe = BlueskyFeedCard.subscribeToPosts((text) => {
            if (text.toLowerCase().includes(this.stringToMatch)) {
                this.latestPost = text
                if (this.eventCallback) {
                    this.eventCallback()
                }
            }
        })
    }

    /**
     * Unregister this card's handler from the shared Jetstream manager.
     */
    private stopListening(): void {
        if (this.unsubscribe) {
            console.log("Unsubscribing from Bluesky posts for card instance.")
            this.unsubscribe()
            this.unsubscribe = null
        }
    }

    /**
     * update the match string and return the latest matching post.
     */
    evaluate(inputs: DataType[]): Promise<DataType[]> {
        const nextMatch =
            inputs[0]?.kind === "text"
                ? inputs[0].value
                : "TheStringHasNotBeenSetYet"
        const normalized = nextMatch.toLowerCase()
        if (normalized !== this.stringToMatch) {
            this.stringToMatch = normalized
            this.latestPost = "No matching posts yet."
        }
        return Promise.resolve([dt.text(this.latestPost)])
    }

    setEventCallback(callback: CardEventCallback): void {
        this.eventCallback = callback
    }
}

/*
Putting this here for later:

'{"commit":{"rev":"3mdwptgyvbu2s","operation":"create","collection":"app.bsky.feed.post","rkey":"3mdwptgvur22c","record":{"$type":"app.bsky.feed.post","createdAt":"2026-02-03T06:21:22.701Z","langs":["en"],"text":"Are you a turtle"},"cid":"bafyreigipwmf2f5ps26j4nrch4rn5eldh6obxj6znrohgouthrqaqktzim"},"did":"did:plc:hir733ej6na4i77q4nsjbcsq","time_us":1770099683089922,"kind":"commit"}'
 */
