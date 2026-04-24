import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ValuePort, VectorFieldPort, type Port } from "../cardBase/ports/port"

export class PCA extends Card {
    title = "PCA"
    description = "Principal Component Analysis"
    inputs: Port[] = [
        new VectorFieldPort("vectors", false),
        new ValuePort("num components", false, dt.value(2)),
    ]
    outputs: Port[] = [new VectorFieldPort("transformed vectors")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vectorField = inputs.find(
            (input): input is DataTypeOf<"vectorfield"> =>
                input.kind === "vectorfield",
        )
        const numComponentsInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )

        if (!vectorField || vectorField.vectors.length === 0) {
            throw new Error("PCA requires a vectorfield input")
        }

        const vectors = vectorField.vectors.map((v) => v.value.components)
        const numComponents = Math.min(
            Math.floor(numComponentsInput?.value ?? 2),
            vectors[0].length,
            vectors.length,
        )

        const transformedVectors = pca(vectors, numComponents)

        // Convert back to vectorfield
        const resultVectors = transformedVectors.map((v) => dt.vector(v))
        return [dt.vectorfield(resultVectors)]
    }

    init(): void {}
    cleanup(): void {}
}

/**
 * Performs PCA on a set of vectors using power iteration.
 * Returns the data vectors transformed into the k-dimensional
 * space spanned by the top k principal components.
 */
function pca(vectors: number[][], k: number): number[][] {
    const d = vectors[0].length

    // Step 1: Center the data (subtract mean)
    const mean = computeMean(vectors)
    const centered = vectors.map((v) => subtract(v, mean))

    // Step 2: Compute covariance matrix
    // cov[i][j] = (1/n) * Σ centered[k][i] * centered[k][j]
    const cov = computeCovarianceMatrix(centered)

    // Step 3: Find top k eigenvectors using power iteration with deflation
    const eigenvectors: number[][] = []

    for (let i = 0; i < k; i++) {
        // Find the dominant eigenvector of the current (deflated) matrix
        const eigenvector = powerIteration(cov, d)
        eigenvectors.push(eigenvector)

        // Deflate: remove the contribution of this eigenvector
        // cov = cov - λ * v * vᵀ (where λ = vᵀ * cov * v)
        const eigenvalue = computeEigenvalue(cov, eigenvector)
        deflateMatrix(cov, eigenvector, eigenvalue)
    }

    // Step 4: Project each centered data point onto the principal components
    // Each transformed vector has k dimensions (one per principal component)
    const transformed = centered.map((v) => {
        const projected: number[] = []
        for (const eigenvector of eigenvectors) {
            // Coordinate along this principal component = dot(v, eigenvector)
            projected.push(dot(v, eigenvector))
        }
        return projected
    })

    return transformed
}

/**
 * Computes the mean vector of a set of vectors.
 */
function computeMean(vectors: number[][]): number[] {
    const n = vectors.length
    const d = vectors[0].length
    const mean = new Array(d).fill(0)

    for (const v of vectors) {
        for (let i = 0; i < d; i++) {
            mean[i] += v[i]
        }
    }

    for (let i = 0; i < d; i++) {
        mean[i] /= n
    }

    return mean
}

/**
 * Subtracts vector b from vector a.
 */
function subtract(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - b[i])
}

/**
 * Computes the covariance matrix of centered data.
 * Returns a d×d matrix where d is the dimensionality.
 */
function computeCovarianceMatrix(centered: number[][]): number[][] {
    const n = centered.length
    const d = centered[0].length
    const cov: number[][] = []

    // Initialize matrix with zeros
    for (let i = 0; i < d; i++) {
        cov[i] = new Array(d).fill(0)
    }

    // Compute cov[i][j] = (1/n) * Σ centered[k][i] * centered[k][j]
    for (const v of centered) {
        for (let i = 0; i < d; i++) {
            for (let j = 0; j < d; j++) {
                cov[i][j] += v[i] * v[j]
            }
        }
    }

    // Divide by n to get the average
    for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
            cov[i][j] /= n
        }
    }

    return cov
}

/**
 * Power iteration to find the dominant eigenvector.
 * Repeatedly multiplies a random vector by the matrix and normalizes.
 */
function powerIteration(
    matrix: number[][],
    d: number,
    maxIterations: number = 100,
    tolerance: number = 1e-10,
): number[] {
    // Start with a random unit vector
    let v = randomUnitVector(d)

    for (let iter = 0; iter < maxIterations; iter++) {
        // Multiply: v_new = matrix * v
        const vNew = matrixVectorMultiply(matrix, v)

        // Normalize
        const norm = vectorNorm(vNew)
        if (norm < tolerance) {
            // Matrix has been fully deflated or is zero
            break
        }

        for (let i = 0; i < d; i++) {
            vNew[i] /= norm
        }

        // Check for convergence (vector stopped changing)
        let diff = 0
        for (let i = 0; i < d; i++) {
            diff += Math.abs(vNew[i] - v[i])
        }

        v = vNew

        if (diff < tolerance) {
            break
        }
    }

    return v
}

/**
 * Creates a random unit vector of dimension d.
 */
function randomUnitVector(d: number): number[] {
    const v = []
    for (let i = 0; i < d; i++) {
        // Use a simple deterministic "random" for reproducibility
        v.push((Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1)
    }
    const norm = vectorNorm(v)
    return v.map((x) => x / norm)
}

/**
 * Multiplies a matrix by a vector: result = matrix * v
 */
function matrixVectorMultiply(matrix: number[][], v: number[]): number[] {
    const d = v.length
    const result = new Array(d).fill(0)

    for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
            result[i] += matrix[i][j] * v[j]
        }
    }

    return result
}

/**
 * Computes the Euclidean norm (length) of a vector.
 */
function vectorNorm(v: number[]): number {
    let sum = 0
    for (const x of v) {
        sum += x * x
    }
    return Math.sqrt(sum)
}

/**
 * Computes the eigenvalue for an eigenvector: λ = vᵀ * A * v
 */
function computeEigenvalue(matrix: number[][], eigenvector: number[]): number {
    const Av = matrixVectorMultiply(matrix, eigenvector)
    return dot(eigenvector, Av)
}

/**
 * Dot product of two vectors.
 */
function dot(a: number[], b: number[]): number {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i]
    }
    return sum
}

/**
 * Deflates the matrix by removing the contribution of an eigenvector.
 * matrix = matrix - eigenvalue * eigenvector * eigenvectorᵀ
 * This modifies the matrix in place.
 */
function deflateMatrix(
    matrix: number[][],
    eigenvector: number[],
    eigenvalue: number,
): void {
    const d = eigenvector.length

    for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
            matrix[i][j] -= eigenvalue * eigenvector[i] * eigenvector[j]
        }
    }
}

export default PCA
