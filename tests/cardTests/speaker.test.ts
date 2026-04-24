import { expect, test } from "vitest"
import { SpeakerCard } from "../../src/cards/speaker"
import { type DataTypeOf } from "../../src/cardBase/dataTypes"

test("SpeakerCard handles waveform input", async () => {
    const card = new SpeakerCard()
    card.init()

    // imitate a waveform input
    const mockWaveform: DataTypeOf<"waveform"> = {
        kind: "waveform",
        samples: [0.5, -0.5, 0.5, -0.5],
        sampleRate: 44100,
    }

    const outputs = await card.evaluate([mockWaveform])

    // Since SpeakerCard has no outputs, we expect an empty array
    expect(outputs).toBeDefined()
    expect(outputs.length).toBe(0)
})
