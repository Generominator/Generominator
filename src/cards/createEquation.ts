import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { Port, TextPort, ValuePort } from "../cardBase/ports/port"

/**
 * Implements the Create Equation Card, which generates a random equation string based on a target number of variables.
 *
 * @remarks I was a little cheeky and/or lazy and restricted the equations to only use four variables max.
 */
export class CreateEquationCard extends Card {
    title = "Create Equation"
    description =
        "Generates a random equation string using a specified number of variables (1-4). Given inputs > 4, clamps input."

    inputs: Port[] = [new ValuePort("num variables", false, dt.value(4))]
    outputs: Port[] = [new TextPort("equation")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        // Clamp to a number between 1-4
        const numVars = Math.max(
            1,
            Math.min(
                4,
                Math.floor((inputs[0] as DataTypeOf<"value">)?.value ?? 0),
            ),
        )

        const availableVars = ["a", "b", "c", "d"].slice(0, numVars)
        const ops = ["+", "-", "*", "/"] // The core four
        const funcs = ["sin", "cos", "abs", "sqrt", "floor", "ceil"] // Could add more? I picked simple stuff

        /** Picks a random thing to do from a given array. */
        const pick = (arr: string[]) =>
            arr[Math.floor(Math.random() * arr.length)]

        // Start with random variable in our set
        let eq = pick(availableVars)

        // Add remaining variables
        for (let i = 1; i < numVars; i++) {
            const op = pick(ops)
            const v = availableVars[i]
            // 50/50 chance to wrap a variable in a Math function hehe
            const part = Math.random() > 0.5 ? `${pick(funcs)}(${v})` : v
            eq = `(${eq} ${op} ${part})`
        }

        return [dt.text(eq)]
    }

    init(): void {}
    cleanup(): void {}
}
