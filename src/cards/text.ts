import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { TextPort, type Port } from "../cardBase/ports/port"

export class Text extends Card implements EventEmitting {
    title = "Text"
    description = "Outputs the opening lines from the selected book."

    inputs: Port[] = []
    outputs: Port[] = [new TextPort("text")]
    private eventCallback: CardEventCallback | null = null

    options: Record<string, string> = {
        "Moby Dick":
            "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
        "A Tale of Two Cities":
            "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
        "Pride and Prejudice":
            "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        "Anna Karenina":
            "Happy families are all alike; every unhappy family is unhappy in its own way.",
        "1984": "It was a bright cold day in April, and the clocks were striking thirteen.",
        "The Metamorphosis":
            "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
        "Die Verwandlung":
            "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt.",
        "A Christmas Carol": "Marley was dead: to begin with.",
        "The Hitchhiker's Guide to the Galaxy":
            "Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small unregarded yellow sun.",
        "One Hundred Years of Solitude":
            "Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.",
        "The Great Gatsby":
            "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
        "Don Quixote":
            "Somewhere in la Mancha, in a place whose name I do not care to remember, a gentleman lived not long ago, one of those who has a lance and ancient shield on a shelf and keeps a skinny nag and a greyhound for racing.",
        Neuromancer:
            "The sky above the port was the color of television, tuned to a dead channel.",
        "The Stranger":
            "Mother died today. Or maybe yesterday; I can't be sure.",
    }
    selected: string = "Moby Dick"

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    setSelected(selected: string): void {
        if (!(selected in this.options) || this.selected === selected) {
            return
        }
        this.selected = selected
        this.eventCallback?.([0])
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.text(this.options[this.selected])]
    }

    init(): void {}
    cleanup(): void {}
}
