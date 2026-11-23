const MODULE_ID = "enigma-box";

const PUZZLE_REGISTRY = {
    "item-lock": { file: "ItemLock.js", className: "ItemLock" },
    "image-wheel": { file: "ImageWheel.js", className: "ImageWheel" },
    "statue-rotator": { file: "StatueRotator.js", className: "StatueRotator" },
    "clock-puzzle": { file: "ClockPuzzle.js", className: "ClockPuzzle" },
    "lever-puzzle": { file: "LeverPuzzle.js", className: "LeverPuzzle" },
    "match-puzzle": { file: "MatchPuzzle.js", className: "MatchPuzzle" },
    "music-puzzle": { file: "MusicPuzzle.js", className: "MusicPuzzle" },
    "cryptex-puzzle": { file: "CryptexPuzzle.js", className: "CryptexPuzzle" },
    "timeline-puzzle": { file: "TimelinePuzzle.js", className: "TimelinePuzzle" },
    "password-puzzle": { file: "PasswordPuzzle.js", className: "PasswordPuzzle" },
    "text-password": { file: "TextPasswordPuzzle.js", className: "TextPasswordPuzzle" },
    "mirror-puzzle": { file: "MirrorPuzzle.js", className: "MirrorPuzzle" }
};

function getPuzzleConfig(doc) {
    if (!doc?.getFlag) return null;
    return doc.getFlag(MODULE_ID, "config");
}

async function openConfig(doc) {
    if (!doc) return;
    try {
        const { EnigmaConfig } = await import("./app/EnigmaConfig.js");
        new EnigmaConfig(doc).render(true);
    } catch (err) {
        console.error("Enigma Box | Ошибка загрузки EnigmaConfig.js:", err);
        ui.notifications.error("Enigma Box: Ошибка в файле EnigmaConfig.js. Подробности в консоли (F12).");
    }
}

async function openPuzzle(document, mattActionId = null) {
    if (!document) return false;
    const config = document.getFlag(MODULE_ID, "config");
    if (!config || !config.isActive) return false;

    const entry = PUZZLE_REGISTRY[config.type];
    if (!entry) {
        ui.notifications.warn(`Enigma Box: Неизвестный тип загадки "${config.type}"`);
        return false;
    }

    try {
        const mod = await import(`./app/${entry.file}`);
        const PuzzleClass = mod[entry.className];
        if (!PuzzleClass) {
            throw new Error(`Класс ${entry.className} не найден внутри ${entry.file}`);
        }
        const puzzle = new PuzzleClass(document);
        puzzle.mattActionId = mattActionId;
        puzzle.render(true);
        return true;
    } catch (err) {
        console.error(`Enigma Box | Ошибка загрузки ${entry.file}:`, err);
        ui.notifications.error(`Enigma Box: Не удалось открыть ${entry.file}. Проверь консоль (F12).`);
        return false;
    }
}

function injectMattAction(matt) {
    if (!matt) return;
    matt.triggerGroups["enigmabox"] = { name: "Enigma Box" };
    matt.triggerActions["enigmabox.openpuzzle"] = {
        name: "Запустить загадку",
        group: "enigmabox",
        ctrls: [],
        fn: async function (args = {}) {
            const tile = args.tile || this;
            if (!tile) return { continue: true };

            const config = getPuzzleConfig(tile);
            if (config && config.isActive && !tile.enigmaSolved) {
                const opened = await openPuzzle(tile, args._id);
                if (opened) return { pause: true };
            }
            return { continue: true };
        },
        content: async function () {
            return `<span class="action-style">Запустить загадку (Enigma Box)</span>`;
        }
    };
}

Hooks.on("setupTileActions", (matt) => injectMattAction(matt));

Hooks.once("ready", () => {
    const module = game.modules.get(MODULE_ID);
    if (module) module.api = { open: openPuzzle };

    if (game.MonksActiveTiles && !game.MonksActiveTiles.triggerActions["enigmabox.openpuzzle"]) {
        injectMattAction(game.MonksActiveTiles);
    }

    if (!game.modules.get("lib-wrapper")?.active) return;

    try {
        libWrapper.register(MODULE_ID, "foundry.canvas.containers.DoorControl.prototype._onMouseDown", function (wrapped, ...args) {
            const event = args[0];
            if (game.user.isGM && game.keyboard.isModifierActive("Alt")) return wrapped(...args);

            const config = getPuzzleConfig(this.wall.document);
            if (event?.button === 0 && this.wall.document.ds === CONST.WALL_DOOR_STATES.LOCKED && config?.isActive) {
                openPuzzle(this.wall.document);
                if (event.stopPropagation) event.stopPropagation();
                return;
            }
            return wrapped(...args);
        }, "MIXED");

        const tokenHandler = function (wrapped, ...args) {
            const event = args[0];
            if (game.user.isGM && game.keyboard.isModifierActive("Alt")) return wrapped(...args);

            const config = getPuzzleConfig(this.document);
            if (config?.isActive && !this.document.enigmaSolved) {
                openPuzzle(this.document);
                if (event && event.stopPropagation) event.stopPropagation();
                return;
            }
            return wrapped(...args);
        };

        libWrapper.register(MODULE_ID, "foundry.canvas.placeables.Token.prototype._onClickLeft2", tokenHandler, "MIXED");
        libWrapper.register(MODULE_ID, "foundry.canvas.placeables.Token.prototype._onClickRight2", tokenHandler, "MIXED");
    } catch (err) {
        console.error("Enigma Box | Ошибка регистрации libWrapper:", err);
    }
});

function injectConfigButtonV1(app, buttons) {
    if (!game.user.isGM) return;
    const doc = app.document ?? app.object ?? app.actor;
    if (!doc) return;
    const config = getPuzzleConfig(doc);
    buttons.unshift({
        class: config?.isActive ? "enigma-box-locked" : "enigma-box",
        icon: "fas fa-puzzle-piece",
        label: "Enigma Box",
        onclick: () => openConfig(doc)
    });
}

function injectConfigButtonV2(app, element) {
    if (!game.user.isGM) return;
    const doc = app.document;
    if (!doc || !["Tile", "Wall", "Token"].includes(doc.documentName)) return;

    const header = element.querySelector(".window-header");
    if (!header || header.querySelector(".enigma-box-header-btn")) return;

    const config = getPuzzleConfig(doc);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "header-control icon fas fa-puzzle-piece enigma-box-header-btn";
    btn.title = "Enigma Box";
    btn.setAttribute("data-tooltip", "Enigma Box");
    if (config?.isActive) btn.style.color = "gold";

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openConfig(doc);
    });

    const closeBtn = header.querySelector('[data-action="close"]');
    if (closeBtn) header.insertBefore(btn, closeBtn);
    else header.appendChild(btn);
}

function injectHUDButton(hud, html) {
    if (!game.user.isGM) return;
    const doc = hud.object?.document;
    if (!doc) return;

    const root = html instanceof HTMLElement ? html : html[0];
    const colLeft = root?.querySelector(".col.left");
    if (!colLeft || colLeft.querySelector(".enigma-box-hud-btn")) return;

    const config = getPuzzleConfig(doc);
    const btn = document.createElement("div");
    btn.className = `control-icon enigma-box-hud-btn ${config?.isActive ? "active" : ""}`;
    btn.title = "Enigma Box";
    btn.innerHTML = `<i class="fas fa-puzzle-piece" ${config?.isActive ? 'style="color: gold;"' : ""}></i>`;

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openConfig(doc);
    });

    colLeft.appendChild(btn);
}

["Tile", "Wall", "Token"].forEach(type => {
    Hooks.on(`get${type}ConfigHeaderButtons`, injectConfigButtonV1);
    Hooks.on(`render${type}HUD`, injectHUDButton);
});
Hooks.on("renderApplicationV2", injectConfigButtonV2);