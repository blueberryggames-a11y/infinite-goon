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
        renderElements();
    });

function save() {
    localStorage.setItem("craft_discovered", JSON.stringify(discovered));
}

function renderElements(filter = "") {
    elementsDiv.innerHTML = "";
    discovered
        .filter(e => e.toLowerCase().includes(filter.toLowerCase()))
        .sort()
        .forEach(name => {
            const div = document.createElement("div");
            div.className = "element";
            div.textContent = name;
            div.onclick = () => createBlock(name, 350, 200);
            elementsDiv.appendChild(div);
        });
}

search.addEventListener("input", e => renderElements(e.target.value));

function createBlock(name, x, y) {
    const block = document.createElement("div");
    block.className = "block";
    block.textContent = name;
    block.dataset.name = name;
    block.style.left = x + "px";
    block.style.top = y + "px";

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    block.addEventListener("mousedown", e => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    document.addEventListener("mousemove", e => {
        if (!dragging) return;

        const rect = workspace.getBoundingClientRect();
        block.style.left = e.clientX - rect.left - offsetX + "px";
        block.style.top = e.clientY - rect.top - offsetY + "px";

        checkCombine(block);
    });

    document.addEventListener("mouseup", () => {
        dragging = false;
    });

    workspace.appendChild(block);
}

function checkCombine(active) {
    const blocks = [...document.querySelectorAll(".block")];

    for (let other of blocks) {
        if (other === active) continue;

        const r1 = active.getBoundingClientRect();
        const r2 = other.getBoundingClientRect();

        const touching = !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
        );

        if (!touching) continue;

        const a = active.dataset.name;
        const b = other.dataset.name;
        const result = recipes[a + "+" + b];

        if (result) {
            const x = (parseInt(active.style.left) + parseInt(other.style.left)) / 2;
            const y = (parseInt(active.style.top) + parseInt(other.style.top)) / 2;

            active.remove();
            other.remove();

            createBlock(result, x, y);

            if (!discovered.includes(result)) {
                discovered.push(result);
                save();
                renderElements(search.value);
                showToast("New element: " + result);
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
