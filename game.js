let recipes = {};
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let zIndexCounter = 100;

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');
const clearBtn = document.getElementById('clear-btn');

// 1. DATA SAVING LOGIC
function saveProgress() {
    localStorage.setItem('infinite_craft_discovered', JSON.stringify(discovered));
}

function loadProgress() {
    const saved = localStorage.getItem('infinite_craft_discovered');
    if (saved) {
        discovered = JSON.parse(saved);
    }
}

// 2. INITIALIZE
async function init() {
    loadProgress(); // Load saved items before rendering
    renderSidebar();

    try {
        const res = await fetch('recipes.json');
        if (res.ok) {
            recipes = await res.json();
        }
    } catch (e) {
        console.error("Failed to load recipes. Check if running on a server.");
    }
}

// 3. RENDER SIDEBAR
function renderSidebar() {
    inventory.innerHTML = '';
    // Sort items alphabetically to make finding them easier
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

// 4. SPAWN LOGIC
function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    const rect = workspace.getBoundingClientRect();
    const offset = () => (Math.random() - 0.5) * 80;

    el.style.left = (rect.width / 2) + offset() - 40 + 'px';
    el.style.top = (rect.height / 2) + offset() - 20 + 'px';
    
    workspace.appendChild(el);
    el.onpointerdown = (e) => startDrag(e, el);
}

// 5. DRAG LOGIC (Works on iPad/Mobile/Desktop)
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

// 6. COLLISION & COMBINATION
function checkCollision(draggedEl) {
    const r1 = draggedEl.getBoundingClientRect();
    const items = document.querySelectorAll('.in-workspace');

    for (let target of items) {
        if (target === draggedEl) continue;
        const r2 = target.getBoundingClientRect();

        const isOverlapping = !(r1.right < r2.left || r1.left > r2.right || 
                                r1.bottom < r2.top || r1.top > r2.bottom);

        if (isOverlapping) {
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

                // Add to list and SAVE if new
                if (!discovered.includes(result)) {
                    discovered.push(result);
                    saveProgress(); // Update LocalStorage
                    renderSidebar();
                }
            }
            return;
        }
    }
}

// 7. CLEAR BUTTON
clearBtn.onclick = () => {
    document.querySelectorAll('.in-workspace').forEach(el => el.remove());
};

// Add a "Force Reset" function you can call from the console if you want to wipe progress
window.resetGame = () => {
    localStorage.removeItem('infinite_craft_discovered');
    location.reload();
};

init();
