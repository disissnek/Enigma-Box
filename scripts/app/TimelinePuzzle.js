import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class TimelinePuzzle extends BasePuzzleLock {
    static get APP_ID() { return "timeline-puzzle"; }

    get unlockSound() {
        return "modules/enigma-box/sounds/Lock_Small01.ogg";
    }

    static get formConfiguration() {
        const inputs = [
            { name: "bookCount", label: "Кол-во книг (2-12)", type: "number", value: 6, min: 2, max: 12 },
            { name: "bgBack", label: "Фон полки (задник)", type: "filepicker", value: "modules/enigma-box/img/bookback.jpg" },
            { name: "bgTopBot", label: "Верх/Низ полки", type: "filepicker", value: "modules/enigma-box/img/booktopbot.jpg" },
            { name: "bgSides", label: "Боковины полки", type: "filepicker", value: "modules/enigma-box/img/bookleftright.jpg" }
        ];
        for (let i = 0; i < 12; i++) {
            inputs.push({ name: `bookTex${i}`, label: `Книга ${i + 1}: Обложка`, type: "filepicker", value: `modules/enigma-box/img/book${(i % 6) + 1}.png` });
            inputs.push({ name: `book${i}`, label: `Книга ${i + 1}: Текст`, type: "text", value: `Книга ${i + 1}` });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.bookCount, 10) || 6;

        data.bgBack = config.bgBack || "modules/enigma-box/img/bookback.jpg";
        data.bgTopBot = config.bgTopBot || "modules/enigma-box/img/booktopbot.jpg";
        data.bgSides = config.bgSides || "modules/enigma-box/img/bookleftright.jpg";

        if (!config.state || !config.state.timeline || !Array.isArray(config.state.timeline.order) || config.state.timeline.order.length !== count) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.timeline = { order: [...Array(count).keys()].sort(() => Math.random() - 0.5) };
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.books = config.state.timeline.order.map((val, i) => ({
            pos: i,
            id: val,
            text: config[`book${val}`] || `Книга ${val + 1}`,
            img: config[`bookTex${val}`] || `modules/enigma-box/img/book${(val % 6) + 1}.png`
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
                const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});

                if (selectedPos === null) {
                    selectedPos = pos;
                    e.currentTarget.classList.add("selected");
                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/PaperNoise_Quite02.ogg", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}
                } else {
                    if (selectedPos !== pos) {
                        const temp = config.state.timeline.order[selectedPos];
                        config.state.timeline.order[selectedPos] = config.state.timeline.order[pos];
                        config.state.timeline.order[pos] = temp;

                        try {
                            foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/PaperNoise_Quite02.ogg", volume: 0.7, autoplay: true }, true);
                        } catch (err) {}

                        await this.document.setFlag(MODULE_ID, "config", config);
                        this.render(false);
                        this._checkUnlock(config);
                    }
                    selectedPos = null;
                    container.querySelectorAll(".timeline-book").forEach(b => b.classList.remove("selected"));
                }
            });
        });
    }

    async _checkUnlock(config) {
        const count = parseInt(config.bookCount, 10) || 6;
        const target = [...Array(count).keys()];
        if (JSON.stringify(config.state.timeline.order) === JSON.stringify(target)) {
            await this.onUnlock();
        }
    }
}