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
        const config = this.document.getFlag("enigma-box", "config") || {};
        return config.customTitle || `Загадка: ${this.document.name || "Секретный замок"}`;
    }

    get unlockSound() {
        return "modules/enigma-box/sounds/Unlock02.ogg";
    }

    async getData() {
        const config = this.document.getFlag("enigma-box", "config") || {};
        return { docName: config.customTitle || this.document.name || "Тайна" };
    }

    async onUnlock() {
        try {
            foundry.audio.AudioHelper.play({ src: this.unlockSound, volume: 0.8, autoplay: true }, true);
        } catch (e) {}
        ui.notifications.success("Загадка решена!");

        const config = this.document.getFlag("enigma-box", "config") || {};
        if (game.user.isGM) {
            try {
                config.isActive = false;
                await this.document.setFlag("enigma-box", "config", config);
            } catch (e) {}
        } else {
            this.document.enigmaSolved = true;
        }

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
        this.close();
    }
}