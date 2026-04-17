let recipes = {};
// Starting elements updated with emojis
let discovered = ['💧 Water', '🔥 Fire', '🪨 Earth', '💨 Air'];
let zIndexCounter = 10;

const workspace = document.getElementById('workspace');
const inventory = document.getElementById('inventory');

// 1. Load the recipes
fetch('recipes.json')
    .then(response => response.json())
    .then(data => {
        recipes = data;
        renderSidebar();
    })
    .catch(error => console.error("Error loading recipes:", error));

// 2. Render Sidebar
function renderSidebar() {
    inventory.innerHTML = '';
    discovered.forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        
        // Tapping a sidebar item spawns it into the workspace
        el.onclick = () => spawnInWorkspace(item);
        inventory.appendChild(el);
    });
}

// 3. Spawn item in the center of the workspace
function spawnInWorkspace(itemName) {
    const el = document.createElement('div');
    el.className = 'element in-workspace';
    el.textContent = itemName;
    
    // Add some randomness so multiple clicks don't stack perfectly on top of each other
    const randomOffsetX = Math.floor(Math.random() * 40) - 20;
    const randomOffsetY = Math.floor(Math.random() * 40) - 20;
    
    // Position in the center of the workspace area
    const workspaceRect = workspace.getBoundingClientRect();
    el.style.left = (workspaceRect.width / 2) - 40 + randomOffsetX + 'px';
    el.style.top = (workspaceRect.height / 2) - 20 + randomOffsetY + 'px';
    
    workspace.appendChild(el);
    
    // Setup universal pointer events for dragging (works for mouse AND touch)
    el.onpointerdown = (ev) => startDrag(ev, el);
}

// 4. Handle Dragging Logic for workspace items
function startDrag(e, el) {
    e.preventDefault(); // Stop mobile scrolling behaviors
    
    el.style.zIndex = ++zIndexCounter;

    // Calculate where inside the element the user clicked/touched
    let rect = el.getBoundingClientRect();
    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    function moveAt(pageX, pageY) {
        el.style.left = pageX - shiftX + 'px';
        el.style.top = pageY - shiftY + 'px';
    }

    function onPointerMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    // Attach to document so dragging works even if cursor moves off the element
    document.addEventListener('pointermove', onPointerMove);

    // 5. Handle Dropping / Releasing
    function onPointerUp() {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        checkCollision(el);
    }
    
    document.addEventListener('pointerup', onPointerUp);
}

// 6. Check for overlaps
function checkCollision(draggedEl) {
    const rect1 = draggedEl.getBoundingClientRect();
    const workspaceElements = document.querySelectorAll('#workspace .element');

    for (let targetEl of workspaceElements) {
        if (targetEl === draggedEl) continue;

        const rect2 = targetEl.getBoundingClientRect();

        // Standard bounding box collision check
        if (!(rect1.right < rect2.left || 
              rect1.left > rect2.right || 
              rect1.bottom < rect2.top || 
              rect1.top > rect2.bottom)) {
            
            attemptCombine(draggedEl, targetEl);
            return; 
        }
    }
}

// 7. Combine them
function attemptCombine(el1, el2) {
    const item1 = el1.textContent;
    const item2 = el2.textContent;

    const combo1 = `${item1}+${item2}`;
    const combo2 = `${item2}+${item1}`;

    const result = recipes[combo1] || recipes[combo2];

    if (result) {
        // Remove old pieces
        el1.remove();
        el2.remove();

        // Create new combined piece
        const newEl = document.createElement('div');
        newEl.className = 'element in-workspace';
        newEl.textContent = result;
        newEl.style.left = el2.style.left; 
        newEl.style.top = el2.style.top;
        newEl.style.zIndex = ++zIndexCounter;
        newEl.onpointerdown = (ev) => startDrag(ev, newEl);
        
        workspace.appendChild(newEl);

        // Add to inventory if new
        if (!discovered.includes(result)) {
            discovered.push(result);
            renderSidebar();
        }
    }
}
