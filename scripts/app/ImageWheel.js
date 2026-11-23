import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class ImageWheel extends BasePuzzleLock {
    static get APP_ID() { return "image-wheel"; }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "wheelImg", label: "Картинка Фрески", type: "filepicker", value: "icons/svg/sun.svg" },
                { name: "bgImg", label: "Фон под фреской", type: "filepicker", value: "ui/parchment.jpg" },
                { name: "sol1", label: "Решение: Внешний круг (0-11)", type: "number", value: 0, min: 0, max: 11 },
                { name: "sol2", label: "Решение: Средний круг (0-11)", type: "number", value: 0, min: 0, max: 11 },
                { name: "sol3", label: "Решение: Внутренний круг (0-11)", type: "number", value: 0, min: 0, max: 11 }
            ]
        };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";

        const state = this.getPuzzleState();
        if (!Array.isArray(state.wheel)) {
            state.wheel = [0, 0, 0];
            await this.savePuzzleState(state);
        }

        data.bgImg = this.normalizeAssetPath(config.bgImg || "");
        data.wheelImg = this.normalizeAssetPath(config.wheelImg || "");

        data.rings = [
            { id: 0, class: "outer", rot: state.wheel[0] * 30, z: 10 },
            { id: 1, class: "mid", rot: state.wheel[1] * 30, z: 11 },
            { id: 2, class: "inner", rot: state.wheel[2] * 30, z: 12 }
        ];
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html.find(".enigma-wheel-container")[0];
        if (!container) return;

        container.addEventListener("click", async (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const dist = Math.sqrt(x * x + y * y);
            const radius = rect.width / 2;

            let ringId = -1;
            if (dist < radius * 0.3) ringId = 2;
            else if (dist < radius * 0.6) ringId = 1;
            else if (dist <= radius) ringId = 0;

            if (ringId !== -1) {
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!Array.isArray(state.wheel)) state.wheel = [0, 0, 0];
                state.wheel[ringId] += 1;

                const ringEl = container.querySelector(`.enigma-ring[data-id="${ringId}"]`);
                if (ringEl) ringEl.style.transform = `rotate(${state.wheel[ringId] * 30}deg)`;

                this.playSound("modules/enigma-box/sounds/statuedvizh.mp3", 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            }
        });
    }

    async _checkUnlock(config, state) {
        const s1 = (parseInt(config.sol1, 10) || 0) % 12;
        const s2 = (parseInt(config.sol2, 10) || 0) % 12;
        const s3 = (parseInt(config.sol3, 10) || 0) % 12;
        if ((state.wheel[0] % 12) === s1 &&
            (state.wheel[1] % 12) === s2 &&
            (state.wheel[2] % 12) === s3) {
            await this.onUnlock();
        }
    }
}