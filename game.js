let recipes = {};
let discovered = JSON.parse(localStorage.getItem("craft_discovered")) || [
    "💧 Water",
    "🔥 Fire",
    "🌍 Earth",
    "💨 Wind"
];

const elementsDiv = document.getElementById("elements");
const workspace = document.getElementById("workspace");
const search = document.getElementById("search");
const toast = document.getElementById("toast");

fetch("recipes.json")
    .then(r => r.json())
    .then(data => {
        recipes = data;
        renderSidebar();
    });

function saveGame() {
    localStorage.setItem("craft_discovered", JSON.stringify(discovered));
}

function renderSidebar(filter = "") {
    elementsDiv.innerHTML = "";

    discovered
        .filter(e => e.toLowerCase().includes(filter.toLowerCase()))
        .sort()
        .forEach(name => {
            const div = document.createElement("div");
            div.className = "element";
            div.textContent = name;

            div.addEventListener("mousedown", e => {
                createWorkspaceBlock(
                    name,
                    e.clientX,
                    e.clientY
                );
            });

            elementsDiv.appendChild(div);
        });
}

search.addEventListener("input", e => {
    renderSidebar(e.target.value);
});

function createWorkspaceBlock(name, mouseX, mouseY) {
    const rect = workspace.getBoundingClientRect();

    const block = document.createElement("div");
    block.className = "block";
    block.textContent = name;
    block.dataset.name = name;

    block.style.left = (mouseX - rect.left - 50) + "px";
    block.style.top = (mouseY - rect.top - 20) + "px";

    workspace.appendChild(block);

    enableDragging(block, true);
}

function enableDragging(block, startDragging = false) {
    let dragging = startDragging;
    let offsetX = 40;
    let offsetY = 20;

    block.addEventListener("mousedown", e => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    function move(e) {
        if (!dragging) return;

        const rect = workspace.getBoundingClientRect();

        block.style.left = (e.clientX - rect.left - offsetX) + "px";
        block.style.top = (e.clientY - rect.top - offsetY) + "px";

        checkCombine(block);
    }

    function stop() {
        dragging = false;
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
}

function checkCombine(active) {
    const blocks = [...document.querySelectorAll(".block")];

    for (const other of blocks) {
        if (other === active) continue;

        const r1 = active.getBoundingClientRect();
        const r2 = other.getBoundingClientRect();

        const overlap = !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
        );

        if (!overlap) continue;

        const key = active.dataset.name + "+" + other.dataset.name;
        const result = recipes[key];

        if (result) {
            const x = (parseInt(active.style.left) + parseInt(other.style.left)) / 2;
            const y = (parseInt(active.style.top) + parseInt(other.style.top)) / 2;

            active.remove();
            other.remove();

            const newBlock = document.createElement("div");
            newBlock.className = "block";
            newBlock.textContent = result;
            newBlock.dataset.name = result;
            newBlock.style.left = x + "px";
            newBlock.style.top = y + "px";

            workspace.appendChild(newBlock);
            enableDragging(newBlock);

            if (!discovered.includes(result)) {
                discovered.push(result);
                saveGame();
                renderSidebar(search.value);
                showToast("Discovered " + result);
            }

            break;
        }
    }
}

function showToast(text) {
    toast.textContent = text;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 2000);
}
