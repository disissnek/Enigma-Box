import { BasePuzzleLock } from "./BasePuzzleLock.js";
import { enigmaLocalize } from "../main.js";

const MODULE_ID = "enigma-box";

export class MirrorPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "mirror-puzzle"; }

    static get formConfiguration() {
        return {
            inputs: [
                { name: "mirrorFieldBg", label: enigmaLocalize("ENIGMA.MirrorPuzzle.MirrorFieldBg"), type: "filepicker", value: "modules/enigma-box/img/backmirrors.png" },
                { name: "startImg", label: enigmaLocalize("ENIGMA.MirrorPuzzle.StartImg"), type: "filepicker", value: "modules/enigma-box/img/mirrorstart.png" },
                { name: "endImg", label: enigmaLocalize("ENIGMA.MirrorPuzzle.EndImg"), type: "filepicker", value: "modules/enigma-box/img/mirrorend.png" },
                { name: "mirrorImg", label: enigmaLocalize("ENIGMA.MirrorPuzzle.MirrorImg"), type: "filepicker", value: "modules/enigma-box/img/mirror.png" },
                { name: "lightImg", label: enigmaLocalize("ENIGMA.MirrorPuzzle.LightImg"), type: "filepicker", value: "modules/enigma-box/img/mirrorlight.png" },
                { name: "startRow", label: enigmaLocalize("ENIGMA.MirrorPuzzle.StartRow"), type: "number", value: 3, min: 1, max: 5 },
                { name: "endRow", label: enigmaLocalize("ENIGMA.MirrorPuzzle.EndRow"), type: "number", value: 3, min: 1, max: 5 },
                { name: "mirrors", label: enigmaLocalize("ENIGMA.MirrorPuzzle.Mirrors"), type: "text", value: "3-2, 1-2, 1-4, 3-4" }
            ]
        };
    }

    _parseMirrorCoords(mirrorsStr) {
        return (mirrorsStr || "3-2, 1-2, 1-4, 3-4")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .map(pair => {
                const [r, c] = pair.split("-").map(n => parseInt(n.trim(), 10) - 1);
                if (isNaN(r) || isNaN(c) || r < 0 || r > 4 || c < 0 || c > 4) return null;
                return `${r}-${c}`;
            })
            .filter(Boolean);
    }

    _traceBeam(config, state) {
        const startR = Math.min(4, Math.max(0, (parseInt(config.startRow, 10) || 3) - 1));
        const endR = Math.min(4, Math.max(0, (parseInt(config.endRow, 10) || 3) - 1));
        const mirrorMap = state?.mirrors || {};

        const dr = [-1, 0, 1, 0];
        const dc = [0, 1, 0, -1];

        let r = startR;
        let c = 0;
        let dir = 1;
        const beams = [];
        let solved = false;

        for (let step = 0; step < 30; step++) {
            const nr = r + dr[dir];
            const nc = c + dc[dir];

            if (nr < 0 || nr > 4 || nc < 0 || nc > 4) break;

            beams.push({
                top: ((r + nr) / 2) * 20 + 10,
                left: ((c + nc) / 2) * 20 + 10,
                deg: (dir === 1 || dir === 3) ? 90 : 0
            });

            r = nr;
            c = nc;

            if (r === endR && c === 4) {
                solved = true;
                break;
            }

            if (r === startR && c === 0) break;

            const key = `${r}-${c}`;
            if (mirrorMap[key] !== undefined) {
                const rotState = mirrorMap[key] % 4;
                if (rotState === 0) {
                    if (dir !== 0 && dir !== 2) break;
                } else if (rotState === 1) {
                    dir = [1, 0, 3, 2][dir];
                } else if (rotState === 2) {
                    if (dir !== 1 && dir !== 3) break;
                } else if (rotState === 3) {
                    dir = [3, 2, 1, 0][dir];
                }
            }
        }

        return { beams, solved };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";

        data.mirrorFieldBg = this.normalizeAssetPath(config.mirrorFieldBg || "") || "modules/enigma-box/img/backmirrors.png";
        data.startImg = this.normalizeAssetPath(config.startImg || "") || "modules/enigma-box/img/mirrorstart.png";
        data.endImg = this.normalizeAssetPath(config.endImg || "") || "modules/enigma-box/img/mirrorend.png";
        data.mirrorImg = this.normalizeAssetPath(config.mirrorImg || "") || "modules/enigma-box/img/mirror.png";
        data.lightImg = this.normalizeAssetPath(config.lightImg || "") || "modules/enigma-box/img/mirrorlight.png";

        const startR = Math.min(4, Math.max(0, (parseInt(config.startRow, 10) || 3) - 1));
        const endR = Math.min(4, Math.max(0, (parseInt(config.endRow, 10) || 3) - 1));
        const coords = this._parseMirrorCoords(config.mirrors);

        const state = this.getPuzzleState();
        const existingKeys = Object.keys(state.mirrors || {});
        const needInit = !state.mirrors ||
            existingKeys.length !== coords.length ||
            !coords.every(k => existingKeys.includes(k));

        if (needInit) {
            state.mirrors = {};
            coords.forEach((key, idx) => {
                state.mirrors[key] = (idx % 2) * 2;
            });
            await this.savePuzzleState(state);
        }

        const { beams, solved } = this._traceBeam(config, state);
        data.beams = beams;
        data.isSolved = solved;

        const cells = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const key = `${r}-${c}`;
                const isStart = (r === startR && c === 0);
                const isEnd = (r === endR && c === 4);
                const hasMirror = !isStart && !isEnd && (state.mirrors[key] !== undefined);
                const clicks = hasMirror ? state.mirrors[key] : 0;

                cells.push({
                    key,
                    isStart,
                    isEnd,
                    hasMirror,
                    rot: clicks * 45
                });
            }
        }
        data.cells = cells;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;

        container.querySelectorAll(".mirror-piece").forEach(mirrorEl => {
            mirrorEl.addEventListener("click", async (e) => {
                const key = e.currentTarget.dataset.key;
                const config = this.document.getFlag(MODULE_ID, "config") || {};
                const state = this.getPuzzleState();
                if (!state.mirrors || state.mirrors[key] === undefined) return;

                state.mirrors[key] += 1;

                this.playSound("modules/enigma-box/sounds/stoneslide02.wav", 0.7);

                await this.savePuzzleState(state);
                const { solved } = this._traceBeam(config, state);
                this.render(false);

                if (solved) {
                    setTimeout(() => this.onUnlock(), 600);
                }
            });
        });
    }
}