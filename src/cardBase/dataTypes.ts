import { Mesh } from "three"

// Interface for curve types (parametric curves that can be sampled)
export interface Curve {
    getValue(t: number): number[]
    getOutline?(): number[][]
    color?: [number, number, number, number] // RGBA 0–255, optional
    closed?: boolean // fill if true, stroke if false (default false)
}

// A polygon curve defined by a list of 2D points
export class PolygonCurve implements Curve {
    points: [number, number][]
    color?: [number, number, number, number]
    closed: boolean

    constructor(
        points: [number, number][],
        color?: [number, number, number, number],
        closed = true,
    ) {
        this.points = points
        this.color = color
        this.closed = closed
    }

    getValue(t: number): number[] {
        const n = this.points.length
        if (n === 0) return [0, 0]
        if (n === 1) return [...this.points[0]]
        const segments = this.closed ? n : n - 1
        const pos = t * segments
        const i = Math.min(Math.floor(pos), segments - 1)
        const j = (i + 1) % n
        const lt = pos - Math.floor(pos)
        return [
            this.points[i][0] * (1 - lt) + this.points[j][0] * lt,
            this.points[i][1] * (1 - lt) + this.points[j][1] * lt,
        ]
    }

    getOutline(): number[][] {
        return this.points as number[][]
    }
}
export class Vector {
    // The Dimension of the vector
    // i.e. 2 for 2D 3 for 2D and so on
    dimension: number
    // The vectors individual components
    // components.length == dimension
    components: number[]

    // The error to throw if someone tries to operate on vectors of unequal dimensions
    // Something like 2dVec.add(3DVec)
    static unequal_dimension_error = new Error(
        "You can only perform operations on vectors of equal dimension",
    )
    constructor(components: number[]) {
        this.components = components
        this.dimension = this.components.length
    }
    // Getter function to replace accessing with "vec.value.component[0]"
    get(i: number): number {
        return this.components[i]
    }
    // Getter function to replace assigning with "vec.value.component[0] = some_value"
    set(i: number, v: number) {
        this.components[i] = v
    }
    // returns the component at index 0
    x(): number {
        return this.get(0)
    }
    // returns the component at index 1 if it exists
    y(): number {
        if (this.dimension < 2)
            throw new Error("Called y() on a less than 2 dimensional vector")
        return this.get(1)
    }
    // returns the component at index 2 if it exists
    z(): number {
        if (this.dimension < 3)
            throw new Error("Called z() on a less than 3 dimensional vector")
        return this.get(2)
    }
    // Returns the sum of this vector and "other"
    add(other: Vector): Vector {
        if (this.dimension != other.dimension)
            throw Vector.unequal_dimension_error
        const result = Vector.zero(this.dimension)
        for (let i = 0; i < this.dimension; i++) {
            result.set(i, this.get(i) + other.get(i))
        }
        return result
    }
    // Returns the difference of this vector and "other"
    sub(other: Vector): Vector {
        return this.add(other.mul(-1))
    }
    // Returns the product of this vector and "val"
    mul(val: number): Vector {
        const result = Vector.zero(this.dimension)
        for (let i = 0; i < this.dimension; i++) {
            result.set(i, this.get(i) * val)
        }
        return result
    }
    // Returns the quotient of this vector and "val"
    div(val: number): Vector {
        return this.mul(1 / val)
    }

    // Returns the dot product of this vector and "other"
    dot(other: Vector): number {
        if (this.dimension != other.dimension)
            throw Vector.unequal_dimension_error
        let result = 0
        for (let i = 0; i < this.dimension; i++) {
            result += this.components[i] * other.components[i]
        }
        return result
    }

    // Returns the square distance from this vector to "other"
    distance_sqr(other: Vector): number {
        if (this.dimension != other.dimension)
            throw Vector.unequal_dimension_error
        let distance_sqr = 0
        for (let i = 0; i < this.dimension; i++) {
            distance_sqr += Math.pow(other.get(i) - this.get(i), 2)
        }
        return distance_sqr
    }
    // Returns the distance from this vector to "other"
    distance_to(other: Vector): number {
        return Math.sqrt(this.distance_sqr(other))
    }
    // Returns true if this vector equals "other", otherwise false
    equals(other: Vector): boolean {
        if (this.dimension != other.dimension)
            throw Vector.unequal_dimension_error
        for (let i = 0; i < this.dimension; i++) {
            if (this.get(i) != other.get(i)) return false
        }
        return true
    }
    toString() {
        let as_string = `(${this.components[0]}`
        for (let i = 1; i < this.components.length; i++) {
            as_string += `, ${this.components[i]}`
        }
        as_string += ")"
        return as_string
    }
    // Returns vector will all components equal to zero
    static zero(dimension: number): Vector {
        return new Vector(Array(dimension).fill(0))
    }
    // Returns vector will all components equal to one
    static one(dimension: number): Vector {
        return new Vector(Array(dimension).fill(1))
    }
}
export class Graph {
    nodes: Vector[]
    // This graph's adjacency matrix
    edges: (number | null)[][]
    constructor() {
        this.nodes = []
        this.edges = []
    }
    // Adds a node to the graph and adjusts the size of the adjacency matrix
    add_node(vert: Vector) {
        this.nodes.push(vert)
        this.edges.push([])
        for (let i = 0; i < this.edges.length; i++) {
            while (this.edges[i].length < this.edges.length) {
                this.edges[i].push(null)
            }
        }
    }
    // Returns true if the given vector is a node in the graph, otherwise false
    has_node(vert: Vector): boolean {
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].equals(vert)) return true
        }
        return false
    }
    // Removes a node from the graph and adjusts the size of the adjacency matrix
    remove_at(i: number) {
        if (i >= this.nodes.length) return
        this.nodes.splice(i, 1)
        this.edges.splice(i, 1)
        this.edges.forEach((row) => {
            row.splice(i, 1)
        })
    }
    // Connects two nodes by index
    connect_edges(a: number, b: number) {
        if (a == b) return
        this.edges[a][b] = 1
        this.edges[b][a] = 1
    }
    // Disconnects two nodes by index
    disconnect_edges(a: number, b: number) {
        if (a == b) return
        this.edges[a][b] = null
        this.edges[b][a] = null
    }
    get_edge_list() {
        const edge_list: [number, number][] = []
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (this.check_edge(i, j)) {
                    edge_list.push([i, j])
                }
            }
        }
        return edge_list
    }
    check_edge(a: number, b: number): boolean {
        return this.edges[a][b] != null
    }
}

export const DEFAULT_AUDIO_SAMPLE_RATE = 44100

// Discriminated union of all generomino data types
export type DataType =
    // Placeholder / polymorphic type (used by GenericPort before binding)
    | { kind: "generic" }
    // Placeholder types (not yet implemented)
    | { kind: "person" }
    | { kind: "sensor" }
    | { kind: "particle" }
    | { kind: "voxel" }
    | { kind: "content" }
    // Implemented types
    | { kind: "event"; eventName?: string }
    | { kind: "state"; value: boolean }
    | { kind: "shape"; value: Curve[] }
    | { kind: "trimesh"; mesh: Mesh }
    | { kind: "depthmap"; values: number[]; width: number; height: number }
    | { kind: "geolocation"; longitude: number; latitude: number }
    | { kind: "graph"; value: Graph }
    | { kind: "vector"; value: Vector }
    | { kind: "vectorfield"; vectors: DataTypeOf<"vector">[] }
    | { kind: "value"; value: number }
    | { kind: "text"; value: string }
    | { kind: "curve"; value: Curve }
    | { kind: "waveform"; samples: number[]; sampleRate: number }
    | { kind: "color"; r: number; g: number; b: number; a: number }
    | { kind: "image"; data: ImageData }
    // Generic array type for any element type
    | { kind: "array"; elementKind: DataTypeName; elements: DataType[] }

// Default values for each data type (used for constant values)
export const defaultValues: DataType[] = [
    { kind: "person" },
    { kind: "sensor" },
    { kind: "event" },
    { kind: "graph", value: new Graph() },
    { kind: "particle" },
    { kind: "voxel" },
    { kind: "content" },
    { kind: "state", value: false },
    { kind: "shape", value: [] },
    { kind: "trimesh", mesh: new Mesh() },
    { kind: "depthmap", values: [1], width: 1, height: 1 },
    { kind: "geolocation", longitude: 0, latitude: 0 },
    { kind: "vector", value: new Vector([0, 0, 0]) },
    { kind: "vectorfield", vectors: [] },
    { kind: "value", value: 5 },
    { kind: "text", value: "Hello world!" },
    { kind: "curve", value: { getValue: (t: number) => [t, t] } },
    { kind: "waveform", samples: [], sampleRate: DEFAULT_AUDIO_SAMPLE_RATE },
    { kind: "color", r: 255, g: 255, b: 255, a: 1 },
    {
        kind: "image",
        // ImageData does not exist in NodeJS, so tests will fail;
        // redefine the data structure instead
        data: {
            data: new Uint8ClampedArray([255, 255, 255, 255]),
            width: 1,
            height: 1,
            colorSpace: "srgb",
        },
    },
    { kind: "array", elementKind: "value", elements: [] },
]

// Derive the type name from the union
export type DataTypeName = DataType["kind"]

// Extract a specific type from the union by its kind
export type DataTypeOf<K extends DataTypeName> = Extract<DataType, { kind: K }>

// Factory functions for convenient creation of data types
export const dt = {
    geolocation: (
        longitude: number,
        latitude: number,
    ): DataTypeOf<"geolocation"> => ({
        kind: "geolocation",
        longitude,
        latitude,
    }),

    graph: (): DataTypeOf<"graph"> => ({
        kind: "graph",
        value: new Graph(),
    }),

    vector: (components: number[]): DataTypeOf<"vector"> => ({
        kind: "vector",
        value: new Vector(components),
    }),

    vectorfield: (
        vectors: DataTypeOf<"vector">[],
    ): DataTypeOf<"vectorfield"> => ({
        kind: "vectorfield",
        vectors,
    }),

    value: (v: number): DataTypeOf<"value"> => ({
        kind: "value",
        value: v,
    }),

    text: (v: string): DataTypeOf<"text"> => ({
        kind: "text",
        value: v,
    }),

    shape: (v: Curve[]): DataTypeOf<"shape"> => ({
        kind: "shape",
        value: v,
    }),

    curve: (v: Curve): DataTypeOf<"curve"> => ({
        kind: "curve",
        value: v,
    }),

    trimesh: (v: Mesh): DataTypeOf<"trimesh"> => ({
        kind: "trimesh",
        mesh: v,
    }),

    depthmap: (
        values: number[],
        width: number,
        height: number,
    ): DataTypeOf<"depthmap"> => ({
        kind: "depthmap",
        values,
        width,
        height,
    }),

    waveform: (
        samples: number[],
        sampleRate: number = DEFAULT_AUDIO_SAMPLE_RATE,
    ): DataTypeOf<"waveform"> => ({
        kind: "waveform",
        samples,
        sampleRate: Math.round(sampleRate),
    }),

    color: (
        r: number,
        g: number,
        b: number,
        a: number = 1,
    ): DataTypeOf<"color"> => ({
        kind: "color",
        r,
        g,
        b,
        a,
    }),

    image: (data: ImageData): DataTypeOf<"image"> => ({
        kind: "image",
        data,
    }),

    array: <K extends DataTypeName>(
        elementKind: K,
        elements: DataTypeOf<K>[],
    ): DataTypeOf<"array"> => ({
        kind: "array",
        elementKind,
        elements,
    }),

    state: (value: boolean): DataTypeOf<"state"> => ({
        kind: "state",
        value,
    }),

    event: (eventName: string): DataTypeOf<"event"> => ({
        kind: "event",
        eventName,
    }),
    stringify: (data: DataType): string | null => {
        switch (data.kind) {
            case "curve":
                return null
            case "image":
                return btoa(
                    data.data.data.reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        "",
                    ),
                )
            case "waveform": {
                const encodedSamples = btoa(
                    new Uint8Array(
                        new Float32Array(data.samples).buffer,
                    ).reduce(
                        (bytes, byte) => bytes + String.fromCodePoint(byte),
                        "",
                    ),
                )
                return JSON.stringify({
                    samples: encodedSamples,
                    sampleRate: data.sampleRate,
                })
            }
            default:
                return JSON.stringify(data)
        }
    },
    parse: (data_type: string, data_string: string): DataType | null => {
        switch (data_type) {
            case "curve":
                return null
            case "image": {
                const binary_string = atob(data_string)
                const len = binary_string.length
                const bytes = new Uint8ClampedArray(len)
                for (let i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i)
                }
                return {
                    kind: "image",
                    data: new ImageData(bytes, 1, bytes.length / 4),
                }
            }
            case "waveform": {
                let encodedSamples = data_string
                let sampleRate = DEFAULT_AUDIO_SAMPLE_RATE
                // Patch for new versions. TODO: handle versioning better.
                try {
                    const parsed = JSON.parse(data_string) as {
                        samples?: unknown
                        sampleRate?: unknown
                    }
                    if (typeof parsed.samples === "string") {
                        encodedSamples = parsed.samples
                    }
                    if (
                        typeof parsed.sampleRate === "number" &&
                        Number.isFinite(parsed.sampleRate) &&
                        parsed.sampleRate > 0
                    ) {
                        sampleRate = parsed.sampleRate
                    }
                } catch {
                    // Legacy waveform payloads were plain base64 sample bytes.
                    // If we try to load them just put in the default
                }

                const binary_string = atob(encodedSamples)
                const len = binary_string.length
                const bytes = new Uint8Array(len)
                for (let i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i)
                }
                return {
                    kind: "waveform",
                    samples: Array.from(new Float32Array(bytes.buffer)),
                    sampleRate,
                }
            }
            default:
                return JSON.parse(data_string)
        }
    },
} as const
