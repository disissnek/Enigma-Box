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

let customTranslations = null;

function getByPath(obj, path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function formatTemplate(str, data = {}) {
    return String(str).replace(/\{(\w+)\}/g, (_, k) => (data[k] !== undefined ? data[k] : `{${k}}`));
}

export function enigmaLocalize(key, data = null) {
    let raw = customTranslations ? getByPath(customTranslations, key) : undefined;
    if (raw === undefined) {
        raw = data ? game.i18n.format(key, data) : game.i18n.localize(key);
        return raw;
    }
    return data ? formatTemplate(raw, data) : raw;
}

async function loadLocaleDictionary(langCode) {
    if (!langCode || langCode === "auto") {
        customTranslations = null;
        return;
    }
    try {
        const res = await fetch(`modules/${MODULE_ID}/lang/${langCode}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        customTranslations = await res.json();
    } catch (err) {
        console.error(`Enigma Box | Не удалось загрузить словарь lang/${langCode}.json:`, err);
        customTranslations = null;
    }
}

function refreshMattRegistry() {
    const matt = game.MonksActiveTiles;
    if (!matt?.triggerGroups || !matt?.triggerActions) return;
    matt.triggerGroups["enigmabox"] = { name: enigmaLocalize("ENIGMA.MattGroup") };
    if (matt.triggerActions["enigmabox.openpuzzle"]) {
        matt.triggerActions["enigmabox.openpuzzle"].name = enigmaLocalize("ENIGMA.MattActionName");
        matt.triggerActions["enigmabox.openpuzzle"].content = async function () {
            return `<span class="action-style">${enigmaLocalize("ENIGMA.MattActionLabel")}</span>`;
        };
    }
}

function getPuzzleConfig(doc) {
    if (!doc?.getFlag) return null;
    return doc.getFlag(MODULE_ID, "config");
}

function resolveSceneDocument(sceneId, docName, docId) {
    const scene = game.scenes.get(sceneId) || canvas.scene;
    if (!scene) return null;
    if (docName === "Wall") return scene.walls.get(docId) || null;
    if (docName === "Tile") return scene.tiles.get(docId) || null;
    if (docName === "Token") return scene.tokens.get(docId) || null;
    return null;
}

async function applyUnlockAsGM(data) {
    const doc = resolveSceneDocument(data.sceneId, data.docName, data.docId);
    if (!doc) return;

    doc.enigmaSolved = true;
    const config = foundry.utils.deepClone(doc.getFlag(MODULE_ID, "config") || {});
    config.isActive = false;

    try {
        await doc.setFlag(MODULE_ID, "config", config);
    } catch (err) {
        console.error("Enigma Box | Ошибка обновления флага разблокировки:", err);
    }

    if (data.mattActionId && typeof doc.resumeActions === "function") {
        doc.resumeActions(data.mattActionId, { continue: true });
    } else if (doc.documentName === "Wall") {
        try {
            await doc.update({ ds: CONST.WALL_DOOR_STATES.OPEN });
        } catch (err) {
            console.error("Enigma Box | Ошибка открытия двери:", err);
        }
    }

    if (config.successTileId) {
        const scene = game.scenes.get(data.sceneId) || canvas.scene;
        const targetTile = scene?.tiles.get(config.successTileId);
        if (targetTile && typeof targetTile.document?.trigger === "function") {
            targetTile.document.trigger({ tokens: [], userId: data.senderId || game.user.id, method: "manual" });
        }
    }
}

async function processPendingUnlocks() {
    const storageKey = `enigma-box-pending-${game.world.id}`;
    let pending = [];
    try {
        pending = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (e) {
        pending = [];
    }
    if (!Array.isArray(pending) || pending.length === 0) return;

    localStorage.removeItem(storageKey);
    for (const item of pending) {
        await applyUnlockAsGM(item);
    }
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
        ui.notifications.warn(`Enigma Box: Unknown puzzle type "${config.type}"`);
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
    matt.triggerGroups["enigmabox"] = { name: enigmaLocalize("ENIGMA.MattGroup") };
    matt.triggerActions["enigmabox.openpuzzle"] = {
        name: enigmaLocalize("ENIGMA.MattActionName"),
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
            return `<span class="action-style">${enigmaLocalize("ENIGMA.MattActionLabel")}</span>`;
        }
    };
}

function syncDocumentFlagUpdate(doc, changed) {
    if (!changed?.flags?.[MODULE_ID]) return;
    delete doc._enigmaLocalState;
    const cfg = doc.getFlag(MODULE_ID, "config");
    if (cfg?.isActive) doc.enigmaSolved = false;
}

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "language", {
        name: game.i18n.localize("ENIGMA.SettingLanguageName"),
        hint: game.i18n.localize("ENIGMA.SettingLanguageHint"),
        scope: "world",
        config: true,
        type: String,
        choices: {
            auto: "ENIGMA.LangAuto",
            ru: "ENIGMA.LangRu",
            en: "ENIGMA.LangEn"
        },
        default: "auto",
        onChange: async (value) => {
            await loadLocaleDictionary(value);
            refreshMattRegistry();
        }
    });
});

Hooks.on("setupTileActions", (matt) => injectMattAction(matt));
Hooks.on("updateWall", syncDocumentFlagUpdate);
Hooks.on("updateTile", syncDocumentFlagUpdate);
Hooks.on("updateToken", syncDocumentFlagUpdate);

Hooks.once("ready", async () => {
    const selectedLang = game.settings.get(MODULE_ID, "language");
    await loadLocaleDictionary(selectedLang);

    const module = game.modules.get(MODULE_ID);
    if (module) module.api = { open: openPuzzle, localize: enigmaLocalize };

    if (game.MonksActiveTiles) {
        if (!game.MonksActiveTiles.triggerActions["enigmabox.openpuzzle"]) {
            injectMattAction(game.MonksActiveTiles);
        } else {
            refreshMattRegistry();
        }
    }

    if (game.user.isGM && game.users.activeGM?.id === game.user.id) {
        await processPendingUnlocks();
    }

    if (game.socket) {
        game.socket.on(`module.${MODULE_ID}`, async (data) => {
            if (!data || !data.docId) return;
            const doc = resolveSceneDocument(data.sceneId, data.docName, data.docId);
            if (!doc) return;

            const isDesignatedGM = game.user.isGM && game.users.activeGM?.id === game.user.id;

            if (data.action === "saveState") {
                doc._enigmaLocalState = foundry.utils.deepClone(data.state);
                if (data.senderId !== game.user.id) {
                    Object.values(ui.windows).forEach(win => {
                        if (win.document?.id === doc.id && typeof win.render === "function") {
                            win.render(false);
                        }
                    });
                }
                if (isDesignatedGM) {
                    const config = foundry.utils.deepClone(doc.getFlag(MODULE_ID, "config") || {});
                    config.state = foundry.utils.deepClone(data.state);
                    try {
                        await doc.setFlag(MODULE_ID, "config", config);
                    } catch (err) {
                        console.error("Enigma Box | Ошибка сохранения состояния от игрока:", err);
                    }
                }
            } else if (data.action === "unlock") {
                doc.enigmaSolved = true;
                Object.values(ui.windows).forEach(win => {
                    if (win.document?.id === doc.id && typeof win.close === "function") {
                        win.close();
                    }
                });

                if (isDesignatedGM) {
                    await applyUnlockAsGM(data);
                }
            }
        });
    }

    if (!game.modules.get("lib-wrapper")?.active) return;

    try {
        libWrapper.register(MODULE_ID, "foundry.canvas.containers.DoorControl.prototype._onMouseDown", function (wrapped, ...args) {
            const event = args[0];
            if (game.user.isGM && game.keyboard.isModifierActive("Alt")) return wrapped(...args);

            const config = getPuzzleConfig(this.wall.document);
            if (event?.button === 0 && this.wall.document.ds === CONST.WALL_DOOR_STATES.LOCKED && config?.isActive && !this.wall.document.enigmaSolved) {
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
        label: enigmaLocalize("ENIGMA.ConfigButton"),
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
    const label = enigmaLocalize("ENIGMA.ConfigButton");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "header-control icon fas fa-puzzle-piece enigma-box-header-btn";
    btn.title = label;
    btn.setAttribute("data-tooltip", label);
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
    const label = enigmaLocalize("ENIGMA.ConfigButton");
    const btn = document.createElement("div");
    btn.className = `control-icon enigma-box-hud-btn ${config?.isActive ? "active" : ""}`;
    btn.title = label;
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