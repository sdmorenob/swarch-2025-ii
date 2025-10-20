import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignUp from "./components/SignUp"
import Login from "./components/Login"
import { ProfileFeed } from "./components/ProfileFeed"
import ExampleProfile from "./components/ExampleProfile"

function App() {
  const [theme, setTheme] = useState("light")

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "cupcake")
  }

  return (
    <div data-theme={theme} className="min-h-screen bg-base-200">
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profilefeed" element={<ProfileFeed />} />
          <Route path="/profileview" element={<ExampleProfile />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App