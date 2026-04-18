```agni
// --- Shared State ---
// Define the master list of available cargo items and their masses.
let AVAILABLE_CARGO = [
  { name: "Ore Crystal", mass: 15.2 },
  { name: "Fusion Cell", mass: 88.5 },
  { name: "Bio-Module", mass: 22.0 },
  { name: "Power Conduit", mass: 5.0 }
]

// Shared state for the cargo hold contents.
// Structure: [{ name: string, mass: number, quantity: number }]
let CARGO_HOLD = []

// --- Components ---

// 1. Cargo Catalog Screen
// Allows the user to select an item to add to the hold.
component CargoCatalog() {
  // Function to handle adding/incrementing an item in the hold.
  let addItemToHold(item: { name: string, mass: number }) {
    let existingItemIndex = CARGO_HOLD.findIndex(itemInHold => itemInHold.name === item.name);

    if (existingItemIndex !== -1) {
      // Item exists, increment quantity.
      let currentItem = CARGO_HOLD[existingItemIndex]
      CARGO_HOLD.set(existingItemIndex, {
        name: currentItem.name,
        mass: currentItem.mass,
        quantity: currentItem.quantity + 1
      })
    } else {
      // Item is new, add it to the hold.
      CARGO_HOLD.push({
        name: item.name,
        mass: item.mass,
        quantity: 1
      })
    }
    console.log(`Added ${item.name} to the hold. Current count: ${CARGO_HOLD.length} unique items.`);
  }

  render() {
    return [
      "## Cargo Manifest ##",
      "Select an item to add to the cargo hold:",
      "<button onClick={() => addItemToHold(AVAILABLE_CARGO[0])}>Add Ore Crystal (15.2 mass)</button>",
      "<button onClick={() => addItemToHold(AVAILABLE_CARGO[1])}>Add Fusion Cell (88.5 mass)</button>",
      "<button onClick={() => addItemToHold(AVAILABLE_CARGO[2])}>Add Bio-Module (22.0 mass)</button>",
      "<button onClick={() => addItemToHold(AVAILABLE_CARGO[3])}>Add Power Conduit (5.0 mass)</button>",
      "<br>",
      "<button onClick={() => navigateTo('Inventory')}>View Inventory</button>"
    ]
  }
}

// 2. Inventory Screen
// Displays the current contents and total mass.
component Inventory() {
  let totalMass = CARGO_HOLD.reduce((acc, item) => acc + (item.mass * item.quantity), 0);

  render() {
    let inventoryList = CARGO_HOLD.map(item => 
      `${item.name} (${item.mass} mass/unit) x ${item.quantity}`
    ).join("<br>");

    return [
      "## Cargo Hold Inventory ##",
      `Total Unique Items: ${CARGO_HOLD.length}`,
      `Total Mass Capacity Used: ${totalMass.toFixed(2)} units`,
      "<hr>",
      "**Contents:**",
      inventoryList || "The hold is empty. Please load cargo.",
      "<br>",
      "<button onClick={() => navigateTo('Catalog')}>&larr; Back to Catalog</button>"
    ]
  }
}

// --- Router/Main Application Logic ---

// Simple state-based routing simulation
let currentView = 'Catalog';

const navigateTo = (view: string) => {
  currentView = view;
  renderApp();
};

const renderApp = () => {
  const views = {
    'Catalog': CargoCatalog(),
    'Inventory': Inventory()
  };
  
  console.log("\n--- Rendering View: " + currentView + " ---");
  console.log(views[currentView].render());
}

// Initialize the application view
renderApp();
```