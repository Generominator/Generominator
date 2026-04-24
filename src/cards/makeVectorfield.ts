import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { VectorPort, VectorFieldPort, type Port } from "../cardBase/ports/port"

export class MakeVectorfield extends Card {
    title = "Make Vectorfield"
    description = "Bundle up to 5 vectors into a single vectorfield"
    inputs: Port[] = [
        new VectorPort("vector 1"),
        new VectorPort("vector 2"),
        new VectorPort("vector 3"),
        new VectorPort("vector 4"),
        new VectorPort("vector 5"),
    ]
    outputs: Port[] = [new VectorFieldPort("vectorfield")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vectors = inputs.filter(
            (input): input is DataTypeOf<"vector"> => input?.kind === "vector",
        )

        if (vectors.length === 0) {
            throw new Error(
                "MakeVectorfield requires at least one vector input",
            )
        }

        return [dt.vectorfield(vectors)]
    }

    init(): void {}
    cleanup(): void {}
}

export default MakeVectorfield
