import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class ClockPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "clock-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/Lock_Small02.wav";
    }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "clockFace", label: "Циферблат", type: "filepicker", value: "modules/enigma-box/img/clock.svg" },
                { name: "handHour", label: "Часовая (Короткая)", type: "filepicker", value: "modules/enigma-box/img/Arrow1.svg" },
                { name: "handMinute", label: "Минутная (Длинная)", type: "filepicker", value: "modules/enigma-box/img/Arrow2.svg" },
                { name: "solHour", label: "Решение: Часы (1-12)", type: "number", value: 12, min: 1, max: 12 },
                { name: "solMinute", label: "Решение: Минуты (1-12)", type: "number", value: 12, min: 1, max: 12 }
            ]
        };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";

        if (!config.state || !config.state.clock || typeof config.state.clock.hourClicks !== "number") {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.clock = { hourClicks: 0, minuteClicks: 0 };
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.clockFace = config.clockFace;
        data.handHour = config.handHour;
        data.handMinute = config.handMinute;

        data.degHour = config.state.clock.hourClicks * 30;
        data.degMinute = config.state.clock.minuteClicks * 30;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html.find(".enigma-clock-container")[0];
        if (!container) return;

        container.querySelectorAll(".enigma-hand").forEach(hand => {
            hand.addEventListener("click", async (e) => {
                const type = e.currentTarget.dataset.type;
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});

                config.state.clock[type] += 1;
                e.currentTarget.style.transform = `translateX(-50%) rotate(${config.state.clock[type] * 30}deg)`;

                try {
                    foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/Metal_Move01.wav", volume: 0.7, autoplay: true }, true);
                } catch (err) {}

                await this.document.setFlag(MODULE_ID, "config", config);
                this._checkUnlock(config);
            });
        });
    }

    async _checkUnlock(config) {
        let h = config.state.clock.hourClicks % 12;
        if (h === 0) h = 12;
        let m = config.state.clock.minuteClicks % 12;
        if (m === 0) m = 12;

        if (h === (parseInt(config.solHour, 10) || 12) && m === (parseInt(config.solMinute, 10) || 12)) {
            await this.onUnlock();
        }
    }
}