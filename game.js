let recipes = {};
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let zIndexCounter = 100;

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');
const clearBtn = document.getElementById('clear-btn');

// 1. Initial Load
async function init() {
    try {
        const res = await fetch('recipes.json');
        if (res.ok) {
            recipes = await res.json();
        }
    } catch (e) {
        console.warn("Recipes JSON not found, using base items only.");
    }
    renderSidebar();
}

// 2. Refresh Sidebar Items
function renderSidebar() {
    inventory.innerHTML = '';
    discovered.forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        
        // Mobile-friendly click to spawn
        el.onpointerdown = (e) => {
            e.preventDefault();
            spawnInWorkspace(item);
        };
        inventory.appendChild(el);
    });
}

// 3. Spawn item in Workspace
function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    // Position in the visible center of the workspace
    const rect = workspace.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offset = () => (Math.random() - 0.5) * 60; // Spread items out slightly

    el.style.left = `${centerX + offset() - 40}px`;
    el.style.top = `${centerY + offset() - 20}px`;
    
    workspace.appendChild(el);
    
    // Bind Dragging
    el.onpointerdown = (e) => startDrag(e, el);
}

// 4. Drag Logic (Pointer Events work for Mouse & iPad Touch)
function startDrag(e, el) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = ++zIndexCounter;

    const rect = el.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    
    const shiftX = e.clientX - rect.left;
    const shiftY = e.clientY - rect.top;

    function moveAt(clientX, clientY) {
        // Keeps element within the workspace boundaries
        let x = clientX - workspaceRect.left - shiftX;
        let y = clientY - workspaceRect.top - shiftY;
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    }

    function onPointerMove(ev) {
        moveAt(ev.clientX, ev.clientY);
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

// 5. Combination Logic
function checkCollision(draggedEl) {
    const r1 = draggedEl.getBoundingClientRect();
    const items = document.querySelectorAll('.in-workspace');

    for (let target of items) {
        if (target === draggedEl) continue;
        const r2 = target.getBoundingClientRect();

        // Check if the two blocks overlap
        const isOverlapping = !(r1.right < r2.left || r1.left > r2.right || 
                                r1.bottom < r2.top || r1.top > r2.bottom);

        if (isOverlapping) {
            const result = recipes[`${draggedEl.textContent}+${target.textContent}`] || 
                           recipes[`${target.textContent}+${draggedEl.textContent}`];

            if (result) {
                // Keep the location of the stationary item
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

                // Add to sidebar if it's a new discovery
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

init();
