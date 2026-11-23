import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class TextPasswordPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "text-password"; }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "panelBg", label: "Фон панели (panel.jpg)", type: "filepicker", value: "modules/enigma-box/img/panel.jpg" },
                { name: "secretPassword", label: "Правильный пароль (буквы или цифры)", type: "text", value: "ТАЙНА" },
                { name: "caseSensitive", label: "Учитывать регистр букв? (0 - Нет, 1 - Да)", type: "number", value: 0, min: 0, max: 1 },
                { name: "passPlaceholder", label: "Подсказка внутри поля", type: "text", value: "Введите пароль..." }
            ]
        };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.panelBg = config.panelBg || "modules/enigma-box/img/panel.jpg";
        data.passPlaceholder = config.passPlaceholder !== undefined ? config.passPlaceholder : "Введите пароль...";
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;
        const inputEl = container.querySelector(".text-pass-input");
        const clearBtn = container.querySelector(".text-pass-clear");
        const submitBtn = container.querySelector(".text-pass-submit");

        if (!inputEl) return;

        setTimeout(() => inputEl.focus(), 100);

        const verifyPassword = async () => {
            const config = this.document.getFlag(MODULE_ID, "config") || {};
            const rawExpected = (config.secretPassword || "ТАЙНА").toString().trim();
            const rawEntered = inputEl.value.trim();

            if (!rawEntered) return;

            const isCaseSensitive = parseInt(config.caseSensitive, 10) === 1;
            const expected = isCaseSensitive ? rawExpected : rawExpected.toLowerCase();
            const entered = isCaseSensitive ? rawEntered : rawEntered.toLowerCase();

            if (entered === expected) {
                inputEl.disabled = true;
                inputEl.classList.add("success");
                setTimeout(() => this.onUnlock(), 300);
            } else {
                inputEl.classList.add("error");
                setTimeout(() => {
                    inputEl.value = "";
                    inputEl.classList.remove("error");
                    inputEl.focus();
                }, 700);
            }
        };

        inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TypeBell.ogg", volume: 0.7, autoplay: true }, true);
                } catch (err) {}
                verifyPassword();
            } else if (e.key === "Backspace" || e.key === "Delete") {
                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/ComputerGameBeep01.wav", volume: 0.6, autoplay: true }, true);
                } catch (err) {}
            } else if (e.key.length === 1) {
                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TypeLetter.wav", volume: 0.6, autoplay: true }, true);
                } catch (err) {}
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                inputEl.value = "";
                inputEl.classList.remove("error");
                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/ComputerGameBeep01.wav", volume: 0.7, autoplay: true }, true);
                } catch (err) {}
                inputEl.focus();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TypeBell.ogg", volume: 0.7, autoplay: true }, true);
                } catch (err) {}
                verifyPassword();
            });
        }
    }
}