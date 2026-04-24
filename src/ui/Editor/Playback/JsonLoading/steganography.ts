/**
 * Weaves secret data into target buffer, using bitsPerByte pixels.
 * @returns The % space taken up in the image (0-1).
 */
export function weave(
    target: ArrayBufferLike,
    secret: ArrayBufferLike,
    bitsPerByte = 4,
) {
    const targetUint8 = new Uint8Array(target)
    const secretUint8 = new Uint8Array(secret)

    let secretBitIndex = 0
    let totalBytes = 0
    let currentBit = secretUint8[0]
    for (let i = 0; i < targetUint8.length; i++) {
        if (
            targetUint8[Math.floor(i / 4) * 4 + 3] !== 255 ||
            (i + 1) % 4 === 0
        ) {
            continue
            //continue;
        }
        if (secretBitIndex % 8 === 0) {
            currentBit = secretUint8[secretBitIndex / 8] || 0
            totalBytes++
        }
        targetUint8[i] =
            (targetUint8[i] & (0b11111111 << bitsPerByte)) |
            (currentBit >> (8 - bitsPerByte))
        currentBit = (currentBit << bitsPerByte) & 0b11111111
        secretBitIndex += bitsPerByte
    }
    if (secretBitIndex / 8 < secretUint8.length) {
        console.warn(
            `Not all secret data encoded (${secretBitIndex / 8} < ${secretUint8.length})`,
        )
    }
    return secretUint8.byteLength / totalBytes
}

/**
 * Retrieves secret data from target buffer.
 * @returns
 */
export function unweave(target: ArrayBufferLike, bitsPerByte = 4) {
    const targetUint8 = new Uint8Array(target)
    const secretUint8 = new Uint8Array(
        Math.floor((targetUint8.length * bitsPerByte) / 8),
    )

    let secretBitIndex = 0
    let currentBit = 0
    for (let i = 0; i < targetUint8.length; i++) {
        if (
            targetUint8[Math.floor(i / 4) * 4 + 3] !== 255 ||
            (i + 1) % 4 === 0
        ) {
            continue
        }
        secretBitIndex += bitsPerByte
        currentBit =
            (currentBit << bitsPerByte) |
            (targetUint8[i] & ((2 << (bitsPerByte - 1)) - 1))
        if (secretBitIndex % 8 === 0) {
            secretUint8[secretBitIndex / 8 - 1] = currentBit
            currentBit = 0
        }
    }
    return secretUint8.buffer
}

export function encode(
    ctx: CanvasRenderingContext2D | ArrayBufferLike,
    data: ArrayBufferLike,
) {
    let dataLeft
    if (ctx instanceof CanvasRenderingContext2D) {
        const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
        dataLeft = weave(img.data.buffer, data)
        ctx.putImageData(img, 0, 0)
    } else {
        dataLeft = weave(ctx, data)
    }
    return dataLeft
}
