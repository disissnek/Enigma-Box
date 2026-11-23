import { BasePuzzleLock } from "./BasePuzzleLock.js";
const MODULE_ID = "enigma-box";

export class MusicPuzzle extends BasePuzzleLock {
    static get APP_ID() { return "music-puzzle"; }

    static get formConfiguration() {
        const defaultNotes = [
            "modules/enigma-box/sounds/Woodsqueak_A.ogg",
            "modules/enigma-box/sounds/Woodsqueak_B.ogg",
            "modules/enigma-box/sounds/Woodsqueak_C.ogg",
            "modules/enigma-box/sounds/Woodsqueak_D.ogg",
            "modules/enigma-box/sounds/Woodsqueak_A.ogg",
            "modules/enigma-box/sounds/Woodsqueak_B.ogg"
        ];
        const inputs = [
            { name: "btnCount", label: "Количество кнопок (2-6)", type: "number", value: 4, min: 2, max: 6 },
            { name: "sequence", label: "Последовательность кнопок (через запятую, от 1)", type: "text", value: "1, 2, 3, 4" }
        ];
        for (let i = 0; i < 6; i++) {
            inputs.push({
                name: `note${i}`,
                label: `Звук кнопки ${i + 1}`,
                type: "audiopicker",
                value: defaultNotes[i]
            });
        }
        return { inputs };
    }

    async getData() {
        const data = await super.getData();
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        data.description = config.description || "";
        const count = parseInt(config.btnCount, 10) || 4;
        data.buttons = Array.from({ length: count }, (_, i) => ({ id: i, label: i + 1 }));
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const container = html[0] ?? html;
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        const defaultNotes = [
            "modules/enigma-box/sounds/woodsqueak_a.ogg",
            "modules/enigma-box/sounds/woodsqueak_b.ogg",
            "modules/enigma-box/sounds/woodsqueak_c.ogg",
            "modules/enigma-box/sounds/woodsqueak_d.ogg",
            "modules/enigma-box/sounds/woodsqueak_a.ogg",
            "modules/enigma-box/sounds/woodsqueak_b.ogg"
        ];

        const targetSeq = (config.sequence || "1, 2, 3, 4")
            .split(",")
            .map(s => parseInt(s.trim(), 10) - 1)
            .filter(n => !isNaN(n) && n >= 0);

        let userSeq = [];
        let isPlaying = false;
        let isChecking = false;

        const playNote = (idx) => {
            const btn = container.querySelector(`.music-btn[data-id="${idx}"]`);
            if (btn) {
                btn.classList.add("active");
                setTimeout(() => btn.classList.remove("active"), 350);
            }
            const customSrc = (config[`note${idx}`] || "").trim();
            const src = defaultNotes.find(note => note.toLowerCase() === customSrc.toLowerCase())
                || customSrc || defaultNotes[idx % 6];
            try {
                foundry.audio.AudioHelper.play({ src, volume: 0.85, autoplay: true }, true);
            } catch (err) {
                try {
                    const audio = new Audio(src);
                    audio.volume = 0.85;
                    audio.play();
                } catch (e) {}
            }
        };

        const playBtn = container.querySelector(".play-melody-btn");
        if (playBtn) {
            playBtn.addEventListener("click", () => {
                if (isPlaying || isChecking || targetSeq.length === 0) return;
                isPlaying = true;
                playBtn.disabled = true;
                userSeq = [];

                targetSeq.forEach((noteIdx, step) => {
                    setTimeout(() => {
                        playNote(noteIdx);
                        if (step === targetSeq.length - 1) {
                            setTimeout(() => {
                                isPlaying = false;
                                playBtn.disabled = false;
                            }, 450);
                        }
                    }, step * 650);
                });
            });
        }

        container.querySelectorAll(".music-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                if (isPlaying || isChecking || targetSeq.length === 0) return;
                const id = parseInt(e.currentTarget.dataset.id, 10);
                playNote(id);

                userSeq.push(id);

                if (userSeq.length >= targetSeq.length) {
                    isChecking = true;
                    const isMatch = userSeq.every((val, idx) => val === targetSeq[idx]);

                    if (isMatch) {
                        setTimeout(() => this.onUnlock(), 450);
                    } else {
                        setTimeout(() => {
                            userSeq = [];
                            isChecking = false;
                            const board = container.querySelector(".enigma-music-board");
                            if (board) {
                                board.classList.add("error-flash");
                                setTimeout(() => board.classList.remove("error-flash"), 450);
                            }
                            try {
                                foundry.audio.AudioHelper.play({ src: "modules/enigma-box/sounds/ComputerGameBeep01.wav", volume: 0.6, autoplay: true }, true);
                            } catch (err) {}
                        }, 350);
                    }
                }
            });
        });
    }
}