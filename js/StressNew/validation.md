# Валидация — локальные валидаторы + агрегация в StressController (запуск / сохранение)

Путь кода: `Reports/js/StressNew/` (блоки `*Component/*Validator.js`, `StressValidator.js`, `StressController.js`, `StressScenarioResult.js`)  
Легаси (только чтение): **`Reports/js/Stress/index.js`** (`getStressParams`), **`Reports/js/Stress/stress-validator.js`**, **`Reports/js/Stress/constants.js`** (`StressValidationMessages`, `StressModes`), **`Reports/js/Stress/stress-input-rows.js`** (`chackValidInputOptions`, guard добавления строки), **`Reports/js/Stress/stress-output-rows.js`**.  
Эталон стиля плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**, **`OutputComponent/output.md`**.  
Контракты: **`docs/16-stress-controller-contracts.md`**, **`docs/ARCHITECTURE_LAYERS.md`**.

**Родительская задача плана:** п.15 — «Локальные валидаторы в компонентах + агрегация ошибок в StressController (запуск/сохранение)».

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Правила и **тексты сообщений** — в соответствующем `*Validator` (в том же файле, что и правило) | Тексты пользователю **символ в символ** как в легаси `Stress/constants.js` (только справочник при переносе) |
| Ошибки через `StressController.validate()` → `setMessages` по зонам | Для **run**: блокировка при ошибках; для **save**: мягкая проверка исторических дат (как в легаси) |
| Сквозные правила (дубли, исторические даты по всем Input) в `StressValidator` | `showDialog` на каждый клик — только там, где в легаси confirm (удаление); остальное — зоны сообщений |
| **Без** отдельного файла `StressValidationMessages.js` и без «общего словаря на весь StressNew» | Импорт из `Reports/js/Stress/`; **не** копировать `Reports/js/Common/constants.js` в StressNew |

**`*Validator`** — чистые функции над данными (`params`, `indicators`, агрегат `getData()`) **и** владелец своих формулировок ошибок. **View** только рисует `setMessages`; подсветка полей/строк по `meta` — минимально, без дублирования правил в view.

### Где лежат тексты (решение заказчика)

Классы валидаторов нужны **именно для этого**: правило и сообщение рядом, в своём блоке.

| Класс | Что хранит (примеры) |
|-------|----------------------|
| **`ParamsValidator`** | Период, версия прогноза, итерации, симуляции — тексты из легаси `PERIOD_VERSION_REQUIRED`, `PROGNOSIS_VERSION_REQUIRED` и т.д. |
| **`InputValidator`** | Guard «+», `chackValidInputOptions`, confirm-тексты Input (`CONFIRM_DELETE_*` для input) |
| **`OutputValidator`** | Guard «+», пустой Output при run, confirm Output |
| **`StressValidator`** | Дубли показателей, `validateInputParameters` по агрегату, формулировки уровня сценария (`INDICATORS_NOT_SUPPORTED` при run — если не в view) |
| **`StressController`** | Режимы `'runTest'` / `'save'` (как `StressModes` в легаси) — при необходимости статические поля **здесь**, без отдельного файла |

- Одинаковая фраза в двух блоках (например «Заполните обязательные поля!» у Input и Output) — **допустимо продублировать** в `InputValidator` и `OutputValidator`, чтобы не заводить общий файл.
- **`Reports/js/Common/constants.js`** — общий слой приложения (`ApiStatus`, `NEW_LINE`); при склейке списков ошибок можно **import** из Common, но **не** переносить туда стресс-сообщения и **не** дублировать Common целиком в StressNew.
- Тексты появляют **вместе** с подпунктом §1–§4, а не отдельной задачей «словарь наперёд».

**Когда вызываем полную проверку:** по кнопкам **`runTest`** / **`saveConfiguration`** (`StressView` → `sendTest` / `saveTestState`). **Не** на каждый `patchIndicator` (см. `input.md` §«П. 7.2 — отложено»). Исключение: **локальные** проверки по действию строки (`save` → `chackValidInputOptions`) — в контроллере Input, правило в `InputValidator`.

Критерий готовности подпункта: при тех же данных на форме **те же сообщения и тот же допуск/запрет** запуска и сохранения, что в легаси `getStressParams` + `RunTest` / save.

### Читаемость кода (заказчик)

В валидаторах — только правила и тексты; без jQuery, без `if (!el)` в validator. Разметка зон `[data-*-messages]` уже есть (Params/Input/Output п. 5.x / 7.3).

---

## Как работать по плану

1. Берём **один** подпункт за итерацию, реализуем, сверяем с легаси (сообщение + блокирует ли run/save).
2. В таблице: `[x]` — сделано, `[ ]` — нет.
3. Сначала **контракт ошибок** (раздел 0, без отдельного файла констант), затем **Params → Input → Output → StressValidator → координатор** (разделы 1–5); тексты — в том же шаге, что и правило в своём `*Validator`.
4. Confirm-диалоги и `chackValidInputOptions` на кнопке строки — раздел 6 (можно отдельными подпунктами после базового save/run).
5. **`checkIndicator` / `recheckAllIndicators`** при смене версии — **вне** этого плана; реализовано в Input/Output (`params.md` §6.2, C.1 **✓**).

---

## Текущее состояние StressNew (кратко)

| Область | Сейчас | Цель |
|---------|--------|------|
| `ParamsValidator` | Только `startDate` (массив `errors`) | Все обязательные поля params как в `getStressParams` |
| `InputValidator` | Заглушка `isValid: true` | Исторический диапазон / Excel; `chackValidInputOptions`; guard «+» |
| `OutputValidator` | `canAddRow` [x]; `validate` — пустой Output при `runTest` [x] | `indicatorId` при run (п. 3.3) |
| `StressValidator` | §4–5.4: дубли, исторические даты, DOM-run (`ListRow__error`, HistoricalRange) | — |
| `StressController.validate` | `MODE_RUN_TEST` / `MODE_SAVE`, проброс `{ mode, rez }` в `validateScenario` | [x] п. 5.1; DOM-run — п. 5.4 |
| `sendTest` / `saveTestState` | `validate` → `setMessages`; при успехе — `replaceAllZones` (п. 5.5) | [x] §5 |
| `StressScenarioResult.messagesFromValidation` | Раскладка params/input/output/scenario | `meta.rowIndex` ↔ `data-row` во view (п. 0.3) |
| `InputController.setParams` / `OutputController.setParams` | Без `validate` / `setMessages` при смене params. Input — `recalculate()`; Output — только `recheckAllIndicators()` при смене `versionId` (без `recalculate`) | [x] §2.5; Output hardening §1.2 |
| Confirm удаления | Input [x] §6.1–6.3; Output [x] §6.4 | `showDialog` через `StressApp` (§6.5) |

**Уже готово (не переделывать):** цепочка `StressView` → `sendTest`/`saveTestState` → `validate` → `StressScenarioResult` → `setMessages` → `*View.setMessages`; `buildStressModulePayload` в `StressService`.

---

## Границы (что входит / не входит)

| Входит в п.15 | Не входит |
|---------------|-----------|
| Локальные `ParamsValidator` / `InputValidator` / `OutputValidator` | Серверная `CheckFullStructure` (уже после локальной валидации в `sendTest`) |
| `StressValidator.validateScenario` (дубли, исторические даты, пустой Output при run) | `recheckAllIndicators` при смене версии — **`params.md` §6.2** (реализовано в Input/Output) |
| Сообщения в зонах params / input / output / scenario | Попапы ScenarioNodes, фильтры customePopUp |
| Guard «добавить строку» — текст в `InputValidator` / `OutputValidator` | Debounced auto-validate на каждое изменение (input.md 7.2) |
| Отдельный файл `StressValidationMessages.js` / общий словарь на StressNew | — |
| `chackValidInputOptions` при save строки Input | Полная валидация всех Options при каждом render |
| Confirm перед удалением (опционально в конце п.15) | Новые бизнес-правила, которых не было в легаси |

---

## Карта легаси → StressNew

| Легаси | Назначение | Куда в StressNew |
|--------|------------|------------------|
| `getStressParams(mode)` | Сбор payload + проверки перед run/save | `StressService.buildStressModulePayload` + **`StressController.validate()`** |
| `StressValidationMessages.*` | Тексты `showDialog` / сообщений | В **`ParamsValidator` / `InputValidator` / `OutputValidator` / `StressValidator`** (статические поля или приватные константы в классе; легаси — только для сверки текста) |
| `Validator.checkForDuplicates(rez)` | Дубли Input/Output | `StressValidator` (порт логики) |
| `Validator.validateInputParameters(rez)` | Исторический диапазон / Excel по строкам Input | `StressValidator` или `InputValidator` + вызов из `validateScenario` |
| `mode === runTest` + `OutputDataRows.length === 0` | Обязательность Output | `OutputValidator` + режим `run` в `validateScenario` |
| `ListRow__error` / `.error__message` при run | DOM-проверка перед run | `StressValidator` или отдельный метод координатора с **чтением DOM только в StressView** (см. 5.4) |
| `addNewInput` / `addNewOutput` guard | Три комбо params | `InputValidator` / `OutputValidator` → `canAddRow(params)`; контроллер показывает сообщение |
| `chackValidInputOptions` | Options values/probabilities | `InputValidator.validateRowOptions(row)` → `onSaveRow` |
| `save` + `VALUES_PROBABILITIES_MISMATCH` | `setMessages` input при save строки | `InputController.onSaveRow` + `InputValidator.VALUES_PROBABILITIES_MISMATCH` |
| run: strict / save: мягко для `validateInputParameters` | Разное поведение | `validate(mode)` или флаг в `StressController.validate({ mode })` |

---

## Контракт ошибок (целевой)

Согласован с `StressScenarioResult.messagesFromValidation`:

| Блок | Формат `errors` в `{ isValid, errors }` | Зона `setMessages` |
|------|-------------------------------------------|-------------------|
| **Params** | `string[]` (тексты как в легаси) | `zones.params` |
| **Input** | `{ [rowNumber: string]: string }` и/или `{ field: string }` | `zones.input`, `meta.rowIndex` → атрибут `data-row` |
| **Output** | то же | `zones.output` |
| **Scenario** | `string[]` или `{ type, text, meta? }[]` | `zones.scenario` (через `setScenarioUi`) |

Элемент сообщения для view: `{ type: 'error' | 'success', text: string, meta?: { rowIndex?, field?, source? } }`.

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | **Не создавать** отдельные файлы констант (`StressValidationMessages.js` и т.п.). Тексты — в классе валидатора своего блока; сквозные — в `StressValidator`. См. §«Где лежат тексты» | `*Validator.js`, `StressValidator.js` | `Stress/constants.js` (справочно) | [x] |
| 0.2 | Зафиксировать в JSDoc контракт `{ isValid, errors }` для каждого `*Validator.validate` | `*Validator.js`, `docs/16-stress-controller-contracts.md` §8 | — | [x] |
| 0.3 | Согласовать `meta`: `_pushKeyedErrors` → `rowIndex`; `InputView`/`OutputView.setMessages` → `data-row` из `meta.rowIndex` | `StressScenarioResult.js`, `InputView.js`, `OutputView.js` | — | [x] |
| 0.4 | `ParamsValidator` / `InputValidator` / `OutputValidator` — **без** `apiClient` в конструкторе (как сейчас в рабочей копии Params) | `*Validator.js` | каркас HEAD с apiClient — не возвращать | [x] |

---

### 1. ParamsValidator (локально)

| # | Шаг | Файлы | Легаси (`getStressParams`) | Статус |
|---|-----|-------|----------------------------|--------|
| 1.1 | `startDate` / `endDate` — правило + текст в `ParamsValidator` (легаси `PERIOD_VERSION_REQUIRED`) | `ParamsValidator.js` | ~69–84 | [x] |
| 1.2 | `versionId` — пустой комбо: в модели нет `versionId` (легаси ветка ~254–256 → `COULD_NOT_DETERMINE`; `PROGNOSIS_VERSION_REQUIRED` — val без data, отдельно при появлении в модели) | `ParamsValidator.js` | ~112–118, ~254–256 | [x] |
| 1.3 | `iterations` — правило + текст (легаси `ITERATION_COUNT_REQUIRED`) | `ParamsValidator.js` | ~121–127 | [x] |
| 1.4 | `simulations` — правило + текст (легаси `SIMULATION_COUNT_REQUIRED`) | `ParamsValidator.js` | ~130–136 | [x] |
| 1.5 | При отсутствии `versionId` — текст `COULD_NOT_DETERMINE_PROGNOSIS_VERSION` в `ParamsValidator` (если применимо) | `ParamsValidator.js` | ~254–256 | [x] |
| 1.6 | `ParamsController.validate()` — только делегирование; без UI | `ParamsController.js` | — | [x] частично |

---

### 1.x — `PROGNOSIS_VERSION_REQUIRED` (val без data) — **реализовано**

**Реализация:** `ParamsView.getValidationSnapshot()` передаёт `versionSelect2Val` и `versionSelect2Data` в `ParamsValidator._validateFromSnapshot`. Если `val()` не пустой, а `select2('data')` пустой — сообщение `PROGNOSIS_VERSION_REQUIRED` (как легаси `getStressParams`).

**BI:** ✓ 2026-06-24 (см. §3.5, матрица §3).

---

### 2. InputValidator (локально)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | `canAddRow(params)` → `{ ok, message? }`; текст guard «+» — **в `InputValidator`** (легаси `FILL_REQUIRED_FIELDS`) | `InputValidator.js`, `InputController.addNewIndicator` | `addNewInput` ~43–52 | [x] |
| 2.2 | `validateRowOptions(row)` — порт `chackValidInputOptions` (без DOM) | `InputValidator.js`, `InputController.onSaveRow` | ~383–404, save ~250–256 | [x] |
| 2.3 | При fail 2.2 — текст `VALUES_PROBABILITIES_MISMATCH` в **`InputValidator`**; показ — `setMessages` в зоне input (как п. 2.1, не `showDialog`) | `InputController.js` | ~255 | [x] |
| 2.4 | `SELECT_INDICATOR` при save строки — **не делаем** (легаси save без проверки `indicatorId`; пустая строка Input допустима) | — | save ~242–257 | [—] |
| 2.5 | Убрать `validate()` из `setParams` Input/Output; без `setMessages` при смене params. Input — `recalculate()`; Output — без `recalculate`, `recheckAllIndicators` при смене `versionId` | `InputController.js`, `OutputController.js` | `input.md` §7.2, `output.md` §7.1 | [x] |

---

### 2.x — пропущено (`SELECT_INDICATOR` на save строки Input)

**Решение (заказчик):** не реализуем. В легаси кнопка save строки Input проверяет только `chackValidInputOptions`; пустой показатель (`indicatorId == null`) можно сохранить в view — как и для Output.

`StressValidationMessages.SELECT_INDICATOR` в легаси — для других действий (например analytics), не для save строки. Текст в StressNew не добавляем.

Проверка заполненности показателей при **run/save сценария** — отдельно в §4 (`validateInputParameters`, DOM-run), не в локальном `onSaveRow`.

---

### 3. OutputValidator (локально)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 3.1 | `canAddRow(params)`; текст guard — **в `OutputValidator`** (тот же смысл, что легаси `FILL_REQUIRED_FIELDS`; дубль строки с Input допустим) | `OutputValidator.js`, `OutputController.addNewIndicator` | `addNewOutput` ~24–33 | [x] |
| 3.2 | `validate(rows, params, { mode })`: при `mode === 'runTest'` и пустой массив — текст в **`OutputValidator`** (легаси `OUTPUT_INDICATORS_NOT_FILLED`) | `OutputValidator.js`, `OutputController.validate`, `StressController.sendTest`/`saveTestState` | `getStressParams` ~95–100 | [x] |
| 3.3 | `indicatorId` по строкам Output при run — **не делаем** (в `getStressParams` нет; пустой показатель на save — §2.x) | — | `index.js` Output forEach | [—] |

---

### 3.x — пропущено (`indicatorId` по строкам Output при run)

**Решение:** не реализуем. В легаси `getStressParams` для Output только проверка `OutputDataRows.length === 0` при run (п. 3.2); строки с `indicatorId == null` всё равно попадают в `rez.Output`. Save строки — пустой показатель допустим (§2.x).

---

### 4. StressValidator (сквозные правила)

| # | Шаг | Файлы | Легаси `stress-validator.js` | Статус |
|---|-----|-------|------------------------------|--------|
| 4.1 | Порт `checkForDuplicates(data)` → `errors.scenario` или объединённые тексты в scenario (как `resCheck.details.join`) | `StressValidator.js` | `checkForDuplicates` | [x] |
| 4.2 | Порт `validateInputParameters(config)` → ошибки по номерам строк Input (`errors.input['3']` = текст) | `StressValidator.js` | `validateInputParameters` | [x] |
| 4.3 | `validateScenario`: **run** — `validateInputParameters` блокирует; **save** — не мержим в `errors.input`, `isValid` не снижаем (легаси ~236–237) | `StressValidator.js` | `getStressParams` ~229–237 | [x] |
| 4.4 | Агрегация: `isValid = paramsOk && inputOk && outputOk && scenarioOk` в `validateScenario` (input при run += `validateInputParameters`) | `StressValidator.js` | — | [x] |

---

### 5. StressController — запуск и сохранение

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | `validate({ mode })` — `MODE_RUN_TEST` / `MODE_SAVE` в **`StressController`**; проброс `{ mode }` в Output, `{ mode, rez }` в `StressValidator` (Input/Params без mode — по плану) | `StressController.js` | `StressModes` в легаси | [x] |
| 5.2 | `sendTest`: после локальной валидации — без изменения цепочки CheckFullStructure / startModelRisk | `StressController.js` | `RunTest` | [x] каркас |
| 5.3 | `saveTestState`: локальная валидация с `mode: 'save'` | `StressController.js` | save path | [x] каркас |
| 5.4 | **Run-only:** DOM → `StressView.getRunDomValidationState`; тексты и приоритет if/else — `StressValidator.evaluateRunDomChecks`; проброс `domState` в `validateScenario` при run | `StressView.js`, `StressValidator.js`, `StressController.js` | ~241–251 | [x] |
| 5.5 | При успехе run/save — `setMessages(..., { replaceAllZones: true })`: очистка params/input/output; success в `scenario` от `StressService` | `StressController.js`, `StressScenarioResult.js` | — | [x] |

---

### 6. Действия в UI (не save/run страницы)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 6.1 | Confirm `removeRow` Input — текст в **`InputValidator`**, `onRemoveRow` + `showDialog` (легаси `Exclamation`) | `InputValidator.js`, `InputController.js`, `InputView.js` | `stress-input-rows` ~230–239 | [x] |
| 6.2 | Confirm `fileRemove` — `getFileRemoveConfirmMessage`, `onFileRemove` + `showDialog` | `InputValidator.js`, `InputController.js`, `InputView.js` | `stress-input-rows` ~352–364 | [x] |
| 6.3 | Confirm `clearAllIndicators` Input — `getClearAllIndicatorsConfirmMessage`, `onClearAllIndicators` | `InputValidator.js`, `InputController.js`, `InputView.js` | `stress-ui.js` ~387–392 | [x] |
| 6.4 | Confirm Output: `removeRow`, `clearAllIndicators` — `OutputValidator` + `onRemoveRow` / `onClearAllIndicators` | `OutputValidator.js`, `OutputController.js`, `OutputView.js`, `StressController.js` | `stress-output-rows`, `stress-ui.js` | [x] |
| 6.5 | `setShowConfirmDialog` → Input + Output; `StressApp` + `CommonClass.showDialog` | `StressController.js`, `StressApp.js` | `common.showDialog` | [x] |

*Раздел 6 можно выполнять после 1–5, если заказчик хочет сначала только run/save.*

---

### 7. Завершение фазы п.15

| # | Шаг | Статус |
|---|-----|--------|
| 7.1 | Таблица сообщений легаси ↔ StressNew (ручная матрица 10–15 кейсов) | [x] |
| 7.2 | Run: пустой Output, пустой период, дубли Input — блокировка + диалог (как легаси) | [x] BI 2026-06-24 |
| 7.3 | Save: неверный исторический диапазон — сохранение разрешено (легаси) | [x] |
| 7.4 | Save строки Input: неверные probabilities — не переход в view | [x] BI 2026-06-24 |
| 7.5 | Обновить `input.md` / `output.md` / `params.md`: снять отсылки «п.15 отложено» для закрытых подпунктов | [x] 2026-06-24 |
| 7.6 | Ручная проверка validation на BI | [x] 2026-06-24 |

#### 7.1 — Матрица сообщений легаси ↔ StressNew

**Источник легаси (справочно):** `Reports/js/Stress/constants.js` (`StressValidationMessages`), `index.js` (`getStressParams`), `stress-validator.js`, `stress-input-rows.js`, `stress-output-rows.js`, `stress-ui.js`.  
**В рабочей копии:** каталога `Stress/` нет; колонка «Текст легаси» — по JSDoc/журналу переноса §0–§6 и совпадению с константами StressNew (перенос делался «символ в символ»).  
**Сверка:** ✓ совпадает / порт 1:1; ⊘ отложено в п.15; — вне scope п.15.

| # | Кейс / триггер | Легаси (ключ / файл) | Текст (легаси / StressNew) | StressNew | Зона / UI | Сверка |
|---|----------------|----------------------|----------------------------|-----------|-----------|--------|
| 1 | Пустой период версии прогноза | `PERIOD_VERSION_REQUIRED`, `getStressParams` ~69–84 | `Ошибка: Заполните поле "Период версии прогноза"` | `ParamsValidator.PERIOD_VERSION_REQUIRED` | `params`, run/save | ✓ |
| 2 | Версия прогноза не выбрана (`versionId` пустой) | `COULD_NOT_DETERMINE_PROGNOSIS_VERSION`, ~254–256 | `Не удалось определить прогноз версии` | `ParamsValidator.COULD_NOT_DETERMINE_PROGNOSIS_VERSION` | `params`, run/save | ✓ |
| 3 | В комбо `val` есть, `select2('data')` пустой | `PROGNOSIS_VERSION_REQUIRED` | `Ошибка: Заполните поле "Версия прогноза"` | `ParamsValidator.PROGNOSIS_VERSION_REQUIRED` | `params`, run/save (диалог) | ✓ |
| 4 | Пустые итерации | `ITERATION_COUNT_REQUIRED`, ~121–127 | `Ошибка: Заполните поле "Количество итераций расчета"` | `ParamsValidator.ITERATION_COUNT_REQUIRED` | `params`, run/save | ✓ |
| 5 | Пустые симуляции | `SIMULATION_COUNT_REQUIRED`, ~130–136 | `Ошибка: Заполните поле "Количество симуляций"` | `ParamsValidator.SIMULATION_COUNT_REQUIRED` | `params`, run/save | ✓ |
| 6 | «+» Input без params (version/iterations/simulations) | `FILL_REQUIRED_FIELDS`, `addNewInput` ~43–52 | `Заполните обязательные поля!` | `InputValidator.FILL_REQUIRED_FIELDS` | `input`, `setMessages` | ✓ |
| 7 | «+» Output без params | `FILL_REQUIRED_FIELDS`, `addNewOutput` ~24–33 | `Заполните обязательные поля!` | `OutputValidator.FILL_REQUIRED_FIELDS` | `output`, `setMessages` | ✓ |
| 8 | Run, список Output пуст | `OUTPUT_INDICATORS_NOT_FILLED`, `getStressParams` ~95–100 | `Не заполнены Output-показатели` | `OutputValidator.OUTPUT_INDICATORS_NOT_FILLED` | `output`, только `runTest` | ✓ |
| 9 | Save строки Input, options не сходятся | `VALUES_PROBABILITIES_MISMATCH`, save ~255 | `Значения values и probabilities не равны !` | `InputValidator.VALUES_PROBABILITIES_MISMATCH` | `input`, `onSaveRow` + `meta.rowIndex` | ✓ |
| 10 | Run, нет дат/Excel по строке Input | `validateInputParameters`, `stress-validator.js` | `Не задан исторический диапазон для INPUT-показателя #N (имя)` | `StressValidator.validateInputParameters` (шаблон) | `input`, ключ `"N"`, только run | ✓ |
| 11 | Run, нет массива Input в payload | `validateInputParameters` | `Неверная структура конфигурации: отсутствуют INPUT-параметры` | `StressValidator.INPUT_CONFIG_INVALID` | `input`, ключ `form` | ✓ |
| 12 | Run, DOM `ListRow__error` | `INDICATORS_NOT_SUPPORTED`, ~245–247 | Два абзаца: «Некоторые из выбранных показателей не поддерживаются…» + «Пожалуйста, измените набор…» | `StressValidator.INDICATORS_NOT_SUPPORTED` | `scenario`, run | ✓ |
| 13 | Run, DOM HistoricalRange `.error__message` | `INVALID_HISTORICAL_RANGE`, ~248–250 | `У некоторых выбранных показателей некорректный исторический диапазон` | `StressValidator.INVALID_HISTORICAL_RANGE` | `scenario`, run | ✓ |
| 14 | Дубли Input (с/без аналитики) | `checkForDuplicates`, `stress-validator.js` | `Дубль INPUT найден: …` (динамика, join `NEW_LINE`) | `StressValidator.checkForDuplicates` | `scenario`, run/save | ✓ порт §4.1 |
| 15 | Дубли Output | то же | `Дубль OUTPUT найден: …` / `Оригинал: …` | то же | `scenario` | ✓ порт §4.1 |
| 16 | Confirm удалить строку Input | `CONFIRM_DELETE_INDICATOR`, ~232 | `Вы уверены, что хотите удалить показатель ?` | `InputValidator.CONFIRM_DELETE_INDICATOR` | `showDialog` Exclamation | ✓ |
| 17 | Confirm удалить файл Excel | `CONFIRM_DELETE_FILE`, ~357 | `Вы уверены, что хотите удалить файл ?` | `InputValidator.CONFIRM_DELETE_FILE` | `showDialog` | ✓ |
| 18 | Confirm очистить все Input | `CONFIRM_DELETE_ALL_INPUT`, `stress-ui` ~388 | `Вы уверены, что хотите удалить все Input показатели?` | `InputValidator.CONFIRM_DELETE_ALL_INPUT` | `showDialog` | ✓ |
| 19 | Confirm удалить строку Output | `CONFIRM_DELETE_OUTPUT_INDICATOR`, ~173 | `Вы уверены, что хотите удалить показатель ?` | `OutputValidator.CONFIRM_DELETE_OUTPUT_INDICATOR` | `showDialog` | ✓ |
| 20 | Confirm очистить все Output | `CONFIRM_DELETE_ALL_OUTPUT`, `stress-ui` ~396 | `Вы уверены, что хотите удалить все Output показатели?` | `OutputValidator.CONFIRM_DELETE_ALL_OUTPUT` | `showDialog` | ✓ |

**Вне матрицы (не переносим):** `SELECT_INDICATOR` (guard analytics — отдельно), серверные тексты после `CheckFullStructure`, confirm перезапуска `StressIdPopUp`.

**Run/save UI:** ошибки локальной валидации — **модальный диалог** (`StressController._notifyValidationDialog`), как легасi `showDialog`; не inline `warning__text` в блоках.

**Поведение run/save (не текст):** при **save** сценария ошибки п. 10 **не** блокируют и **не** попадают в зону input (§4.3) — отдельно **7.3**.

---

## Связь с планами блоков

| Блок | Что уже отложено в блок-плане | Закрывается в `validation.md` |
|------|------------------------------|-------------------------------|
| **Params** | `ParamsValidator` — п.15 | §1 |
| **Input** | guard без UI, `chackValidInputOptions`, confirm, 7.2 | §2, §6 |
| **Output** | guard, пустой список при run, confirm | §3, §6 |
| **Координатор** | `validate` + `setMessages` при run/save | §4–5 |

После п.15 можно вернуться к **6.2** `checkIndicator` (`params.md`) — это серверная проверка строк, не дублирует локальные валидаторы.

---

## Проверка на BI / сервере

**Приёмка validation 2026-06-24** (заказчик): §7.2, §7.4, §7.6 — **✓**.

- [x] Запуск без Output — диалог, тест не уходит.
- [x] Запуск с `ListRow__error` — `INDICATORS_NOT_SUPPORTED` (код п. 5.4; BI — §7.6).
- [x] Сохранение при предупреждении по историческим датам — сохраняется (легаси, п. 4.3).
- [x] Дубли показателей с одинаковой аналитикой — текст из `checkForDuplicates` (диалог scenario).
- [x] Пустой период / версия прогноза — блокировка run, тексты как в легаси.
- [x] «+» Input/Output без комбо params — `FILL_REQUIRED_FIELDS` (зона блока).
- [x] Save строки Input с несогласованными options — `VALUES_PROBABILITIES_MISMATCH`.

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-06-03 | — | — | Создан план `validation.md` (п.15) |
| 2026-06-03 | 0.1 | — | Зафиксировано: тексты в `*Validator`, без отдельных файлов констант; Common не дублировать |
| 2026-06-03 | 0.2 | — | JSDoc: `ParamsValidationResult`, `KeyedValidationResult`, `ScenarioValidationResult`; §8 в `16-stress-controller-contracts.md`; Input `errors: {}` |
| 2026-06-03 | 0.3 | — | `InputView`/`OutputView.setMessages`: `data-row` из `meta.rowIndex`; JSDoc в `_pushKeyedErrors` |
| 2026-06-03 | 0.4 | — | Блочные `*Validator` без `apiClient`; `new *Validator()` в Controller; §8 `16-stress-controller-contracts.md` |
| 2026-06-03 | 1.1 | — | `ParamsValidator`: `startDate` + `endDate`, текст `PERIOD_VERSION_REQUIRED` |
| 2026-06-03 | 1.2 | — | `ParamsValidator`: `versionId`, текст `PROGNOSIS_VERSION_REQUIRED` |
| 2026-06-03 | 1.3 | — | `ParamsValidator`: `iterations`, текст `ITERATION_COUNT_REQUIRED` |
| 2026-06-03 | 1.4 | — | `ParamsValidator`: `simulations`, текст `SIMULATION_COUNT_REQUIRED` |
| 2026-06-03 | 1.5 | — | Пустой `versionId` → `COULD_NOT_DETERMINE_PROGNOSIS_VERSION` (легаси ~254–256) |
| 2026-06-03 | 1.x | — | `PROGNOSIS_VERSION_REQUIRED` — реализовано через `getValidationSnapshot` + логика `selectedId !== null` (легасi `getStressParams`) |
| 2026-06-03 | 2.1 | — | `InputValidator.canAddRow`; `addNewIndicator` → `setMessages` при отказе; убран `_canAddNewIndicator` |
| 2026-06-03 | 2.2 | — | `InputValidator.validateRowOptions`; `onSaveRow` не переключает view при fail |
| 2026-06-03 | 2.3 | — | `VALUES_PROBABILITIES_MISMATCH`; `onSaveRow` → `setMessages` + `meta.rowIndex` |
| 2026-06-03 | 2.4 | — | Пропущено: `SELECT_INDICATOR` на save — в легаси пустой Input/Output на save допустим |
| 2026-06-03 | 2.5 | — | `InputController` / `OutputController.setParams`: убран `validate()`; без `setMessages` при смене params |
| 2026-06-25 | 2.5 | — | Синхронизация docs: Output `setParams` без `recalculate` (hardening §1.2) |
| 2026-06-03 | 3.1 | — | `OutputValidator.canAddRow`; `addNewIndicator` → `setMessages`; убран `_canAddNewIndicator` |
| 2026-06-03 | 3.2 | — | `OUTPUT_INDICATORS_NOT_FILLED` при `runTest` + пустой `indicators`; `sendTest`/`saveTestState` → `mode` |
| 2026-06-03 | 3.3 | — | Пропущено: `indicatorId` по строкам Output при run — нет в легаси `getStressParams` |
| 2026-06-03 | 4.1 | — | `StressValidator.checkForDuplicates`; `validateScenario` → `errors.scenario` (join `NEW_LINE`) |
| 2026-06-03 | 4.2 | — | `validateInputParameters` → `errors.input[row]`; тексты как в легаси |
| 2026-06-03 | 4.3 | — | run блокирует; save не мержит исторические ошибки в UI/`isValid` |
| 2026-06-03 | 4.4 | — | Явная агрегация `paramsOk && inputOk && outputOk && scenarioOk` в `validateScenario` |
| 2026-06-04 | 5.1 | — | `StressController.MODE_RUN_TEST` / `MODE_SAVE`; `validateScenario(..., { mode, rez })`; Output — `{ mode }`; Input без mode |
| 2026-06-04 | 5.4 | — | `StressView.getRunDomValidationState`; `StressValidator.evaluateRunDomChecks` + тексты легаси; `domState` в `validate()` при run |
| 2026-06-04 | 5.5 | — | `normalizeMessageZones` + `replaceAllZones` при `out.ok` в `sendTest` / `saveTestState` |
| 2026-06-04 | 6.1 | — | `InputValidator.CONFIRM_DELETE_INDICATOR`; `onRemoveRow` → `showDialog` → `removeIndicator` |
| 2026-06-04 | 6.5 | — | `StressController.setShowConfirmDialog`; `StressApp` → `CommonClass.showDialog` (Exclamation) |
| 2026-06-04 | 6.2 | — | `CONFIRM_DELETE_FILE`; `onFileRemove` → confirm → `removeExcelFromRow` |
| 2026-06-04 | 6.3 | — | `CONFIRM_DELETE_ALL_INPUT`; `onClearAllIndicators` → `clearAllIndicators` |
| 2026-06-04 | 6.4 | — | Output: `onRemoveRow`, `onClearAllIndicators`; проброс confirm в `StressController` |
| 2026-06-04 | 6.5 | — | `setShowConfirmDialog` также для Output (закрытие §6) |
| 2026-06-04 | 7.1 | — | Матрица 20 кейсов: легаси `StressValidationMessages` / `stress-validator` ↔ `*Validator.js`; §7.1 [x] |
| 2026-06-24 | 7.2 | — | BI: пустой Output, пустой период, дубли Input — блокировка + диалог ✓ |
| 2026-06-24 | 7.4 | — | BI: save строки Input, probabilities — ✓ |
| 2026-06-24 | 7.5 | — | Docs: `input.md`, `output.md`, `params.md` — сняты «п.15 отложено» |
| 2026-06-24 | 7.6 | — | BI validation run/save — ✓; `_notifyValidationDialog` (диалог, как легаси) |
| 2026-06-25 | docs | — | C.1: `recheckAllIndicators` при смене версии — реализовано в Input/Output; §«Следующий шаг» и границы обновлены |

---

## Следующий шаг

**Фаза п.15 закрыта** (осознанный пробел: auto-validate на patch — `input.md` §7.2).

**B.1** — формальная сверка payload с легаси (`REFACTORING_REMAINING.md` §2).
