import { Potentiometer } from "./cards/potentiometer.ts"

const pot = new Potentiometer()

const statusEl = document.getElementById("status")
const readBtn = document.getElementById("read-btn")

if (
    !(statusEl instanceof HTMLElement) ||
    !(readBtn instanceof HTMLButtonElement)
) {
    throw new Error("Test page missing status or button elements")
}

readBtn.addEventListener("click", async () => {
    const [value] = await pot.evaluate()
    if (value.kind === "value") {
        statusEl.textContent = `Current value: ${value.value}`
    } else {
        statusEl.textContent = "Unexpected datatype returned."
    }
})

window.addEventListener("beforeunload", () => {
    pot.cleanup()
})
