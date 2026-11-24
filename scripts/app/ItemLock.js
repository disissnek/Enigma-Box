import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class ItemLock extends BasePuzzleLock {
    static get APP_ID() { return "item-lock"; }

    static get formConfiguration() {
        const inputs = [
            { name: "slotCount", label: enigmaLocalize("ENIGMA.ItemLock.SlotCount"), type: "number", value: 3, min: 1, max: 5 }
        ];
        for (let i = 0; i < 5; i++) {
            inputs.push({
                name: `item${i}`,
                label: enigmaLocalize("ENIGMA.ItemLock.ItemLabel", { num: i + 1 }),
                type: "text",
                value: ""
            });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.emptySlotTitle = enigmaLocalize("ENIGMA.ItemLock.SlotEmptyTitle");
        const count = parseInt(config.slotCount, 10) || 3;

        const state = this.getPuzzleState();
        if (!Array.isArray(state.items) || state.items.length !== count) {
            state.items = Array.from({ length: count }, () => null);
            await this.savePuzzleState(state);
        }

        data.slots = state.items.map((item, i) => ({
            id: i,
            item: item ? {
                ...item,
                img: this.normalizeAssetPath(item.img),
                title: enigmaLocalize("ENIGMA.ItemLock.SlotOccupiedTitle", { name: item.name })
            } : null
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

                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!Array.isArray(state.items)) state.items = [];
                state.items[id] = { name: itemDoc.name, img: this.normalizeAssetPath(itemDoc.img) };

                this.playSound("modules/enigma-box/sounds/tileputdown.wav", 0.7);

                await this.savePuzzleState(state);
                this.render(false);
                this._checkUnlock(config, state);
            });

            slot.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const state = this.getPuzzleState();
                if (state.items?.[id]) {
                    state.items[id] = null;
                    this.playSound("modules/enigma-box/sounds/tilepickup.wav", 0.7);
                    await this.savePuzzleState(state);
                    this.render(false);
                }
            });
        });
    }

    async _checkUnlock(config, state) {
        const count = parseInt(config.slotCount, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const expected = (config[`item${i}`] || "").trim().toLowerCase();
            const placed = (state.items?.[i]?.name || "").trim().toLowerCase();
            if (!expected || placed !== expected) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}