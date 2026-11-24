import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class BasePuzzleLock extends Application {
    constructor(document) {
        super();
        this.document = document;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["enigma-box-window"],
            width: 500,
            height: "auto",
            resizable: false
        });
    }

    get template() {
        const id = this.constructor.APP_ID || "item-lock";
        return `modules/enigma-box/templates/${id}.hbs`;
    }

    get title() {
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        return config.customTitle || enigmaLocalize("ENIGMA.DefaultWindowTitle", { name: this.document.name || enigmaLocalize("ENIGMA.DefaultPuzzleHeader") });
    }

    get unlockSound() {
        return "modules/enigma-box/sounds/unlock02.ogg";
    }

    normalizeAssetPath(path) {
        if (typeof path !== "string") return path;
        const trimmed = path.trim();
        if (/^modules\/enigma-box\/(img|sounds)\//i.test(trimmed)) {
            return trimmed.toLowerCase();
        }
        return trimmed;
    }

    playSound(src, volume = 0.7) {
        const normalized = this.normalizeAssetPath(src);
        if (!normalized) return;
        try {
            foundry.audio.AudioHelper.play({ src: normalized, volume, autoplay: true }, true);
        } catch (err) {}
    }

    getPuzzleState() {
        if (this.document._enigmaLocalState) {
            return foundry.utils.deepClone(this.document._enigmaLocalState);
        }
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        return foundry.utils.deepClone(config.state || {});
    }

    async savePuzzleState(newState) {
        const clonedState = foundry.utils.deepClone(newState);
        this.document._enigmaLocalState = clonedState;

        if (game.user.isGM) {
            const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
            config.state = clonedState;
            await this.document.setFlag(MODULE_ID, "config", config);
        } else if (game.socket) {
            game.socket.emit(`module.${MODULE_ID}`, {
                action: "saveState",
                senderId: game.user.id,
                sceneId: this.document.parent?.id || canvas.scene?.id,
                docName: this.document.documentName,
                docId: this.document.id,
                state: clonedState
            });
        }
    }

    queuePendingUnlock(payload) {
        const storageKey = `enigma-box-pending-${game.world.id}`;
        try {
            const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
            const filtered = Array.isArray(existing)
                ? existing.filter(item => !(item.docName === payload.docName && item.docId === payload.docId))
                : [];
            filtered.push(payload);
            localStorage.setItem(storageKey, JSON.stringify(filtered));
        } catch (e) {}
    }

    async getData() {
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        return { docName: config.customTitle || this.document.name || enigmaLocalize("ENIGMA.DefaultPuzzleHeader") };
    }

    async onUnlock() {
        this.playSound(this.unlockSound, 0.8);
        ui.notifications.success(enigmaLocalize("ENIGMA.UnlockSuccess"));

        const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
        this.document.enigmaSolved = true;

        if (game.user.isGM) {
            try {
                config.isActive = false;
                await this.document.setFlag(MODULE_ID, "config", config);
            } catch (e) {}

            if (this.mattActionId && typeof this.document.resumeActions === "function") {
                this.document.resumeActions(this.mattActionId, { continue: true });
            } else if (this.document.documentName === "Wall") {
                try {
                    await this.document.update({ ds: CONST.WALL_DOOR_STATES.OPEN });
                } catch (e) {}
            } else if (this.document.documentName === "Token") {
                if (this.document.actor && this.document.actor.sheet) this.document.actor.sheet.render(true);
            }

            if (config.successTileId) {
                const targetTile = canvas.tiles.get(config.successTileId);
                if (targetTile && typeof targetTile.document.trigger === "function") {
                    targetTile.document.trigger({ tokens: [], userId: game.user.id, method: "manual" });
                }
            }
        } else {
            if (this.document.documentName === "Token") {
                if (this.document.actor && this.document.actor.sheet) this.document.actor.sheet.render(true);
            }

            const payload = {
                action: "unlock",
                senderId: game.user.id,
                sceneId: this.document.parent?.id || canvas.scene?.id,
                docName: this.document.documentName,
                docId: this.document.id,
                mattActionId: this.mattActionId || null
            };

            if (game.users.activeGM && game.socket) {
                game.socket.emit(`module.${MODULE_ID}`, payload);
            } else {
                this.queuePendingUnlock(payload);
                ui.notifications.info(enigmaLocalize("ENIGMA.OfflineGMNotice"));
            }
        }

        this.close();
    }
}