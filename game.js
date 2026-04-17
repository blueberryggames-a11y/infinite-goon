let recipes = {};
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let zIndexCounter = 100;

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');
const clearBtn = document.getElementById('clear-btn');

// 1. DATA LOADING & SAVING
async function init() {
    // Load local save
    const saved = localStorage.getItem('infinite_craft_save');
    if (saved) {
        discovered = JSON.parse(saved);
    }

    renderSidebar();

    try {
        const res = await fetch('recipes.json');
        if (res.ok) {
            recipes = await res.json();
            console.log("Recipes loaded: " + Object.keys(recipes).length);
        }
    } catch (e) {
        console.error("Could not load recipes.json. Make sure you are using a local server.");
    }
}

// 2. RENDER SIDEBAR (Alphabetical)
function renderSidebar() {
    inventory.innerHTML = '';
    // Sort items so user can find them easily in 2500+ list
    [...new Set(discovered)].sort((a, b) => a.localeCompare(b)).forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        el.onpointerdown = (e) => {
            e.preventDefault();
            spawnInWorkspace(item);
        };
        inventory.appendChild(el);
    });
}

// 3. SPAWN ELEMENT
function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    const rect = workspace.getBoundingClientRect();
    // Spawn near center with slight random offset
    const off = () => (Math.random() - 0.5) * 100;
    el.style.left = (rect.width / 2) + off() - 40 + 'px';
    el.style.top = (rect.height / 2) + off() - 20 + 'px';
    
    workspace.appendChild(el);
    el.onpointerdown = (e) => startDrag(e, el);
}

// 4. DRAG LOGIC (Pointer Events for iPad/PC)
function startDrag(e, el) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = ++zIndexCounter;

    const workspaceRect = workspace.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
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

// 5. COLLISION & COMBINE
function checkCollision(draggedEl) {
    const r1 = draggedEl.getBoundingClientRect();
    const items = document.querySelectorAll('.in-workspace');

    for (let target of items) {
        if (target === draggedEl) continue;
        const r2 = target.getBoundingClientRect();

        const overlap = !(r1.right < r2.left || r1.left > r2.right || 
                          r1.bottom < r2.top || r1.top > r2.bottom);

        if (overlap) {
            const a = draggedEl.textContent;
            const b = target.textContent;
            const result = recipes[`${a}+${b}`] || recipes[`${b}+${a}`];

            if (result) {
                const finalX = target.style.left;
                const finalY = target.style.top;

                draggedEl.remove();
                target.remove();

                const newEl = document.createElement('div');
                newEl.className = 'element in-workspace';
                newEl.textContent = result;
                newEl.style.left = finalX;
                newEl.style.top = finalY;
                newEl.style.zIndex = ++zIndexCounter;
                newEl.onpointerdown = (e) => startDrag(e, newEl);
                workspace.appendChild(newEl);

                // Add to discovered and save
                if (!discovered.includes(result)) {
                    discovered.push(result);
                    localStorage.setItem('infinite_craft_save', JSON.stringify(discovered));
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

init();
