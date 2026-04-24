import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./style.css"
import App from "./ui/App.tsx"

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
