import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class StatueRotator extends BasePuzzleLock {
    static get APP_ID() { return "statue-rotator"; }

    static get formConfiguration() {
        const defaults = ["war", "bard", "hood", "war", "bard"];
        const inputs = [
            { name: "statueCount", label: "Количество статуй (1-5)", type: "number", value: 3, min: 1, max: 5 },
            { name: "turnSound", label: "Звук поворота статуи", type: "audiopicker", value: "modules/enigma-box/sounds/statuedvizh.mp3" }
        ];

        for (let i = 0; i < 5; i++) {
            const base = defaults[i];
            inputs.push({ name: `statue-${i}-0`, label: `Статуя ${i + 1}: 0 - Спереди (top)`, type: "filepicker", value: `modules/enigma-box/img/${base}top.png` });
            inputs.push({ name: `statue-${i}-1`, label: `Статуя ${i + 1}: 1 - Справа (right)`, type: "filepicker", value: `modules/enigma-box/img/${base}right.png` });
            inputs.push({ name: `statue-${i}-2`, label: `Статуя ${i + 1}: 2 - Сзади (back)`, type: "filepicker", value: `modules/enigma-box/img/${base}back.png` });
            inputs.push({ name: `statue-${i}-3`, label: `Статуя ${i + 1}: 3 - Слева (left)`, type: "filepicker", value: `modules/enigma-box/img/${base}left.png` });
            inputs.push({ name: `statue-${i}-sol`, label: `Статуя ${i + 1}: Решение (0-top, 1-right, 2-back, 3-left)`, type: "number", value: 0, min: 0, max: 3 });
        }

        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.statueCount, 10) || 3;

        const isValidState = Array.isArray(config.state?.statues)
            && config.state.statues.length === count
            && config.state.statues.every(v => Number.isInteger(v) && v >= 0 && v <= 3);

        if (!isValidState) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.statues = Array.from({ length: count }, () => Math.floor(Math.random() * 4));
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        const defaults = ["war", "bard", "hood", "war", "bard"];
        const suffixes = ["top", "right", "back", "left"];

        data.statues = config.state.statues.map((dir, i) => {
            const safeDir = (Number.isInteger(dir) && dir >= 0 && dir <= 3) ? dir : 0;
            const fallback = `modules/enigma-box/img/${defaults[i % 5]}${suffixes[safeDir]}.png`;
            const savedImg = (config[`statue-${i}-${safeDir}`] || "").trim();
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
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (!config.state) config.state = {};
                if (!Array.isArray(config.state.statues)) config.state.statues = [];

                const curDir = Number.isInteger(config.state.statues[id]) ? config.state.statues[id] : 0;
                const nextDir = (curDir + 1) % 4;
                config.state.statues[id] = nextDir;

                const defaults = ["war", "bard", "hood", "war", "bard"];
                const suffixes = ["top", "right", "back", "left"];
                const fallback = `modules/enigma-box/img/${defaults[id % 5]}${suffixes[nextDir]}.png`;
                const savedImg = (config[`statue-${id}-${nextDir}`] || "").trim();
                const nextImg = savedImg || fallback;

                e.currentTarget.style.backgroundImage = `url('${nextImg}')`;
                const soundSrc = (config.turnSound || "modules/enigma-box/sounds/statuedvizh.mp3").trim();
                try {
                    foundry.audio.AudioHelper.play({ src: soundSrc, volume: 0.7, autoplay: true }, true);
                } catch (err) {}

                await this.document.setFlag(MODULE_ID, "config", config);
                this._checkUnlock(config);
            });
        });
    }

    async _checkUnlock(config) {
        const count = parseInt(config.statueCount, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const sol = parseInt(config[`statue-${i}-sol`], 10) || 0;
            const cur = Number.isInteger(config.state.statues[i]) ? config.state.statues[i] : 0;
            if ((cur % 4) !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}