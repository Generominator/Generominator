import React from "react"
import "./cardBank.css"
import type { Card as CardType } from "../../../cardBase/card"
import Card from "../../lib/Card/Card"
import getCardDefinitions, { type DebugWindow } from "../../../cardBase/import"
import { defaultValues } from "../../../cardBase/dataTypes"

let cards = getCardDefinitions()

export type CardConstructor = {
    new (): CardType
}

const OPERATORS: {
    [key: string]: {
        description: string
        fn: (card: CardType, type: string) => boolean
    }
} = {
    input: {
        description: "Filter by input",
        fn: (card, type) => card.inputs.some((port) => port.dataType === type),
    },
    output: {
        description: "Filter by output",
        fn: (card, type) => card.outputs.some((port) => port.dataType === type),
    },
}

function CardBank({
    onCreate = () => {},
}: Readonly<{
    onCreate?: (
        card: CardType,
        pos: [number, number],
        mousePos: [number, number],
    ) => void
}>) {
    const [query, setQuery] = React.useState("")
    const searchRef = React.useRef<HTMLInputElement>(null)
    const [searchFocused, setSearchFocused] = React.useState(false)
    const instances = Object.entries(cards).map(([key, card]) => ({
        key,
        prototype: card,
        instance: new card(),
    }))
    const [results, setResults] = React.useState<
        {
            key: string
            prototype: { new (): CardType }
            instance: CardType
        }[]
    >(instances)

    React.useEffect(() => {
        const windowObj = window as DebugWindow
        windowObj.debugUpdate = () => {
            cards = getCardDefinitions()
            const instances = Object.entries(cards).map(([key, card]) => ({
                key,
                prototype: card,
                instance: new card(),
            }))
            setQuery("")
            setResults(instances)
        }
        return () => {
            windowObj.debugUpdate = undefined
        }
    }, [])

    function filter() {
        let results = []
        let sanitizedQuery = query.toLowerCase()

        const operatorRegex = new RegExp(
            `(${Object.keys(OPERATORS).join("|")}):([a-zA-Z]+)`,
            "gm",
        )
        const operators = [...sanitizedQuery.matchAll(operatorRegex)]
        sanitizedQuery = sanitizedQuery.replace(operatorRegex, "").trim()

        for (const instance of instances) {
            if (
                instance.instance.title
                    .toLowerCase()
                    .includes(sanitizedQuery) ||
                instance.instance.description
                    ?.toLowerCase()
                    .includes(sanitizedQuery)
            ) {
                results.push(instance)
            }
        }

        if (operators.length) {
            results = results.filter((instance) => {
                for (const operator of operators) {
                    const op = operator[1]
                    const type = operator[2]
                    if (!(op in OPERATORS)) {
                        console.warn(`Unknown operator ${op} in search query`)
                        continue
                    }
                    if (!OPERATORS[op].fn(instance.instance, type)) {
                        return false
                    }
                }
                return true
            })
        }

        return results
    }

    function _onDrop(
        card: { new (): CardType },
        x: number,
        y: number,
        mouseX: number,
        mouseY: number,
    ) {
        if (x > 0) onCreate(new card(), [x, y], [mouseX, mouseY])
    }
    const onDrop = React.useCallback(_onDrop, [onCreate])

    React.useEffect(() => {
        setResults(filter())
    }, [query])

    function blurSearch(e: MouseEvent) {
        if (
            searchFocused &&
            (e.target as HTMLElement).closest(".search-bar") === null
        ) {
            console.log("blurring search")
            setSearchFocused(false)
        }
    }

    React.useEffect(() => {
        document.addEventListener("click", blurSearch)
        return () => {
            document.removeEventListener("click", blurSearch)
        }
    }, [searchFocused])

    return (
        <div className="card-bank">
            <div className="search-bar">
                🔎
                <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${instances.length} cards...`}
                />
                {query && (
                    <button
                        className="clear-query-btn"
                        onClick={() => setQuery("")}
                    >
                        &times;
                    </button>
                )}
                <div
                    className={
                        "input-results" +
                        (searchFocused && query === "" ? " visible" : "")
                    }
                >
                    <button
                        className="input-suggestion"
                        onClick={() => {
                            setQuery((prev) => prev + "input:")
                            searchRef.current?.focus()
                        }}
                    >
                        <b>input:</b>
                        <span>Filter by input</span>
                    </button>
                    <button
                        className="input-suggestion"
                        onClick={() => {
                            setQuery((prev) => prev + "output:")
                            searchRef.current?.focus()
                        }}
                    >
                        <b>output:</b>
                        <span>Filter by output</span>
                    </button>
                </div>
                <div
                    className={
                        "input-results" +
                        (searchFocused &&
                        (query.toLowerCase().endsWith("input:") ||
                            query.toLowerCase().endsWith("output:"))
                            ? " visible"
                            : "")
                    }
                >
                    {defaultValues
                        .filter(
                            (x) =>
                                ![
                                    "array",
                                    "person",
                                    "sensor",
                                    "content",
                                ].includes(x.kind),
                        )
                        .map((type) => (
                            <button
                                key={type.kind}
                                className="input-suggestion"
                                onClick={() => {
                                    setQuery((prev) => prev + type.kind + " ")
                                    searchRef.current?.focus()
                                }}
                            >
                                <img
                                    width="32"
                                    height="32"
                                    src={"datatypes/" + type.kind + ".png"}
                                />
                            </button>
                        ))}
                </div>
            </div>
            {results.map((card) => (
                <Card
                    id={card.key}
                    key={card.key}
                    card={card.instance}
                    docked={true}
                    onDrop={onDrop.bind(null, card.prototype)}
                />
            ))}
        </div>
    )
}

export default React.memo(CardBank)
