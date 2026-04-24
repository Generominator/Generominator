import { Card } from "../cardBase/card"
import { type Port, VectorFieldPort } from "../cardBase/ports/port"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"

export class ConcatenateVectorfields extends Card {
    title = "Concatenate Vectorfields"
    description = "Concatenate multiple vectorfields into a single vectorfield"
    inputs: Port[] = [
        new VectorFieldPort("vectorfield 1"),
        new VectorFieldPort("vectorfield 2"),
        new VectorFieldPort("vectorfield 3"),
        new VectorFieldPort("vectorfield 4"),
        new VectorFieldPort("vectorfield 5"),
    ]
    outputs: Port[] = [new VectorFieldPort("vectorfield")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vectorfields = inputs.filter(
            (input): input is DataTypeOf<"vectorfield"> =>
                input?.kind === "vectorfield",
        )
        if (vectorfields.length < 2) {
            throw new Error(
                `ConcatenateVectorfields requires at least two vectorfield inputs, got: ${JSON.stringify(inputs)}`,
            )
        }
        const allVectors = vectorfields.flatMap((vf) => vf.vectors)
        return [dt.vectorfield(allVectors)]
    }

    init(): void {}
    cleanup(): void {}
}

export default ConcatenateVectorfields
