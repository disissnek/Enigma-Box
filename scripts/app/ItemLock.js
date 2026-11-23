import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class ItemLock extends BasePuzzleLock {
    static get APP_ID() { return "item-lock"; }

    static get formConfiguration() {
        const inputs = [
            { name: "slotCount", label: "Количество слотов (1-5)", type: "number", value: 3, min: 1, max: 5 }
        ];
        for (let i = 0; i < 5; i++) {
            inputs.push({ name: `item${i}`, label: `Слот ${i + 1}: Название нужного предмета`, type: "text", value: "" });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.slotCount, 10) || 3;

        if (!config.state || !Array.isArray(config.state.items) || config.state.items.length !== count) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.items = Array.from({ length: count }, () => null);
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.slots = config.state.items.map((item, i) => ({
            id: i,
            item
        }));
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".enigma-slot").forEach(slot => {
            slot.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            slot.addEventListener("drop", async (e) => {
                e.preventDefault();
                const id = parseInt(e.currentTarget.dataset.id, 10);
                let dropData;
                try {
                    dropData = JSON.parse(e.dataTransfer.getData("text/plain"));
                } catch (err) {
                    return;
                }
                if (!dropData || dropData.type !== "Item") return;

                let itemDoc = null;
                if (typeof Item?.implementation?.fromDropData === "function") {
                    itemDoc = await Item.implementation.fromDropData(dropData);
                }
                if (!itemDoc && dropData.uuid) {
                    itemDoc = await fromUuid(dropData.uuid);
                }
                if (!itemDoc) return;

                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (!config.state) config.state = {};
                if (!Array.isArray(config.state.items)) config.state.items = [];
                config.state.items[id] = { name: itemDoc.name, img: itemDoc.img };

                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePutDown.wav", volume: 0.7, autoplay: true }, true);
                } catch (err) {}

                await this.document.setFlag(MODULE_ID, "config", config);
                this.render(false);
                this._checkUnlock(config);
            });

            slot.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (config.state?.items?.[id]) {
                    config.state.items[id] = null;
                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePickUp.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}
                    await this.document.setFlag(MODULE_ID, "config", config);
                    this.render(false);
                }
            });
        });
    }

    async _checkUnlock(config) {
        const count = parseInt(config.slotCount, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const expected = (config[`item${i}`] || "").trim().toLowerCase();
            const placed = (config.state.items[i]?.name || "").trim().toLowerCase();
            if (!expected || placed !== expected) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}