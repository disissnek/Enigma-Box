import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class CryptexPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "cryptex-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/lock_small02.wav";
    }

    static get formConfiguration() {
        const inputs = [
            { name: "symCount", label: "Кол-во цилиндров (1-6)", type: "number", value: 4, min: 1, max: 6 },
            { name: "bracketImg", label: "Рамка (Края)", type: "filepicker", value: "modules/enigma-box/img/kraicill.png" },
            { name: "bgImg", label: "Фон под цилиндры", type: "filepicker", value: "modules/enigma-box/img/cilindrifon.png" },
            { name: "turnSound", label: "Звук проворота цилиндра", type: "audiopicker", value: "modules/enigma-box/sounds/statuedvizh.mp3" }
        ];

        for (let i = 0; i < 6; i++) {
            inputs.push({ name: `cyl${i}_vals`, label: `Цилиндр ${i + 1}: Значения (буквы или пути к .png/.svg через запятую)`, type: "text", value: "А,Б,В,Г,Д" });
            inputs.push({ name: `cyl${i}_sol`, label: `Цилиндр ${i + 1}: Решение`, type: "text", value: "А" });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.bracketImg = this.normalizeAssetPath(config.bracketImg || "") || "modules/enigma-box/img/kraicill.png";
        data.bgImg = this.normalizeAssetPath(config.bgImg || "") || "modules/enigma-box/img/cilindrifon.png";

        const count = parseInt(config.symCount, 10) || 4;

        const state = this.getPuzzleState();
        if (!Array.isArray(state.cryptex) || state.cryptex.length !== count) {
            state.cryptex = Array.from({ length: count }, () => 0);
            await this.savePuzzleState(state);
        }

        data.cylinders = state.cryptex.map((val, i) => {
            const vals = (config[`cyl${i}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
            const safeVal = Number.isInteger(val) ? val : 0;
            const rawSymbol = vals[safeVal % vals.length];
            const isImg = rawSymbol.includes("/") || rawSymbol.includes(".");
            const symbol = isImg ? this.normalizeAssetPath(rawSymbol) : rawSymbol;
            return { id: i, symbol, isImg };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".cryptex-cyl").forEach(cyl => {
            cyl.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!Array.isArray(state.cryptex)) state.cryptex = [];

                const vals = (config[`cyl${id}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
                const nextIndex = (Number.isInteger(state.cryptex[id]) ? state.cryptex[id] : 0) + 1;
                state.cryptex[id] = nextIndex;

                const rawSymbol = vals[nextIndex % vals.length];
                const isImg = rawSymbol.includes("/") || rawSymbol.includes(".");
                const newSymbol = isImg ? this.normalizeAssetPath(rawSymbol) : rawSymbol;

                const content = e.currentTarget.querySelector(".cyl-content");
                if (content) {
                    content.style.transform = "translateY(-20px)";
                    content.style.opacity = "0";

                    setTimeout(() => {
                        if (isImg) {
                            content.innerHTML = `<img src="${newSymbol}" style="max-width:80%; max-height:80%; border:none; box-shadow:none;">`;
                        } else {
                            content.innerHTML = `<span>${newSymbol}</span>`;
                        }
                        content.style.transform = "translateY(20px)";
                        setTimeout(() => {
                            content.style.transform = "translateY(0)";
                            content.style.opacity = "1";
                        }, 50);
                    }, 150);
                }

                const soundSrc = this.normalizeAssetPath(config.turnSound || "") || "modules/enigma-box/sounds/statuedvizh.mp3";
                this.playSound(soundSrc, 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            });
        });
    }

    async _checkUnlock(config, state) {
        const count = parseInt(config.symCount, 10) || 4;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const vals = (config[`cyl${i}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
            const idx = Number.isInteger(state.cryptex?.[i]) ? state.cryptex[i] : 0;
            const rawCurrent = vals[idx % vals.length];
            const current = (rawCurrent.includes("/") || rawCurrent.includes("."))
                ? this.normalizeAssetPath(rawCurrent)
                : rawCurrent;
            const rawSol = (config[`cyl${i}_sol`] || "А").trim();
            const sol = (rawSol.includes("/") || rawSol.includes("."))
                ? this.normalizeAssetPath(rawSol)
                : rawSol;
            if (current !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}