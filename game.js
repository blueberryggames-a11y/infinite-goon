// 1. Setup initial state
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let recipes = {};
let zIndexCounter = 100;

// Hardcoded backup recipes in case recipes.json fails to load
const backupRecipes = {
    "💧 Water+💧 Water": "🌊 Lake",
    "🔥 Fire+💧 Water": "💨 Steam",
    "🪨 Earth+💧 Water": "🌱 Plant",
    "🪨 Earth+🔥 Fire": "🌋 Lava"
};

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');
const clearBtn = document.getElementById('clear-btn');

// 2. Initialize Game
async function init() {
    console.log("Game Initializing...");
    
    // IMMEDIATELY render starting blocks so they aren't stuck waiting for a file
    renderSidebar();

    try {
        const res = await fetch('recipes.json');
        if (res.ok) {
            const data = await res.json();
            recipes = data;
            console.log("Recipes loaded from JSON.");
        } else {
            throw new Error("JSON file not found");
        }
    } catch (e) {
        console.warn("Could not load recipes.json (Expected if not using a local server). Using backups.");
        recipes = backupRecipes;
    }
}

// 3. Render Sidebar
function renderSidebar() {
    if (!inventory) return console.error("Inventory div not found!");
    
    inventory.innerHTML = '';
    // Use a Set to ensure no duplicates, then sort
    [...new Set(discovered)].sort().forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        
        // Use pointerdown for instant response on iPad
        el.onpointerdown = (e) => {
            e.preventDefault();
            spawnInWorkspace(item);
        };
        inventory.appendChild(el);
    });
}

// 4. Spawn in Workspace
function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    const rect = workspace.getBoundingClientRect();
    const offset = () => (Math.random() - 0.5) * 50;

    el.style.left = (rect.width / 2) + offset() - 40 + 'px';
    el.style.top = (rect.height / 2) + offset() - 20 + 'px';
    
    workspace.appendChild(el);
    el.onpointerdown = (e) => startDrag(e, el);
}

// 5. Drag Logic
function startDrag(e, el) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = ++zIndexCounter;

    const rect = el.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    const shiftX = e.clientX - rect.left;
    const shiftY = e.clientY - rect.top;

    function onPointerMove(ev) {
        let x = ev.clientX - workspaceRect.left - shiftX;
        let y = ev.clientY - workspaceRect.top - shiftY;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    }

    function onPointerUp(ev) {
        el.releasePointerCapture(ev.pointerId);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        checkCollision(el);
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

// 6. Combination Logic
function checkCollision(draggedEl) {
    const r1 = draggedEl.getBoundingClientRect();
    const items = document.querySelectorAll('.in-workspace');

    for (let target of items) {
        if (target === draggedEl) continue;
        const r2 = target.getBoundingClientRect();

        const overlap = !(r1.right < r2.left || r1.left > r2.right || 
                          r1.bottom < r2.top || r1.top > r2.bottom);

        if (overlap) {
            const itemA = draggedEl.textContent;
            const itemB = target.textContent;
            const result = recipes[`${itemA}+${itemB}`] || recipes[`${itemB}+${itemA}`];

            if (result) {
                const spawnX = target.style.left;
                const spawnY = target.style.top;

                draggedEl.remove();
                target.remove();

                const newEl = document.createElement('div');
                newEl.className = 'element in-workspace';
                newEl.textContent = result;
                newEl.style.left = spawnX;
                newEl.style.top = spawnY;
                newEl.style.zIndex = ++zIndexCounter;
                newEl.onpointerdown = (e) => startDrag(e, newEl);
                
                workspace.appendChild(newEl);

                if (!discovered.includes(result)) {
                    discovered.push(result);
                    renderSidebar();
                }
            }
            return;
        }
    }
}

clearBtn.onclick = () => {
    document.querySelectorAll('.in-workspace').forEach(el => el.remove());
};

// Run the init
init();
