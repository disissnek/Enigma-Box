import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class ClockPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "clock-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/lock_small02.wav";
    }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "clockFace", label: "Циферблат", type: "filepicker", value: "modules/enigma-box/img/clock.svg" },
                { name: "handHour", label: "Часовая (Короткая)", type: "filepicker", value: "modules/enigma-box/img/arrow1.svg" },
                { name: "handMinute", label: "Минутная (Длинная)", type: "filepicker", value: "modules/enigma-box/img/arrow2.svg" },
                { name: "solHour", label: "Решение: Часы (1-12)", type: "number", value: 12, min: 1, max: 12 },
                { name: "solMinute", label: "Решение: Минуты (1-12)", type: "number", value: 12, min: 1, max: 12 }
            ]
        };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";

        const state = this.getPuzzleState();
        if (!state.clock || typeof state.clock.hourClicks !== "number") {
            state.clock = { hourClicks: 0, minuteClicks: 0 };
            await this.savePuzzleState(state);
        }

        data.clockFace = this.normalizeAssetPath(config.clockFace || "") || "modules/enigma-box/img/clock.svg";
        data.handHour = this.normalizeAssetPath(config.handHour || "") || "modules/enigma-box/img/arrow1.svg";
        data.handMinute = this.normalizeAssetPath(config.handMinute || "") || "modules/enigma-box/img/arrow2.svg";

        data.degHour = state.clock.hourClicks * 30;
        data.degMinute = state.clock.minuteClicks * 30;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html.find(".enigma-clock-container")[0];
        if (!container) return;

        container.querySelectorAll(".enigma-hand").forEach(hand => {
            hand.addEventListener("click", async (e) => {
                const type = e.currentTarget.dataset.type;
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!state.clock) state.clock = { hourClicks: 0, minuteClicks: 0 };

                state.clock[type] = (state.clock[type] || 0) + 1;
                e.currentTarget.style.transform = `translateX(-50%) rotate(${state.clock[type] * 30}deg)`;

                this.playSound("modules/enigma-box/sounds/metal_move01.wav", 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            });
        });
    }

    async _checkUnlock(config, state) {
        let h = (state.clock?.hourClicks || 0) % 12;
        if (h === 0) h = 12;
        let m = (state.clock?.minuteClicks || 0) % 12;
        if (m === 0) m = 12;

        if (h === (parseInt(config.solHour, 10) || 12) && m === (parseInt(config.solMinute, 10) || 12)) {
            await this.onUnlock();
        }
    }
}