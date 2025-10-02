import { Button } from "@/components/ui/button"

function App() {
    const handleClick = () => {
        console.log("Button clicked!")
        // you can add navigation, API calls, state updates, etc.
    }

    return (
        <div className="space-x-2">
            {/* Default button */}
            <Button onClick={handleClick}>
                Click me
            </Button>

            {/* Different variant */}
            <Button variant="destructive" onClick={() => alert("Danger action!")}>
                Delete
            </Button>

            {/* As a link */}
            <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
            </Button>
        </div>
    )
}


export default App
