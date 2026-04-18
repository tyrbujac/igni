```ivy
// Mock data representing the available items
const availablePotions = [
    { name: "Health Potion", price: 10 },
    { name: "Mana Crystal", price: 15 },
    { name: "Speed Elixir", price: 25 }
];

// Shared state mimicking the inventory/satchel.
// This state is managed globally and updated by interactions.
// Format: { name: string, quantity: number }[]
const initialSatchelState = [];


// ===============================================================
// 1. Component: ItemCard (Reusable UI element for display)
// ===============================================================
component ItemCard(item) {
    style {
        border: "1px solid #ccc";
        padding: "10px";
        margin-bottom: "10px";
        cursor: "pointer";
        display: "flex";
        justify-content: "space-between";
        align-items: "center";
        background-color: "#f9f9f9";
    }

    onClick() {
        // Logic executed when an item card is clicked
        updateSatchel(item.name);
    }

    render() {
        return (
            <div onClick={this.onClick}>
                <div>
                    <strong>{item.name}</strong>
                    <p style="font-size: 0.9em; color: #666;">Price: {item.price}</p>
                </div>
                <button>Add to Satchel</button>
            </div>
        );
    }
}


// ===============================================================
// 2. State Management/Interaction Logic
// ===============================================================
/**
 * Updates the shared satchel state when an item is clicked.
 * @param {string} itemName - The name of the item clicked.
 */
function updateSatchel(itemName) {
    const satchel = getSharedSatchelState();

    // Check if item already exists in satchel
    const existingItemIndex = satchel.findIndex(item => item.name === itemName);

    if (existingItemIndex !== -1) {
        // Item exists: Increment quantity
        const newSatchel = [...satchel];
        newSatchel[existingItemIndex].quantity += 1;
        setSharedSatchelState(newSatchel);
    } else {
        // Item is new: Add item to satchel
        const newItem = { name: itemName, quantity: 1 };
        setSharedSatchelState([...satchel, newItem]);
    }
}

// Mock functions to simulate global state management (in a real framework)
function getSharedSatchelState() {
    // In a real app, this fetches state from a Redux store or context.
    return localStorage.getItem('satchelState') ? JSON.parse(localStorage.getItem('satchelState')) : initialSatchelState;
}

function setSharedSatchelState(newState) {
    // Persists the state and triggers UI re-render (simulated)
    localStorage.setItem('satchelState', JSON.stringify(newState));
    console.log("SATHEL UPDATED:", newState);
}


// ===============================================================
// 3. Component: SatchelDisplay (Shows contents and total value)
// ===============================================================
component SatchelDisplay() {
    // Retrieve current state when rendered
    const satchel = getSharedSatchelState();

    // Calculate total value
    const totalValue = satchel.reduce((total, item) => {
        const potion = availablePotions.find(p => p.name === item.name);
        if (potion) {
            return total + (potion.price * item.quantity);
        }
        return total;
    }, 0);

    render() {
        return (
            <div style={{ border: "2px dashed #007bff", padding: "20px", margin-top: "30px" }}>
                <h2>🎒 Your Satchel ({satchel.length} unique items)</h2>
                {satchel.length === 0 ? (
                    <p>Your satchel is empty. Go explore!</p>
                ) : (
                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", padding: "10px" }}>
                        {satchel.map(item => (
                            <div key={item.name} style={{ display: "flex", justify: "space-between", padding: "5px 0", borderBottom: "1px dotted #ccc" }}>
                                <span>{item.name} (x{item.quantity})</span>
                                <span style={{ fontWeight: "bold" }}>{availablePotions.find(p => p.name === item.name)?.price * item.quantity} gp</span>
                            </div>
                        ))}
                    </div>
                )}
                <h3 style={{ textAlign: "right", marginTop: "15px" }}>Total Value: {totalValue} gp</h3>
            </div>
        );
    }
}


// ===============================================================
// 4. Main App Renderer (Putting it all together)
// ===============================================================
function App() {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "1000px", margin: "40px auto", padding: "20px" }}>
            <h1 style={{ color: "#333" }}>The Apothecary Shop</h1>
            <p>Click any item to add it to your satchel!</p>

            {/* Item Display Section */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {availablePotions.map(potion => (
                    <ItemCard key={potion.name} item={potion} />
                ))}
            </div>

            {/* Satchel Display Section */}
            <SatchelDisplay />
        </div>
    );
}

// Simulate initial load and execution (Calling the main component)
App();
```