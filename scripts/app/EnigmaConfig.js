const MODULE_ID = "enigma-box";

const PUZZLE_REGISTRY = {
    "item-lock": { file: "ItemLock.js", className: "ItemLock" },
    "image-wheel": { file: "ImageWheel.js", className: "ImageWheel" },
    "statue-rotator": { file: "StatueRotator.js", className: "StatueRotator" },
    "clock-puzzle": { file: "ClockPuzzle.js", className: "ClockPuzzle" },
    "lever-puzzle": { file: "LeverPuzzle.js", className: "LeverPuzzle" },
    "match-puzzle": { file: "MatchPuzzle.js", className: "MatchPuzzle" },
    "music-puzzle": { file: "MusicPuzzle.js", className: "MusicPuzzle" },
    "cryptex-puzzle": { file: "CryptexPuzzle.js", className: "CryptexPuzzle" },
    "timeline-puzzle": { file: "TimelinePuzzle.js", className: "TimelinePuzzle" },
    "password-puzzle": { file: "PasswordPuzzle.js", className: "PasswordPuzzle" },
    "text-password": { file: "TextPasswordPuzzle.js", className: "TextPasswordPuzzle" },
    "mirror-puzzle": { file: "MirrorPuzzle.js", className: "MirrorPuzzle" }
};

function normalizeModulePath(val) {
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (/^modules\/enigma-box\/(img|sounds)\//i.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    return val;
}

export class EnigmaConfig extends FormApplication {
    constructor(document) {
        super();
        this.document = document;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["enigma-box-config"],
            template: `modules/${MODULE_ID}/templates/config.hbs`,
            width: 450,
            height: "auto",
            title: "Настройки Enigma Box",
            closeOnSubmit: true
        });
    }

    async getData() {
        const config = this.document.getFlag(MODULE_ID, "config") || {
            isActive: false,
            type: "item-lock",
            customTitle: "",
            description: "",
            successTileId: ""
        };

        let inputs = [];
        const entry = PUZZLE_REGISTRY[config.type];

        if (entry) {
            try {
                const mod = await import(`./${entry.file}`);
                const PuzzleClass = mod[entry.className];
                if (PuzzleClass?.formConfiguration?.inputs) {
                    inputs = PuzzleClass.formConfiguration.inputs;
                }
            } catch (err) {
                console.error(`Enigma Box | Ошибка загрузки настроек из ${entry.file}:`, err);
                ui.notifications.error(`Enigma Box: Не найден или сломан файл ${entry.file}`);
            }
        }

        inputs = inputs.map(i => {
            const rawVal = config[i.name] !== undefined ? config[i.name] : i.value;
            return {
                ...i,
                value: normalizeModulePath(rawVal)
            };
        });

        return { config, inputs };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('select[name="type"]').change(async (event) => {
            event.preventDefault();
            const config = this.document.getFlag(MODULE_ID, "config") || {};
            config.type = event.target.value;
            await this.document.setFlag(MODULE_ID, "config", config);
            this.render(true);
        });
    }

    async _updateObject(event, formData) {
        const config = this.document.getFlag(MODULE_ID, "config") || {};
        for (let [k, v] of Object.entries(formData)) {
            config[k] = normalizeModulePath(v);
        }
        await this.document.setFlag(MODULE_ID, "config", config);
        ui.notifications.success("Настройки Enigma Box сохранены!");
    }
}