let recipes = {};
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let zIndexCounter = 100;

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');
const clearBtn = document.getElementById('clear-btn');

// Load database
fetch('recipes.json')
    .then(res => res.json())
    .then(data => {
        recipes = data;
        renderSidebar();
    });

function renderSidebar() {
    inventory.innerHTML = '';
    // Sort discovered items alphabetically for better UX
    discovered.sort().forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        // On click, spawn a copy in the workspace
        el.onpointerdown = (e) => {
            e.preventDefault();
            spawnInWorkspace(item);
        };
        inventory.appendChild(el);
    });
}

function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    // Spawn near center with a bit of random offset
    const rect = workspace.getBoundingClientRect();
    const offX = (Math.random() - 0.5) * 100;
    const offY = (Math.random() - 0.5) * 100;
    
    el.style.left = (rect.width / 2) + offX + 'px';
    el.style.top = (rect.height / 2) + offY + 'px';
    
    workspace.appendChild(el);
    
    // Attach dragging to the new element
    el.onpointerdown = (e) => startDrag(e, el);
}

function startDrag(e, el) {
    e.preventDefault();
    el.setPointerCapture(e.pointerId); // Crucial for mobile dragging
    el.style.zIndex = ++zIndexCounter;

    const rect = el.getBoundingClientRect();
    const shiftX = e.clientX - rect.left;
    const shiftY = e.clientY - rect.top;

    function onPointerMove(ev) {
        const x = ev.clientX - shiftX;
        const y = ev.clientY - shiftY;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    }

    function onPointerUp() {
        el.releasePointerCapture(e.pointerId);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        checkCollision(el);
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function checkCollision(draggedEl) {
    const r1 = draggedEl.getBoundingClientRect();
    const items = document.querySelectorAll('.in-workspace');

    for (let target of items) {
        if (target === draggedEl) continue;
        const r2 = target.getBoundingClientRect();

        // Overlap detection
        if (!(r1.right < r2.left || r1.left > r2.right || 
              r1.bottom < r2.top || r1.top > r2.bottom)) {
            combine(draggedEl, target);
            return;
        }
    }
}

function combine(el1, el2) {
    const itemA = el1.textContent;
    const itemB = el2.textContent;

    const result = recipes[`${itemA}+${itemB}`] || recipes[`${itemB}+${itemA}`];

    if (result) {
        const finalX = el2.style.left;
        const finalY = el2.style.top;
        
        el1.remove();
        el2.remove();

        const newEl = document.createElement('div');
        newEl.className = 'element in-workspace';
        newEl.textContent = result;
        newEl.style.left = finalX;
        newEl.style.top = finalY;
        newEl.style.zIndex = ++zIndexCounter;
        newEl.onpointerdown = (e) => startDrag(e, newEl);
        
        workspace.appendChild(newEl);

        if (!discovered.includes(result)) {
            discovered.push(result);
            renderSidebar();
        }
    }
}

clearBtn.onclick = () => {
    const items = document.querySelectorAll('.in-workspace');
    items.forEach(i => i.remove());
};
