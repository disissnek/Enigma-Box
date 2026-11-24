import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class TimelinePuzzle extends BasePuzzleLock {
    static get APP_ID() { return "timeline-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/lock_small01.ogg";
    }

    static get formConfiguration() {
        const inputs = [
            { name: "bookCount", label: enigmaLocalize("ENIGMA.TimelinePuzzle.BookCount"), type: "number", value: 6, min: 2, max: 12 },
            { name: "bgBack", label: enigmaLocalize("ENIGMA.TimelinePuzzle.BgBack"), type: "filepicker", value: "modules/enigma-box/img/bookback.jpg" },
            { name: "bgTopBot", label: enigmaLocalize("ENIGMA.TimelinePuzzle.BgTopBot"), type: "filepicker", value: "modules/enigma-box/img/booktopbot.jpg" },
            { name: "bgSides", label: enigmaLocalize("ENIGMA.TimelinePuzzle.BgSides"), type: "filepicker", value: "modules/enigma-box/img/bookleftright.jpg" }
        ];
        for (let i = 0; i < 12; i++) {
            const num = i + 1;
            inputs.push({ name: `bookTex${i}`, label: enigmaLocalize("ENIGMA.TimelinePuzzle.BookTex", { num }), type: "filepicker", value: `modules/enigma-box/img/book${(i % 6) + 1}.png` });
            inputs.push({ name: `book${i}`, label: enigmaLocalize("ENIGMA.TimelinePuzzle.BookText", { num }), type: "text", value: enigmaLocalize("ENIGMA.TimelinePuzzle.DefaultBook", { num }) });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.bookCount, 10) || 6;

        data.bgBack = this.normalizeAssetPath(config.bgBack || "") || "modules/enigma-box/img/bookback.jpg";
        data.bgTopBot = this.normalizeAssetPath(config.bgTopBot || "") || "modules/enigma-box/img/booktopbot.jpg";
        data.bgSides = this.normalizeAssetPath(config.bgSides || "") || "modules/enigma-box/img/bookleftright.jpg";

        const state = this.getPuzzleState();
        if (!state.timeline || !Array.isArray(state.timeline.order) || state.timeline.order.length !== count) {
            state.timeline = { order: [...Array(count).keys()].sort(() => Math.random() - 0.5) };
            await this.savePuzzleState(state);
        }

        data.books = state.timeline.order.map((val, i) => ({
            pos: i,
            id: val,
            text: config[`book${val}`] || enigmaLocalize("ENIGMA.TimelinePuzzle.DefaultBook", { num: val + 1 }),
            img: this.normalizeAssetPath(config[`bookTex${val}`] || "") || `modules/enigma-box/img/book${(val % 6) + 1}.png`
        }));
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;
        let selectedPos = null;

        container.querySelectorAll(".timeline-book").forEach(book => {
            book.addEventListener("click", async (e) => {
                const pos = parseInt(e.currentTarget.dataset.pos, 10);
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();

                if (selectedPos === null) {
                    selectedPos = pos;
                    e.currentTarget.classList.add("selected");
                    this.playSound("modules/enigma-box/sounds/papernoise_quite02.ogg", 0.7);
                } else {
                    if (selectedPos !== pos) {
                        const temp = state.timeline.order[selectedPos];
                        state.timeline.order[selectedPos] = state.timeline.order[pos];
                        state.timeline.order[pos] = temp;

                        this.playSound("modules/enigma-box/sounds/papernoise_quite02.ogg", 0.7);

                        await this.savePuzzleState(state);
                        this.render(false);
                        this._checkUnlock(config, state);
                    }
                    selectedPos = null;
                    container.querySelectorAll(".timeline-book").forEach(b => b.classList.remove("selected"));
                }
            });
        });
    }

    async _checkUnlock(config, state) {
        const count = parseInt(config.bookCount, 10) || 6;
        const target = [...Array(count).keys()];
        if (JSON.stringify(state.timeline?.order) === JSON.stringify(target)) {
            await this.onUnlock();
        }
    }
}