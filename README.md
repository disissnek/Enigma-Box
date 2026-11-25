[🇷🇺 Читать на русском (Russian)](#-enigma-box--интерактивные-головоломки-для-foundry-vtt-ru) | [🇬🇧 Read in English](#-enigma-box--interactive-puzzles-for-foundry-vtt-en)

<a id="en"></a>
# 🧩 Enigma Box | Interactive Puzzles for Foundry VTT (EN)

**Enigma Box** is a module that adds a system of customizable, visual interactive puzzles to Foundry VTT. It allows you to lock Doors (Walls), Chests (Tokens), and interactive objects (Tiles), turning a simple lockpicking dice roll into an engaging visual challenge for your players.

## ✨ Features

* **12 unique puzzle types:** From classic combination locks and levers to musical sequences and light mirrors.
* **Deep customization:** Upload your own background images, textures, and sounds.
* **Monk's Active Tile Triggers (MATT) Integration:** Full support for multi-step quests and "smart pause" triggers.
* **Localization:** Built-in support for English and Russian languages (with the ability to force the module language independently of the system language).

## 🛠 Installation

1. Open Foundry VTT and go to the **Add-on Modules** tab.
2. Click **Install Module**.
3. Paste the manifest URL of this module into the "Manifest URL" field and click Install.

**Required Dependencies:**
* [libWrapper](https://foundryvtt.com/packages/lib-wrapper) (Required for intercepting clicks on doors and chests).

**Recommended Modules:**
* [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles) (For creating complex quests and traps).

## 🧩 Available Puzzles

The module includes 12 fully customizable mechanics:

 1. **Item Slots:** Requires placing correct items from the inventory.
 2. **Fresco (Rotating Rings):** A classic puzzle with rotating discs.
 3. **Statue Rotator:** Turn the figures to face the correct directions.
 4. **Antique Clock:** Set the correct time on the dial.
 5. **Lever Panel:** Find the correct combination of lever positions.
 6. **Fact Matching:** Distribute text plaques under the correct portraits.
 7. **Musical Sequence:** Repeat a played melody using buttons.
 8. **Cryptex Lock:** A vertical combination drum lock with symbols or letters.
 9. **Bookshelf Timeline:** Arrange books on a shelf in the correct order.
10. **Numeric Keypad:** A classic dial with buttons.
11. **Password Panel:** A text input field with case sensitivity support.
12. **Light Mirrors:** Place mirrors on a grid to guide a beam from source to receiver.

## ⚙️ Core Mechanics and Setup

### How to set up a puzzle

1. Right-click the desired Token, Tile, or Door (Wall) on the scene.
2. A golden **"Enigma Box" puzzle icon** will appear in the HUD menu or in the header of the object's settings window.
3. Click the icon, check the **"Enable puzzle"** box, choose a type from the list, and configure the answers, backgrounds, and texts.

### GM Presence

Due to Foundry VTT core security restrictions, players cannot independently change the state of locked doors or walls. The module works via hidden sockets: a player solves the puzzle, sends a signal to the GM, and the GM's client physically opens the door. **If the GM is offline, progress is saved**, but the door itself will only open when the GM logs into the game.

### GM Mode (Bypass)

Foundry does not force the GM to solve their own puzzles. The GM can freely open doors and interact with objects as usual. If you want to bypass the puzzle trigger and open the chest settings, simply hold the **ALT** key while clicking.

## 🔗 MATT (Monk's Active Tile Triggers) Integration

Enigma Box works seamlessly with MATT:

* **Puzzle as a MATT action:** In the list of MATT tile actions (Triggers tab), there is a dedicated **"Enigma Box"** category with the **"Run Puzzle"** action.
* **Smart Pause:** Place this action first in the list of triggers. When a player steps on the tile, MATT will open the puzzle and **pause the script execution**. Only after a successful solve will MATT continue and execute the subsequent actions (teleport, give item, etc.).
* **Remote Activation:** In the puzzle settings itself, there is a *"Target tile ID"* field. Link the ID of another tile on the scene there, and upon success, it will trigger automatically (e.g., solving a puzzle on a pedestal opens a secret wall in another room).

## 🤝 Feedback and Bug Reports

If you encounter a bug or have ideas for new puzzles, please open an Issue in this repository!

*Made with love for the Foundry VTT community.*

---

<a id="ru"></a>
# 🧩 Enigma Box | Интерактивные головоломки для Foundry VTT (RU)

**Enigma Box** — это модуль, который добавляет в Foundry VTT систему настраиваемых визуальных интерактивных загадок. С его помощью вы можете заблокировать Двери (Стены), Сундуки (Токены) и интерактивные объекты (Тайлы), превращая обычный бросок кубиков на взлом в увлекательное визуальное испытание для ваших игроков.

## ✨ Особенности

* **12 видов уникальных головоломок:** от классических кодовых замков и рычагов до музыкальных секвенций и световых зеркал.
* **Глубокая кастомизация:** загружайте собственные фоновые изображения, текстуры и звуки.
* **Интеграция с Monk's Active Tile Triggers (MATT):** полная поддержка многоступенчатых квестов и триггеров с "умной паузой".
* **Локализация:** Встроенная поддержка русского и английского языков (с возможностью принудительного переключения языка модуля независимо от языка системы).

## 🛠 Установка

1. Откройте Foundry VTT и перейдите на вкладку **Add-on Modules**.
2. Нажмите **Install Module**.
3. Вставьте ссылку на манифест модуля в поле "Manifest URL" и нажмите Install.

**Обязательные зависимости:**
* [libWrapper](https://foundryvtt.com/packages/lib-wrapper) (Без него не будет работать перехват кликов по дверям и сундукам).

**Рекомендуемые модули:**
* [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles) (Для создания сложных квестов и ловушек).

## 🧩 Доступные загадки

Модуль включает 12 полностью настраиваемых механик:

 1. **Слоты для предметов:** требует поместить правильные предметы из инвентаря.
 2. **Фреска (Вращение колец):** классическая загадка с вращающимися дисками.
 3. **Вращение статуй:** поверните фигуры в правильном направлении.
 4. **Старинные часы:** выставьте правильное время на циферблате.
 5. **Панель с рычагами:** подберите правильную комбинацию положений рычагов.
 6. **Сопоставление фактов:** распределите текстовые таблички под правильными портретами.
 7. **Музыкальная секвенция:** повторите сыгранную мелодию на кнопках.
 8. **Кодовый криптекс:** вертикальный барабанный замок с символами или буквами.
 9. **Таймлайн (Книги):** расставьте книги на полке в правильном порядке.
10. **Кодовая панель:** классический циферблат с кнопками.
11. **Пароль:** текстовое поле ввода с поддержкой регистра.
12. **Световые зеркала:** расставьте зеркала на сетке, чтобы провести луч от источника к приемнику.

## ⚙️ Базовая механика и настройка

### Как настроить загадку

1. Нажмите правой кнопкой мыши по нужному Токену, Тайлу или Двери на сцене.
2. В круговом меню (HUD) или в шапке окна настроек объекта (рядом с крестиком закрытия) появится золотая **иконка пазла "Enigma Box"**.
3. Кликните по иконке, поставьте галочку **«Включить загадку»**, выберите тип из списка и настройте ответы, фоны и тексты.

### Присутствие Мастера (GM)

Из-за ограничений безопасности ядра Foundry VTT игроки не могут самостоятельно менять состояние закрытых дверей или стен. Модуль работает через скрытые сокеты: игрок решает загадку, отправляет сигнал Мастеру, и клиент ГМа физически открывает дверь. **Если Мастера нет в сети, прогресс сохранится**, но сама дверь откроется только тогда, когда Мастер зайдет в игру.

### Режим Мастера (Обход загадок)

Фаундри не обязывает ГМа решать собственные загадки. Мастер может свободно открывать двери и взаимодействовать с объектами как обычно. Если вы хотите обойти триггер загадки и открыть настройки объекта, просто зажмите клавишу **ALT** при клике.

## 🔗 Интеграция с MATT (Monk's Active Tile Triggers)

Enigma Box работает с MATT как единое целое:

* **Загадка как действие MATT:** В списке действий тайла MATT (вкладка Triggers) есть отдельная категория **«Enigma Box»** с действием **«Запустить загадку»**.
* **Умная пауза:** Поставьте это действие первым в списке триггеров. Когда игрок наступит на тайл, MATT откроет загадку и **поставит выполнение скрипта на паузу**. Только после успешного решения MATT продолжит работу и выполнит следующие действия (телепортирует, выдаст предмет и т.д.).
* **Удаленная активация:** В настройках самой загадки есть поле *«ID целевого тайла»*. Привяжите туда ID другого тайла на сцене, и после успеха он сработает автоматически (например, решив загадку на пьедестале, вы откроете секретную стену в другой комнате).

## 🤝 Обратная связь и баг-репорты

Если вы столкнулись с ошибкой или у вас есть идеи по новым загадкам, пожалуйста, создайте Issue в этом репозитории!
```eof

Теперь файл выглядит строго, профессионально и не содержит никаких отвлекающих элементов. Если нужно будет добавить что-то еще — дай знать!
