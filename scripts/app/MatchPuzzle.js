import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class MatchPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "match-puzzle"; }

    static get formConfiguration() {
        const inputs = [
            { name: "frameImg", label: enigmaLocalize("ENIGMA.MatchPuzzle.FrameImg"), type: "filepicker", value: "modules/enigma-box/img/frame (2).png" },
            { name: "stoneBg", label: enigmaLocalize("ENIGMA.MatchPuzzle.StoneBg"), type: "filepicker", value: "modules/enigma-box/img/tablic.jpg" },
            { name: "colCount", label: enigmaLocalize("ENIGMA.MatchPuzzle.ColCount"), type: "number", value: 3, min: 2, max: 4 },
            { name: "rowCount", label: enigmaLocalize("ENIGMA.MatchPuzzle.RowCount"), type: "number", value: 2, min: 1, max: 3 }
        ];

        for (let c = 0; c < 4; c++) {
            const charNum = c + 1;
            inputs.push({
                name: `col${c}_img`,
                label: enigmaLocalize("ENIGMA.MatchPuzzle.CharImg", { num: charNum }),
                type: "filepicker",
                value: "icons/svg/mystery-man.svg"
            });
            for (let r = 0; r < 3; r++) {
                const factNum = r + 1;
                inputs.push({
                    name: `col${c}_fact${r}`,
                    label: enigmaLocalize("ENIGMA.MatchPuzzle.FactLabel", { charNum, factNum }),
                    type: "text",
                    value: enigmaLocalize("ENIGMA.MatchPuzzle.DefaultFact", { charNum, factNum })
                });
            }
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        data.frameImg = this.normalizeAssetPath(config.frameImg || "") || "modules/enigma-box/img/frame (2).png";
        data.stoneBg = this.normalizeAssetPath(config.stoneBg || "") || "modules/enigma-box/img/tablic.jpg";

        const cols = parseInt(config.colCount, 10) || 3;
        const rows = parseInt(config.rowCount, 10) || 2;

        const state = this.getPuzzleState();
        const validState = Array.isArray(state.match)
            && state.match.length === rows
            && state.match.every(r => Array.isArray(r) && r.length === cols);

        if (!validState) {
            state.match = Array.from({ length: rows }, () => {
                const arr = [...Array(cols).keys()].sort(() => Math.random() - 0.5);
                if (arr.every((v, idx) => v === idx) && cols > 1) {
                    [arr[0], arr[1]] = [arr[1], arr[0]];
                }
                return arr;
            });
            await this.savePuzzleState(state);
        }

        data.columns = Array.from({ length: cols }, (_, c) => ({
            id: c,
            img: this.normalizeAssetPath(config[`col${c}_img`] || "") || "icons/svg/mystery-man.svg",
            facts: Array.from({ length: rows }, (_, r) => {
                const ownerCol = state.match[r][c];
                const charNum = ownerCol + 1;
                const factNum = r + 1;
                return {
                    rowId: r,
                    text: config[`col${ownerCol}_fact${r}`] || enigmaLocalize("ENIGMA.MatchPuzzle.DefaultFact", { charNum, factNum })
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
                    this.playSound("modules/enigma-box/sounds/tilepickup.wav", 0.7);
                } else if (selected.col === col && selected.row === row) {
                    selected = null;
                    e.currentTarget.classList.remove("selected");
                    this.playSound("modules/enigma-box/sounds/tileputdown.wav", 0.7);
                } else if (selected.row === row) {
                    const config = this.document.getFlag(MODULE_ID, "config") || {};
                    const state = this.getPuzzleState();
                    const temp = state.match[row][selected.col];
                    state.match[row][selected.col] = state.match[row][col];
                    state.match[row][col] = temp;

                    this.playSound("modules/enigma-box/sounds/tileputdown.wav", 0.7);

                    selected = null;
                    await this.savePuzzleState(state);
                    this.render(false);
                    this._checkUnlock(config, state);
                } else {
                    container.querySelectorAll(".match-slot.clickable").forEach(s => s.classList.remove("selected"));
                    selected = { col, row };
                    e.currentTarget.classList.add("selected");
                    this.playSound("modules/enigma-box/sounds/tilepickup.wav", 0.7);
                }
            });
        });
    }

    async _checkUnlock(config, state) {
        const isSolved = state.match.every(rowArr => rowArr.every((ownerCol, colIdx) => ownerCol === colIdx));
        if (isSolved) await this.onUnlock();
    }
}