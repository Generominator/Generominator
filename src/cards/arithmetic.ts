import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { Port, TextPort, ValuePort } from "../cardBase/ports/port"

/**
 * Implements the arithmetic card, with support for up to four input variables (a, b, c, d)
 *
 * @remarks I can revise this to be optional inputs, but I suggest this card be used in
 * conjuction with the "Create Equation card".
 * @remarks Input for equations should be text like "(a+b)*2-sin(a)".
 */
export class ArithmeticCard extends Card {
    title = "Arithmetic"
    description =
        "Computes the output of an equation string based on variables a, b, c, and d. Error states: >= 1 variables must be provided, and the equation must be able to evaluatable. If either of these failure states are true, this card returns 0."

    inputs: Port[] = [
        new ValuePort("a"),
        new ValuePort("b"),
        new ValuePort("c"),
        new ValuePort("d"),
        new TextPort("equation", false),
    ]
    outputs: Port[] = [new ValuePort("return value")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const a = (inputs[0] as DataTypeOf<"value">)?.value ?? null
        const b = (inputs[1] as DataTypeOf<"value">)?.value ?? null
        const c = (inputs[2] as DataTypeOf<"value">)?.value ?? null
        const d = (inputs[3] as DataTypeOf<"value">)?.value ?? null
        const equationStr = (inputs[4] as DataTypeOf<"text">)?.value ?? ""

        // Error checking time!

        // Is there an equation and at least one input?
        const provided = { a, b, c, d }
        const providedKeys = Object.entries(provided)
            .filter(([, val]) => val !== null)
            .map(([key]) => key)

        if (providedKeys.length === 0 || equationStr.trim() === "") {
            console.warn(
                `Arithmetic Card: Either an equation wasn't provided or there wasn't at least one value input.`,
            )
            return [dt.value(0)]
        }

        // Does the equation use variables that aren't provided?
        const usedInEquation = ["a", "b", "c", "d"].filter((v) =>
            new RegExp(`\\b${v}\\b`).test(equationStr),
        )

        for (const v of usedInEquation) {
            if (provided[v as keyof typeof provided] === null) {
                // Variable didn't have provided value
                console.warn(
                    `Arithmetic Card: Variable ${v} is used in the given equation, but wasn't provided.`,
                )
                return [dt.value(0)]
            }
        }

        try {
            // Expose Math functions directly so "sin(a)" is treated as "Math.sin(a)"
            const mathFuncs = {
                sin: Math.sin,
                cos: Math.cos,
                sqrt: Math.sqrt,
                abs: Math.abs,
                floor: Math.floor,
                ceil: Math.ceil,
            }

            const context = {
                a: a ?? 0,
                b: b ?? 0,
                c: c ?? 0,
                d: d ?? 0,
                ...mathFuncs,
            }

            // Generate keys and values for the function constructor
            const keys = Object.keys(context)
            const values = Object.values(context)

            const runner = new Function(...keys, `return ${equationStr};`)
            const result = runner(...values)

            console.log(result)

            // Fail state: make sure the number is real
            return [dt.value(Number.isFinite(result) ? result : 0)]
        } catch (e) {
            // If equation is somehow malformed, return 0 to prevent graph crash
            console.warn(`Arithmetic Card: Equation bad, ${e}.`)
            return [dt.value(0)]
        }
    }

    init(): void {}
    cleanup(): void {}
}
