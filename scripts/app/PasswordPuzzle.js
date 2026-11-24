import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class PasswordPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "password-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "keypadBg", label: enigmaLocalize("ENIGMA.PasswordPuzzle.KeypadBg"), type: "filepicker", value: "modules/enigma-box/img/cifers_bg.jpg" },
            { name: "keyBtnBg", label: enigmaLocalize("ENIGMA.PasswordPuzzle.KeyBtnBg"), type: "filepicker", value: "modules/enigma-box/img/cifer_btn.png" },
            { name: "password", label: enigmaLocalize("ENIGMA.PasswordPuzzle.Password"), type: "text", value: "1234" }
        ];

        for (let i = 1; i <= 10; i++) {
            const digitLabel = i === 10 ? "0" : `${i}`;
            inputs.push({
                name: `keyImg${i}`,
                label: enigmaLocalize("ENIGMA.PasswordPuzzle.KeyImg", { num: i, digit: digitLabel }),
                type: "filepicker",
                value: ""
            });
        }

        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || enigmaLocalize("ENIGMA.PasswordPuzzle.DefaultDescription");
        data.clearTitle = enigmaLocalize("ENIGMA.PasswordPuzzle.ClearTitle");
        data.keypadBg = this.normalizeAssetPath(config.keypadBg || "") || "modules/enigma-box/img/cifers_bg.jpg";
        data.keyBtnBg = this.normalizeAssetPath(config.keyBtnBg || "") || "modules/enigma-box/img/cifer_btn.png";

        const state = this.getPuzzleState();
        if (typeof state.passInput !== "string") {
            state.passInput = "";
            await this.savePuzzleState(state);
        }

        data.currentInput = state.passInput;

        const keys = [];
        for (let i = 1; i <= 10; i++) {
            const val = i === 10 ? "0" : `${i}`;
            const img = this.normalizeAssetPath(config[`keyImg${i}`] || "");
            keys.push({
                index: i,
                val,
                img,
                hasImg: img.length > 0,
                isZero: i === 10
            });
        }
        data.keys = keys;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".pass-key").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const key = e.currentTarget.dataset.key;
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (typeof state.passInput !== "string") state.passInput = "";

                if (state.passInput.length < 10) {
                    state.passInput += key;
                    const display = container.querySelector(".pass-display-text");
                    if (display) display.innerText = state.passInput;

                    this.playSound("modules/enigma-box/sounds/metal_move01.wav", 0.7);

                    await this.savePuzzleState(state);
                    this._checkUnlock(config, state, container);
                }
            });
        });

        const backBtn = container.querySelector(".pass-back");
        if (backBtn) {
            backBtn.addEventListener("click", async () => {
                const state = this.getPuzzleState();
                state.passInput = "";

                const display = container.querySelector(".pass-display-text");
                if (display) display.innerText = "";

                this.playSound("modules/enigma-box/sounds/computergamebeep01.wav", 0.7);

                await this.savePuzzleState(state);
            });
        }
    }

    async _checkUnlock(config, state, container) {
        const target = (config.password || "1234").toString().trim();
        if (state.passInput === target) {
            setTimeout(() => this.onUnlock(), 300);
        } else if (state.passInput.length >= target.length) {
            this.playSound("modules/enigma-box/sounds/computergamebeep01.wav", 0.7);
            const display = container.querySelector(".pass-display-text");
            if (display) display.style.color = "#ff5555";

            setTimeout(async () => {
                const freshState = this.getPuzzleState();
                freshState.passInput = "";
                await this.savePuzzleState(freshState);
                if (display) {
                    display.innerText = "";
                    display.style.color = "#a3e5c0";
                }
            }, 800);
        }
    }
}