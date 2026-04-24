import { Card } from "../cardBase/card.ts"
import { type Port, TextPort } from "../cardBase/ports/port.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import tracery from "tracery-grammar"

export class GenerateTextGrammarCard extends Card {
    description: string
    inputs: Port[]
    outputs: Port[]
    title: string

    constructor() {
        super()
        this.title = "Generate Text via Grammar Engine"
        this.description = "Generates text via the Tracery grammar engine."

        this.inputs = []
        this.outputs = [new TextPort("output")]
    }

    init(): void {
        // No initialization needed
    }

    cleanup(): void {
        // No cleanup needed
    }

    async evaluate(): Promise<DataType[]> {
        this.traceryGrammar.addModifiers(tracery.baseEngModifiers)
        const finalText = this.traceryGrammar.flatten("#origin#")
        console.log("Generated Text:", finalText)
        return [dt.text(finalText)]
    }

    traceryGrammar = tracery.createGrammar({
        origin: ["#greeting_mode#", "#commit_mode#", "#abstract_mode#"],

        greeting_mode: [
            "#greeting.capitalize#, #place#!",
            "#greeting.capitalize#! Welcome to #place#.",
        ],
        greeting: ["hello", "hi", "greetings", "salutations", "hey there"],
        place: [
            "the amazing GENEROMINATOR",
            "the basement of engineering",
            "the beautiful and foggy redwoods",
            "the McHenry stacks",
        ],

        commit_mode: [
            'git commit -m "#commit_msg#"',
            "FATAL ERROR: #commit_msg#",
            "Last seen: #action# because #commit_msg#",
        ],
        commit_msg: ["#action# #thing#", "#frustration#", "#fix#", "#vague#"],
        thing: [
            "the pointer logic",
            "the README",
            "the #researchTopic#",
            "everything",
        ],
        frustration: [
            "I am too tired for this",
            "it works but don't ask why",
            "small changes (I lied)",
            "cries in C++",
        ],
        fix: [
            "finally fixed the #adjective# bug",
            "refactored #thing# for the 4th time",
        ],
        vague: [
            "...",
            "WIP",
            "Update",
            "it compiles, ship it",
            "ChatGPT wrote all of this",
        ],

        abstract_mode: [
            "Abstract: This #paperType# explores #researchTopic# in #place# through #action#.",
        ],
        paperType: [
            "seminal work",
            "last-minute submission",
            "speculative prototype",
            "desperate thesis",
        ],
        researchTopic: [
            "procedural rhetoric",
            "emergent narrative",
            "human-slug interaction",
            "AI-driven existentialism",
        ],

        action: ["debugging", "theorizing", "caffeinating", "procrastinating"],
        adjective: ["foggy", "ethereal", "moss-covered", "over-engineered"],
    })
}
