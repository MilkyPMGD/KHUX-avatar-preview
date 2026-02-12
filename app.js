const baseURL = "https://roboloid.github.io/khux/assets/";
const workspace = document.getElementById("workspace");
const categoriesDiv = document.getElementById("categories");

let layers = {};

const categories = {
    body: "avatar_body_",
    hair: "avatar_hair_",
    top: "avatar_top_",
    bottom: "avatar_bottom_"
};

const MIN = 1;
const MAX = 200;

function pad(num) {
    return num.toString().padStart(3, "0");
}

/* FAST PARALLEL SCAN */
function scanCategory(name, prefix) {
    const container = document.createElement("div");
    container.className = "category";
    container.innerHTML = `<h3>${name.toUpperCase()}</h3>`;
    categoriesDiv.appendChild(container);

    const promises = [];

    for (let i = MIN; i <= MAX; i++) {
        const file = prefix + pad(i) + ".png";
        const url = baseURL + file;

        promises.push(
            new Promise(resolve => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    const thumb = document.createElement("img");
                    thumb.src = url;
                    thumb.className = "thumb";
                    thumb.onclick = () => equipItem(name, url);
                    container.appendChild(thumb);
                    resolve();
                };
                img.onerror = () => resolve();
            })
        );
    }

    return Promise.all(promises);
}

function equipItem(category, url) {
    if (!layers[category]) {
        const img = document.createElement("img");
        img.className = "avatar-layer";
        makeDraggable(img);
        workspace.appendChild(img);
        layers[category] = img;
    }
    layers[category].src = url;
}

function makeDraggable(el) {
    let offsetX, offsetY, dragging = false;

    el.onmousedown = e => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        el.style.cursor = "grabbing";
    };

    document.onmousemove = e => {
        if (!dragging) return;
        el.style.left = e.pageX - offsetX + "px";
        el.style.top = e.pageY - offsetY + "px";
        el.style.transform = "none";
    };

    document.onmouseup = () => {
        dragging = false;
        el.style.cursor = "grab";
    };
}

/* Reset */
function resetPositions() {
    Object.values(layers).forEach(layer => {
        layer.style.left = "50%";
        layer.style.top = "50%";
        layer.style.transform = "translate(-50%, -50%)";
    });
}

/* Export PNG */
function exportPNG() {
    const canvas = document.createElement("canvas");
    canvas.width = workspace.clientWidth;
    canvas.height = workspace.clientHeight;
    const ctx = canvas.getContext("2d");

    const promises = Object.values(layers).map(layer => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = layer.src;
            img.onload = () => {
                ctx.drawImage(img, layer.offsetLeft, layer.offsetTop, layer.width, layer.height);
                resolve();
            };
        });
    });

    Promise.all(promises).then(() => {
        const link = document.createElement("a");
        link.download = "khux_avatar.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

/* Save / Load */
function saveBuild() {
    const data = {};
    for (const key in layers) {
        data[key] = {
            src: layers[key].src,
            left: layers[key].style.left,
            top: layers[key].style.top,
            transform: layers[key].style.transform
        };
    }

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "khux_build.json";
    link.click();
}

function loadBuild() {
    const loader = document.getElementById("fileLoader");
    loader.click();
    loader.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const data = JSON.parse(reader.result);
            for (const key in data) {
                equipItem(key, data[key].src);
                layers[key].style.left = data[key].left;
                layers[key].style.top = data[key].top;
                layers[key].style.transform = data[key].transform;
            }
        };
        reader.readAsText(file);
    };
}

/* Initialize */
async function init() {
    for (const name in categories) {
        await scanCategory(name, categories[name]);
    }
}
init();
