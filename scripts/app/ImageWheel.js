import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class ImageWheel extends BasePuzzleLock {
    static get APP_ID() { return "image-wheel"; }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "wheelImg", label: enigmaLocalize("ENIGMA.ImageWheel.WheelImg"), type: "filepicker", value: "icons/svg/sun.svg" },
                { name: "bgImg", label: enigmaLocalize("ENIGMA.ImageWheel.BgImg"), type: "filepicker", value: "ui/parchment.jpg" },
                { name: "ringCount", label: enigmaLocalize("ENIGMA.ImageWheel.RingCount"), type: "number", value: 3, min: 2, max: 6 },
                { name: "segments", label: enigmaLocalize("ENIGMA.ImageWheel.Segments"), type: "number", value: 12, min: 2, max: 36 },
                { name: "strictUpright", label: enigmaLocalize("ENIGMA.ImageWheel.StrictUpright"), type: "number", value: 1, min: 0, max: 1 }
            ]
        };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        
        const count = parseInt(config.ringCount, 10) || 3;
        const ringCount = Math.max(2, Math.min(6, count));
        const segments = Math.max(2, Math.min(36, parseInt(config.segments, 10) || 12));

        const state = this.getPuzzleState();
        let needsShuffle = false;

        if (!Array.isArray(state.wheel) || state.wheel.length !== ringCount) {
            needsShuffle = true;
        } else {
            const w = state.wheel.map(v => ((v % segments) + segments) % segments);
            if (w.every(val => val === w[0])) needsShuffle = true;
        }

        if (needsShuffle) {
            state.wheel = Array.from({ length: ringCount }, () => Math.floor(Math.random() * segments));
            const w = state.wheel.map(v => v % segments);
            if (w.every(val => val === w[0])) {
                state.wheel[0] = (state.wheel[0] + 1) % segments;
            }
            await this.savePuzzleState(state);
        }

        data.bgImg = this.normalizeAssetPath(config.bgImg || "");
        data.wheelImg = this.normalizeAssetPath(config.wheelImg || "");

        const stepDeg = 360 / segments;
        data.rings = [];
        
        for (let i = 0; i < ringCount; i++) {
            const inner = ((ringCount - 1 - i) / ringCount) * 100;
            const outer = ((ringCount - i) / ringCount) * 100;
            let mask = "";
            
            if (i === ringCount - 1) { 
                mask = `radial-gradient(circle closest-side, black ${outer}%, transparent calc(${outer}% + 1px))`;
            } else if (i === 0) { 
                mask = `radial-gradient(circle closest-side, transparent calc(${inner}% - 1px), black ${inner}%)`;
            } else { 
                mask = `radial-gradient(circle closest-side, transparent calc(${inner}% - 1px), black ${inner}%, black ${outer}%, transparent calc(${outer}% + 1px))`;
            }

            data.rings.push({
                id: i,
                rot: (state.wheel[i] || 0) * stepDeg,
                z: 10 + i,
                mask: mask
            });
        }
        
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html.find(".enigma-wheel-container")[0];
        if (!container) return;

        container.addEventListener("click", async (e) => {
            const config = this.document.getFlag(MODULE_ID, "config") || {};
            const count = parseInt(config.ringCount, 10) || 3;
            const ringCount = Math.max(2, Math.min(6, count));
            const segments = Math.max(2, Math.min(36, parseInt(config.segments, 10) || 12));

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const dist = Math.sqrt(x * x + y * y);
            const radius = rect.width / 2;
            const fraction = dist / radius;

            if (fraction > 1) return;

            const idxFromCenter = Math.floor(fraction * ringCount);
            const ringId = (ringCount - 1) - idxFromCenter;

            if (ringId >= 0 && ringId < ringCount) {
                const state = this.getPuzzleState();
                if (!Array.isArray(state.wheel)) state.wheel = Array.from({ length: ringCount }, () => 0);
                
                state.wheel[ringId] += 1;

                const ringEl = container.querySelector(`.enigma-ring[data-id="${ringId}"]`);
                if (ringEl) ringEl.style.transform = `rotate(${state.wheel[ringId] * (360 / segments)}deg)`;

                this.playSound("modules/enigma-box/sounds/statuedvizh.mp3", 0.7);

                await this.savePuzzleState(state);
                this._checkUnlock(config, state);
            }
        });
    }

    async _checkUnlock(config, state) {
        const segments = Math.max(2, Math.min(36, parseInt(config.segments, 10) || 12));
        const strict = parseInt(config.strictUpright, 10) !== 0;

        const w = state.wheel.map(v => ((v % segments) + segments) % segments);
        const isSolved = w.every(val => val === w[0]);
        
        if (isSolved) {
            if (strict && w[0] !== 0) return;
            await this.onUnlock();
        }
    }
}