import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class StatueRotator extends BasePuzzleLock {
    static get APP_ID() { return "statue-rotator"; }

    static get formConfiguration() {
        const defaults = ["war", "bard", "hood", "war", "bard"];
        const inputs = [
            { name: "statueCount", label: enigmaLocalize("ENIGMA.StatueRotator.StatueCount"), type: "number", value: 3, min: 1, max: 5 },
            { name: "turnSound", label: enigmaLocalize("ENIGMA.StatueRotator.TurnSound"), type: "audiopicker", value: "modules/enigma-box/sounds/statuedvizh.mp3" }
        ];

        for (let i = 0; i < 5; i++) {
            const base = defaults[i];
            const num = i + 1;
            inputs.push({ name: `statue-${i}-0`, label: enigmaLocalize("ENIGMA.StatueRotator.Side0", { num }), type: "filepicker", value: `modules/enigma-box/img/${base}top.png` });
            inputs.push({ name: `statue-${i}-1`, label: enigmaLocalize("ENIGMA.StatueRotator.Side1", { num }), type: "filepicker", value: `modules/enigma-box/img/${base}right.png` });
            inputs.push({ name: `statue-${i}-2`, label: enigmaLocalize("ENIGMA.StatueRotator.Side2", { num }), type: "filepicker", value: `modules/enigma-box/img/${base}back.png` });
            inputs.push({ name: `statue-${i}-3`, label: enigmaLocalize("ENIGMA.StatueRotator.Side3", { num }), type: "filepicker", value: `modules/enigma-box/img/${base}left.png` });
            inputs.push({ name: `statue-${i}-sol`, label: enigmaLocalize("ENIGMA.StatueRotator.Sol", { num }), type: "number", value: 0, min: 0, max: 3 });
        }

        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.statueCount, 10) || 3;

        const state = this.getPuzzleState();
        const isValidState = Array.isArray(state.statues)
            && state.statues.length === count
            && state.statues.every(v => Number.isInteger(v) && v >= 0 && v <= 3);

        if (!isValidState) {
            state.statues = Array.from({ length: count }, () => Math.floor(Math.random() * 4));
            await this.savePuzzleState(state);
        }

        const defaults = ["war", "bard", "hood", "war", "bard"];
        const suffixes = ["top", "right", "back", "left"];

        data.statues = state.statues.map((dir, i) => {
            const safeDir = (Number.isInteger(dir) && dir >= 0 && dir <= 3) ? dir : 0;
            const fallback = `modules/enigma-box/img/${defaults[i % 5]}${suffixes[safeDir]}.png`;
            const savedImg = this.normalizeAssetPath(config[`statue-${i}-${safeDir}`] || "");
            return {
                id: i,
                img: savedImg || fallback
            };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".enigma-statue").forEach(statue => {
            statue.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!Array.isArray(state.statues)) state.statues = [];

                const curDir = Number.isInteger(state.statues[id]) ? state.statues[id] : 0;
                const nextDir = (curDir + 1) % 4;
                state.statues[id] = nextDir;

                const defaults = ["war", "bard", "hood", "war", "bard"];
                const suffixes = ["top", "right", "back", "left"];
                const fallback = `modules/enigma-box/img/${defaults[id % 5]}${suffixes[nextDir]}.png`;
                const savedImg = this.normalizeAssetPath(config[`statue-${id}-${nextDir}`] || "");
                const nextImg = savedImg || fallback;

                e.currentTarget.style.backgroundImage = `url('${nextImg}')`;
                const soundSrc = this.normalizeAssetPath(config.turnSound || "") || "modules/enigma-box/sounds/statuedvizh.mp3";
                this.playSound(soundSrc, 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            });
        });
    }

    async _checkUnlock(config, state) {
        const count = parseInt(config.statueCount, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const sol = parseInt(config[`statue-${i}-sol`], 10) || 0;
            const cur = Number.isInteger(state.statues?.[i]) ? state.statues[i] : 0;
            if ((cur % 4) !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}