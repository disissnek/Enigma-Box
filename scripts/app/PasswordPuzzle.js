import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class PasswordPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "password-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "keypadBg", label: "Фон панели (с экраном и кнопкой стирания)", type: "filepicker", value: "modules/enigma-box/img/cifers_bg.jpg" },
            { name: "keyBtnBg", label: "Картинка одной кнопки", type: "filepicker", value: "modules/enigma-box/img/cifer_btn.png" },
            { name: "password", label: "Правильный пароль (цифры 0-9)", type: "text", value: "1234" }
        ];

        for (let i = 1; i <= 10; i++) {
            const digitLabel = i === 10 ? "0" : `${i}`;
            inputs.push({
                name: `keyImg${i}`,
                label: `Кнопка ${i} (цифра ${digitLabel}) — иконка вместо цифры (необязательно)`,
                type: "filepicker",
                value: ""
            });
        }

        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "Введите код доступа...";
        data.keypadBg = (config.keypadBg || "").trim() || "modules/enigma-box/img/cifers_bg.jpg";
        data.keyBtnBg = (config.keyBtnBg || "").trim() || "modules/enigma-box/img/cifer_btn.png";

        if (!config.state || typeof config.state.passInput !== "string") {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.passInput = "";
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.currentInput = config.state.passInput;

        const keys = [];
        for (let i = 1; i <= 10; i++) {
            const val = i === 10 ? "0" : `${i}`;
            const img = (config[`keyImg${i}`] || "").trim();
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
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (typeof config.state?.passInput !== "string") {
                    if (!config.state) config.state = {};
                    config.state.passInput = "";
                }

                if (config.state.passInput.length < 10) {
                    config.state.passInput += key;
                    const display = container.querySelector(".pass-display-text");
                    if (display) display.innerText = config.state.passInput;

                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/Metal_Move01.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}

                    await this.document.setFlag(MODULE_ID, "config", config);
                    this._checkUnlock(config, container);
                }
            });
        });

        const backBtn = container.querySelector(".pass-back");
        if (backBtn) {
            backBtn.addEventListener("click", async () => {
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (!config.state) config.state = {};
                config.state.passInput = "";

                const display = container.querySelector(".pass-display-text");
                if (display) display.innerText = "";

                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/ComputerGameBeep01.wav", volume: 0.7, autoplay: true }, true);
                } catch (err) {}

                await this.document.setFlag(MODULE_ID, "config", config);
            });
        }
    }

    async _checkUnlock(config, container) {
        const target = (config.password || "1234").toString().trim();
        if (config.state.passInput === target) {
            setTimeout(() => this.onUnlock(), 300);
        } else if (config.state.passInput.length >= target.length) {
            try {
                foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/ComputerGameBeep01.wav", volume: 0.7, autoplay: true }, true);
            } catch (err) {}
            const display = container.querySelector(".pass-display-text");
            if (display) display.style.color = "#ff5555";

            setTimeout(async () => {
                const freshConfig = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                if (!freshConfig.state) freshConfig.state = {};
                freshConfig.state.passInput = "";
                await this.document.setFlag(MODULE_ID, "config", freshConfig);
                if (display) {
                    display.innerText = "";
                    display.style.color = "#a3e5c0";
                }
            }, 800);
        }
    }
}