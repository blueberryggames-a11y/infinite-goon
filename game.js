let recipes = {};
let discovered = JSON.parse(localStorage.getItem("discovered")) || [
    "💧 Water",
    "🔥 Fire",
    "🌍 Earth",
    "💨 Wind"
];

const inventory = document.getElementById("inventory");
const workspace = document.getElementById("workspace");
const search = document.getElementById("search");
const notification = document.getElementById("notification");

fetch("recipes.json")
    .then(res => res.json())
    .then(data => {
        recipes = data;
        renderInventory();
    });

function saveGame() {
    localStorage.setItem("discovered", JSON.stringify(discovered));
}

function renderInventory(filter = "") {
    inventory.innerHTML = "";
    discovered
        .filter(item => item.toLowerCase().includes(filter.toLowerCase()))
        .sort()
        .forEach(name => {
            const div = document.createElement("div");
            div.className = "element";
            div.textContent = name;
            div.onclick = () => spawn(name);
            inventory.appendChild(div);
        });
}

search.addEventListener("input", e => {
    renderInventory(e.target.value);
});

function spawn(name) {
    const el = document.createElement("div");
    el.className = "floating";
    el.textContent = name;
    el.dataset.name = name;

    el.style.left = Math.random() * 500 + 50 + "px";
    el.style.top = Math.random() * 400 + 50 + "px";

    let offsetX, offsetY, dragging = false;

    el.addEventListener("mousedown", e => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    document.addEventListener("mousemove", e => {
        if (!dragging) return;
        const rect = workspace.getBoundingClientRect();
        el.style.left = e.clientX - rect.left - offsetX + "px";
        el.style.top = e.clientY - rect.top - offsetY + "px";
        checkCombine(el);
    });

    document.addEventListener("mouseup", () => dragging = false);

    workspace.appendChild(el);
}

function checkCombine(active) {
    const all = [...document.querySelectorAll(".floating")];

    for (const other of all) {
        if (active === other) continue;

        const r1 = active.getBoundingClientRect();
        const r2 = other.getBoundingClientRect();

        const overlap = !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
        );

        if (overlap) {
            const key = active.dataset.name + "+" + other.dataset.name;
            const result = recipes[key];

            if (result) {
                active.remove();
                other.remove();
                spawn(result);

                if (!discovered.includes(result)) {
                    discovered.push(result);
                    saveGame();
                    renderInventory(search.value);
                    notify("Discovered " + result);
                }
            }
        }
    }
}

function notify(text) {
    notification.textContent = text;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, 2000);
}
