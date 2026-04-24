import type { DataType, DataTypeName } from "../dataTypes"

export abstract class Port {
    // The label for this port
    label: string
    optional: boolean
    defaultValue: DataType | null
    // The data type for this port
    abstract dataType: DataTypeName
    constructor(
        label: string = "",
        optional = true,
        defaultValue: DataType | null = null,
    ) {
        this.label = label
        this.optional = optional
        this.defaultValue = defaultValue
    }
    // Converts input data to a valid range
    abstract convert(input: DataType): DataType
    // Determines which data types
    abstract validate(inputType: DataTypeName): boolean
}

export type BindableDataTypeName = Exclude<DataTypeName, "generic">

export interface BindablePort {
    bind(type: BindableDataTypeName | null): void
    bindingScope?: "local" | "node"
}

export function isBindablePort(port: Port): port is Port & BindablePort {
    return typeof (port as Partial<BindablePort>).bind === "function"
}

/**
 * A polymorphic port that starts unbound (`generic`) and later binds
 * to a concrete type. `bindingScope` controls whether binding is local
 * to this port or shared across all bindable ports on the same node.
 */
export class GenericPort extends Port {
    readonly bindingScope: "local" | "node"
    dataType: DataTypeName = "generic"
    boundType: BindableDataTypeName | null = null

    constructor(
        label = "",
        optional = true,
        bindingScope: "local" | "node" = "local",
    ) {
        super(label, optional)
        this.bindingScope = bindingScope
    }

    bind(type: BindableDataTypeName | null) {
        this.boundType = type
        this.dataType = type ?? "generic"
    }

    convert(input: DataType): DataType {
        if (this.boundType !== null && input.kind !== this.boundType) {
            throw new Error(
                `Cannot convert ${input.kind} to ${this.boundType} (${this.constructor.name} '${this.label}')`,
            )
        }
        return input
    }

    validate(inputType: DataTypeName): boolean {
        return this.boundType === null || inputType === this.boundType
    }
}

// Generic array port that can hold any element type
export class ArrayPort extends Port {
    dataType: DataTypeName = "array"
    elementKind: DataTypeName

    constructor(label: string, elementKind: DataTypeName, optional = false) {
        super(label, optional, { kind: "array", elementKind, elements: [] })
        this.elementKind = elementKind
    }

    convert(input: DataType): DataType {
        if (input.kind === "array" && input.elementKind === this.elementKind) {
            return input
        }
        throw new Error(
            `Cannot convert ${input.kind} to array of ${this.elementKind}`,
        )
    }

    validate(inputType: DataTypeName): boolean {
        return inputType === "array"
    }
}

// Classes implementing Port for each generomino data type
export class PersonPort extends Port {
    dataType: DataTypeName = "person"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class SensorPort extends Port {
    dataType: DataTypeName = "sensor"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class EventPort extends Port {
    dataType: DataTypeName = "event"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class GeolocationPort extends Port {
    dataType: DataTypeName = "geolocation"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class GraphPort extends Port {
    dataType: DataTypeName = "graph"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ParticlePort extends Port {
    dataType: DataTypeName = "particle"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class WaveformPort extends Port {
    dataType: DataTypeName = "waveform"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class VectorFieldPort extends Port {
    dataType: DataTypeName = "vectorfield"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class VoxelPort extends Port {
    dataType: DataTypeName = "voxel"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class DepthMapPort extends Port {
    dataType: DataTypeName = "depthmap"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ContentPort extends Port {
    dataType: DataTypeName = "content"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ValuePort extends Port {
    dataType: DataTypeName = "value"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class StatePort extends Port {
    dataType: DataTypeName = "state"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ShapePort extends Port {
    dataType: DataTypeName = "shape"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class CurvePort extends Port {
    dataType: DataTypeName = "curve"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class VectorPort extends Port {
    dataType: DataTypeName = "vector"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class TextPort extends Port {
    dataType: DataTypeName = "text"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class TriMeshPort extends Port {
    dataType: DataTypeName = "trimesh"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ColorPort extends Port {
    dataType: DataTypeName = "color"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
export class ImagePort extends Port {
    dataType: DataTypeName = "image"
    convert(input: DataType): DataType {
        throw new Error("Method not implemented. " + input)
    }
    validate(inputType: DataTypeName): boolean {
        throw new Error("Method not implemented. " + inputType)
    }
}
