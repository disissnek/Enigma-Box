import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class MatchPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "match-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "frameImg", label: "Рамка портрета", type: "filepicker", value: "modules/enigma-box/img/frame (2).png" },
            { name: "stoneBg", label: "Текстура для фактов", type: "filepicker", value: "modules/enigma-box/img/tablic.jpg" },
            { name: "colCount", label: "Количество персонажей (2-4)", type: "number", value: 3, min: 2, max: 4 },
            { name: "rowCount", label: "Количество строк фактов (1-3)", type: "number", value: 2, min: 1, max: 3 }
        ];

        for (let c = 0; c < 4; c++) {
            inputs.push({ name: `col${c}_img`, label: `Персонаж ${c + 1}: Портрет`, type: "filepicker", value: "icons/svg/mystery-man.svg" });
            for (let r = 0; r < 3; r++) {
                inputs.push({ name: `col${c}_fact${r}`, label: `Персонаж ${c + 1}: Факт ${r + 1}`, type: "text", value: `Факт ${c + 1}-${r + 1}` });
            }
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        let config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.frameImg = config.frameImg || "modules/enigma-box/img/frame (2).png";
        data.stoneBg = config.stoneBg || "modules/enigma-box/img/tablic.jpg";

        const cols = parseInt(config.colCount, 10) || 3;
        const rows = parseInt(config.rowCount, 10) || 2;

        const validState = Array.isArray(config.state?.match)
            && config.state.match.length === rows
            && config.state.match.every(r => Array.isArray(r) && r.length === cols);

        if (!validState) {
            config = foundry.utils.deepClone(config);
            if (!config.state) config.state = {};
            config.state.match = Array.from({ length: rows }, () => {
                const arr = [...Array(cols).keys()].sort(() => Math.random() - 0.5);
                if (arr.every((v, idx) => v === idx) && cols > 1) {
                    [arr[0], arr[1]] = [arr[1], arr[0]];
                }
                return arr;
            });
            await this.document.setFlag(MODULE_ID, "config", config);
        }

        data.columns = Array.from({ length: cols }, (_, c) => ({
            id: c,
            img: config[`col${c}_img`] || "icons/svg/mystery-man.svg",
            facts: Array.from({ length: rows }, (_, r) => {
                const ownerCol = config.state.match[r][c];
                return {
                    rowId: r,
                    text: config[`col${ownerCol}_fact${r}`] || `Факт ${ownerCol + 1}-${r + 1}`
                };
            })
        }));

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;
        let selected = null;

        container.querySelectorAll(".match-slot.clickable").forEach(slot => {
            slot.addEventListener("click", async (e) => {
                const col = parseInt(e.currentTarget.dataset.col, 10);
                const row = parseInt(e.currentTarget.dataset.row, 10);

                if (!selected) {
                    selected = { col, row };
                    e.currentTarget.classList.add("selected");
                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePickUp.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}
                } else if (selected.col === col && selected.row === row) {
                    selected = null;
                    e.currentTarget.classList.remove("selected");
                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePutDown.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}
                } else if (selected.row === row) {
                    const config = foundry.utils.deepClone(this.document.getFlag(MODULE_ID, "config") || {});
                    const temp = config.state.match[row][selected.col];
                    config.state.match[row][selected.col] = config.state.match[row][col];
                    config.state.match[row][col] = temp;

                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePutDown.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}

                    selected = null;
                    await this.document.setFlag(MODULE_ID, "config", config);
                    this.render(false);
                    this._checkUnlock(config);
                } else {
                    container.querySelectorAll(".match-slot.clickable").forEach(s => s.classList.remove("selected"));
                    selected = { col, row };
                    e.currentTarget.classList.add("selected");
                    try {
                        foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/TilePickUp.wav", volume: 0.7, autoplay: true }, true);
                    } catch (err) {}
                }
            });
        });
    }

    async _checkUnlock(config) {
        const isSolved = config.state.match.every(rowArr => rowArr.every((ownerCol, colIdx) => ownerCol === colIdx));
        if (isSolved) await this.onUnlock();
    }
}