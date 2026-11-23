import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class CryptexPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "cryptex-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/Lock_Small02.wav";
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
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.bracketImg = config.bracketImg || "modules/enigma-box/img/kraicill.png";
        data.bgImg = config.bgImg || "modules/enigma-box/img/cilindrifon.png";

        const count = parseInt(config.symCount, 10) || 4;

        if (!config.state || !Array.isArray(config.state.cryptex) || config.state.cryptex.length !== count) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.cryptex = Array.from({ length: count }, () => 0);
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.cylinders = config.state.cryptex.map((val, i) => {
            const vals = (config[`cyl${i}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
            const safeVal = Number.isInteger(val) ? val : 0;
            const currentVal = vals[safeVal % vals.length];
            const isImg = currentVal.includes("/") || currentVal.includes(".");
            return { id: i, symbol: currentVal, isImg };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".cryptex-cyl").forEach(cyl => {
            cyl.addEventListener("click", async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (!config.state) config.state = {};
                if (!Array.isArray(config.state.cryptex)) config.state.cryptex = [];

                const vals = (config[`cyl${id}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
                const nextIndex = (Number.isInteger(config.state.cryptex[id]) ? config.state.cryptex[id] : 0) + 1;
                config.state.cryptex[id] = nextIndex;

                const newSymbol = vals[nextIndex % vals.length];
                const isImg = newSymbol.includes("/") || newSymbol.includes(".");

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
        const count = parseInt(config.symCount, 10) || 4;
        let isSolved = true;
        for (let i = 0; i < count; i++) {
            const vals = (config[`cyl${i}_vals`] || "А,Б,В,Г,Д").split(",").map(s => s.trim());
            const idx = Number.isInteger(config.state.cryptex[i]) ? config.state.cryptex[i] : 0;
            const current = vals[idx % vals.length];
            const sol = (config[`cyl${i}_sol`] || "А").trim();
            if (current !== sol) {
                isSolved = false;
                break;
            }
        }
        if (isSolved) await this.onUnlock();
    }
}