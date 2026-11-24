import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class LeverPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "lever-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "leverCount", label: enigmaLocalize("ENIGMA.LeverPuzzle.LeverCount"), type: "number", value: 4, min: 2, max: 6 },
            { name: "positions", label: enigmaLocalize("ENIGMA.LeverPuzzle.Positions"), type: "number", value: 3, min: 2, max: 5 },
            { name: "handleImg", label: enigmaLocalize("ENIGMA.LeverPuzzle.HandleImg"), type: "filepicker", value: "modules/enigma-box/img/richag.svg" }
        ];
        for (let i = 0; i < 6; i++) {
            inputs.push({
                name: `lever${i}_sol`,
                label: enigmaLocalize("ENIGMA.LeverPuzzle.Sol", { num: i + 1 }),
                type: "number",
                value: 0,
                min: 0,
                max: 4
            });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.leverCount, 10) || 4;
        const posCount = parseInt(config.positions, 10) || 3;

        const state = this.getPuzzleState();
        if (!Array.isArray(state.levers) || state.levers.length !== count) {
            state.levers = Array.from({ length: count }, () => 0);
            await this.savePuzzleState(state);
        }

        const savedHandle = this.normalizeAssetPath(config.handleImg || "");
        data.handleImg = (!savedHandle || savedHandle === "icons/svg/lever.svg" || savedHandle.endsWith("/richg.svg"))
            ? "modules/enigma-box/img/richag.svg"
            : savedHandle;

        data.ticks = Array.from({ length: posCount }, (_, idx) => ({
            top: posCount > 1 ? 10 + (idx / (posCount - 1)) * 80 : 50
        }));

        data.levers = state.levers.map((pos, i) => {
            const safePos = (Number.isInteger(pos) ? pos : 0) % posCount;
            const top = posCount > 1 ? 10 + (safePos / (posCount - 1)) * 80 : 50;
            return { id: i, top };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".lever-click-area").forEach(area => {
            area.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const posCount = parseInt(config.positions, 10) || 3;
                const state = this.getPuzzleState();
                if (!Array.isArray(state.levers)) state.levers = [];

                state.levers[id] = ((state.levers[id] || 0) + 1) % posCount;
                const newPos = state.levers[id];
                const top = posCount > 1 ? 10 + (newPos / (posCount - 1)) * 80 : 50;

                const handle = e.currentTarget.querySelector(".lever-handle");
                if (handle) handle.style.top = `${top}%`;

                this.playSound("modules/enigma-box/sounds/metal_move01.wav", 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            });
        });
    }

    async _checkUnlock(config, state) {
        const count = parseInt(config.leverCount, 10) || 4;
        const posCount = parseInt(config.positions, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const sol = parseInt(config[`lever${i}_sol`], 10) || 0;
            if (((state.levers?.[i] || 0) % posCount) !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}