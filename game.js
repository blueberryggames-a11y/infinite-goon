let recipes = {};
let discovered = ['Water', 'Fire', 'Earth', 'Air'];
let zIndexCounter = 10;

const workspace = document.getElementById('workspace');
const sidebar = document.getElementById('sidebar');

// 1. Load the recipes from JSON
fetch('recipes.json')
    .then(response => response.json())
    .then(data => {
        recipes = data;
        renderSidebar();
    })
    .catch(error => console.error("Error loading recipes:", error));

// 2. Render the sidebar inventory
function renderSidebar() {
    sidebar.innerHTML = '';
    discovered.forEach(item => {
        const el = document.createElement('div');
        el.className = 'element';
        el.textContent = item;
        
        // When clicking a sidebar item, create a clone in the workspace
        el.onmousedown = (e) => startDrag(e, item, true);
        sidebar.appendChild(el);
    });
}

// 3. Handle Dragging Logic
function startDrag(e, itemName, isFromSidebar) {
    e.preventDefault();
    let el;

    if (isFromSidebar) {
        // Create a new element in the workspace
        el = document.createElement('div');
        el.className = 'element in-workspace';
        el.textContent = itemName;
        workspace.appendChild(el);
        
        // Setup future drags for this specific workspace element
        el.onmousedown = (ev) => startDrag(ev, itemName, false);
    } else {
        // We are clicking an element already in the workspace
        el = e.target;
    }

    // Bring element to front
    el.style.zIndex = ++zIndexCounter;

    // Calculate offset so the mouse grabs the element exactly where clicked
    let rect = el.getBoundingClientRect();
    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    // Initial position set
    moveAt(e.pageX, e.pageY);

    function moveAt(pageX, pageY) {
        el.style.left = pageX - shiftX + 'px';
        el.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    // Attach mousemove to document so it tracks even if mouse moves fast
    document.addEventListener('mousemove', onMouseMove);

    // 4. Handle Dropping and Collision Detection
    el.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        el.onmouseup = null;
        checkCollision(el);
    };
}

// 5. Check if dropped on another element
function checkCollision(draggedEl) {
    const rect1 = draggedEl.getBoundingClientRect();
    const workspaceElements = document.querySelectorAll('#workspace .element');

    for (let targetEl of workspaceElements) {
        if (targetEl === draggedEl) continue; // Skip self

        const rect2 = targetEl.getBoundingClientRect();

        // Check for intersection (AABB Collision)
        if (!(rect1.right < rect2.left || 
              rect1.left > rect2.right || 
              rect1.bottom < rect2.top || 
              rect1.top > rect2.bottom)) {
            
            attemptCombine(draggedEl, targetEl);
            return; // Stop checking after first collision
        }
    }
}

// 6. Combine elements if a recipe exists
function attemptCombine(el1, el2) {
    const item1 = el1.textContent;
    const item2 = el2.textContent;

    // Check both combinations A+B and B+A
    const combo1 = `${item1}+${item2}`;
    const combo2 = `${item2}+${item1}`;

    const result = recipes[combo1] || recipes[combo2];

    if (result) {
        // Destroy old elements
        el1.remove();
        el2.remove();

        // Create new combined element
        const newEl = document.createElement('div');
        newEl.className = 'element in-workspace';
        newEl.textContent = result;
        newEl.style.left = el2.style.left; 
        newEl.style.top = el2.style.top;
        newEl.style.zIndex = ++zIndexCounter;
        newEl.onmousedown = (ev) => startDrag(ev, result, false);
        
        workspace.appendChild(newEl);

        // Add to sidebar if not discovered yet
        if (!discovered.includes(result)) {
            discovered.push(result);
            renderSidebar();
        }
    }
}
