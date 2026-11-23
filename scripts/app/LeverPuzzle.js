import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class LeverPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "lever-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "leverCount", label: "Количество рычагов (2-6)", type: "number", value: 4, min: 2, max: 6 },
            { name: "positions", label: "Положений на рычаг (2-5)", type: "number", value: 3, min: 2, max: 5 },
            { name: "handleImg", label: "Картинка рукоятки", type: "filepicker", value: "modules/enigma-box/img/richg.svg" }
        ];
        for (let i = 0; i < 6; i++) {
            inputs.push({ name: `lever${i}_sol`, label: `Рычаг ${i + 1}: Решение (сверху вниз, от 0)`, type: "number", value: 0, min: 0, max: 4 });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.leverCount, 10) || 4;
        const posCount = parseInt(config.positions, 10) || 3;

        if (!config.state || !Array.isArray(config.state.levers) || config.state.levers.length !== count) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.levers = Array.from({ length: count }, () => 0);
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        const savedHandle = (config.handleImg || "").trim();
        data.handleImg = (!savedHandle || savedHandle === "icons/svg/lever.svg")
            ? "modules/enigma-box/img/richag.svg"
            : savedHandle;

        data.ticks = Array.from({ length: posCount }, (_, idx) => ({
            top: posCount > 1 ? 10 + (idx / (posCount - 1)) * 80 : 50
        }));

        data.levers = config.state.levers.map((pos, i) => {
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
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                const posCount = parseInt(config.positions, 10) || 3;

                config.state.levers[id] = ((config.state.levers[id] || 0) + 1) % posCount;
                const newPos = config.state.levers[id];
                const top = posCount > 1 ? 10 + (newPos / (posCount - 1)) * 80 : 50;

                const handle = e.currentTarget.querySelector(".lever-handle");
                if (handle) handle.style.top = `${top}%`;

                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/Metal_Move01.wav", volume: 0.7, autoplay: true }, true);
                } catch (err) {}

                await this.document.setFlag(MODULE_ID, "config", config);
                this._checkUnlock(config);
            });
        });
    }

    async _checkUnlock(config) {
        const count = parseInt(config.leverCount, 10) || 4;
        const posCount = parseInt(config.positions, 10) || 3;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const sol = parseInt(config[`lever${i}_sol`], 10) || 0;
            if ((config.state.levers[i] % posCount) !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}