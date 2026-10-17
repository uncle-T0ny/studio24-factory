import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexReactClient } from "convex/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles.css"

const convexUrl = import.meta.env.VITE_CONVEX_URL as string
const convex = new ConvexReactClient(convexUrl)
const root = document.getElementById("root")

if (!root) {
  throw new Error("The page has no #root element")
}

createRoot(root).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
)
