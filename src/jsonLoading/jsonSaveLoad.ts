import { dt, Vector, type DataTypeName } from "../cardBase/dataTypes"

import { ExecutionGraph } from "../execEngine"
import type { NodeId } from "../execEngine"
import type { Card } from "../cardBase/card"

export class JsonSaveLoad {
    static version_number: string = "0.3.0"

    static load_json(
        exec_graph: ExecutionGraph,
        json_string: string,
        overwrite = true,
    ) {
        if (overwrite) {
            // clear the existing graph
            exec_graph.clear()
        }

        // Get a dictionaty of card names to card constructors
        const card_dictionary = get_card_dictionary()
        // Parse the json string into an ExecGraphJsonObj
        const execGraphObj: ExecGraphJsonObj = JSON.parse(json_string)
        // Check if version number matches the json
        if (JsonSaveLoad.version_number !== execGraphObj.saveVersionNumber) {
            const go_on = confirm(
                `The JSON you are trying to load is from a different Generominos save version and may not load properly.\nAre you sure you would like to continue?\n(JSON File Version: ${execGraphObj.saveVersionNumber} -> Current Version: ${JsonSaveLoad.version_number})`,
            )
            if (!go_on) return false
        }
        // A dictionary of json ids to exec_graph ids
        const json2graph_id = new Map<string, NodeId>()
        // Add all cards from the json into the execution graph
        execGraphObj.cards.forEach((card_json) => {
            const card: Card = new card_dictionary[card_json.title]()
            Object.assign(card, card_json.properties ?? {})
            const json_id = card_json.jsonId
            const graph_id = exec_graph.addNode(
                card,
                card_json.posX,
                card_json.posY,
            )
            json2graph_id.set(json_id, graph_id)
        })
        // Connect all cards according to the json data
        execGraphObj.cards.forEach((card_json) => {
            const json_id = card_json.jsonId
            const graph_id = json2graph_id.get(json_id)!
            if (card_json.inputs != null) {
                for (let i = 0; i < card_json.inputs.length; i++) {
                    const input = card_json.inputs[i]
                    if (input == null) continue
                    if (input.type === "edge") {
                        exec_graph.connect(
                            json2graph_id.get(input.value)!,
                            input.index!,
                            json2graph_id.get(json_id)!,
                            i,
                        )
                    } else if (
                        input.type === "value" &&
                        input.data_type != null
                    ) {
                        exec_graph.nodes.get(graph_id)!.defaultInputs[i] =
                            dt.parse(input.data_type, input.value)
                    }
                }
            }
        })
        return true
    }
    static async save_json(
        exec_graph: ExecutionGraph,
        absolute_positions = false,
    ) {
        // Set up an empty ExecGraphJsonObj to be filled based on the exec_graph
        const exec_graph_json: ExecGraphJsonObj = {
            saveVersionNumber: JsonSaveLoad.version_number,
            cards: [] as CardJsonObj[],
        }

        const min_position: Vector = Vector.one(2).mul(Number.MAX_SAFE_INTEGER)
        // Pasre all nodes in the exec_graph into the json object
        exec_graph.nodes.forEach((node) => {
            const properties: { [key: string]: unknown } = {}
            if ("selected" in node.card) {
                properties["selected"] = node.card.selected
            }
            if ("value" in node.card) {
                properties["value"] = node.card.value
            }
            const card_json = {
                jsonId: node.id,
                title: node.card.title,
                posX: node.pos[0],
                posY: node.pos[1],
                properties,
            } as CardJsonObj
            if (card_json.posX < min_position.x())
                min_position.set(0, card_json.posX)
            if (card_json.posY < min_position.y())
                min_position.set(1, card_json.posY)
            const inputs = Array(node.card.inputs.length) as InputJsonObj[]
            exec_graph.edges.forEach((edge) => {
                if (edge.to === node.id) {
                    inputs[edge.inIdx] = {
                        type: "edge",
                        value: edge.from,
                        index: edge.outIdx,
                    } as InputJsonObj
                }
            })
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i] == null && node.defaultInputs[i] != null) {
                    inputs[i] = {
                        type: "value",
                        value: dt.stringify(node.defaultInputs[i]!),
                        data_type: node.defaultInputs[i]!.kind,
                    } as InputJsonObj
                }
            }
            if (inputs != null) {
                card_json.inputs = inputs
            }
            exec_graph_json.cards.push(card_json)
        })
        if (!absolute_positions) {
            // Move all cards so the top left border of the whole graph is at (10, 10)
            exec_graph_json.cards.forEach((card) => {
                card.posX -= min_position.x() - 10
                card.posY -= min_position.y() - 10
            })
        }

        return JSON.stringify(exec_graph_json)
    }
}

// This stuff is just copied from CardBank.
// Modified slightly to use the card title as the key instead of the file path
export type CardConstructor = {
    new (): Card
}
function get_card_dictionary(): { [title: string]: CardConstructor } {
    const cardsImports: { [filename: string]: { [exp: string]: unknown } } =
        import.meta.glob("/src/cards/*.ts", {
            eager: true,
        })
    const cards: { [title: string]: CardConstructor } = {}
    for (const path in cardsImports) {
        if (cardsImports[path]) {
            // If a default export exists, use that
            if ("default" in cardsImports[path]) {
                const card_ins = new (cardsImports[path]
                    .default as CardConstructor)()
                cards[card_ins.title] = cardsImports[path]
                    .default as CardConstructor
            } else if (Object.keys(cardsImports[path]).length > 0) {
                // Otherwise, take the first named export (some cards don't export default)
                const firstExportKey = Object.keys(cardsImports[path])[0]
                const card_ins = new (cardsImports[path][
                    firstExportKey
                ] as CardConstructor)()
                cards[card_ins.title] = cardsImports[path][
                    firstExportKey
                ] as CardConstructor
            }
        }
    }
    return cards
}

// Interfaces for Json Data
interface ExecGraphJsonObj {
    saveVersionNumber: string
    cards: CardJsonObj[]
}
interface CardJsonObj {
    jsonId: string
    title: string
    posX: number
    posY: number
    properties?: { [key: string]: unknown }
    inputs?: InputJsonObj[]
}
interface InputJsonObj {
    type: "edge" | "value"
    data_type?: DataTypeName
    value: string
    index?: number
}
