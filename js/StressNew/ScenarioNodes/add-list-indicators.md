# AddListIndicators — план переноса, контракты Input/Output

Путь кода: `Reports/js/StressNew/ScenarioNodes/AddListIndicators/`  
Легаси (только чтение): **`Reports/js/Stress/stress-add-list.js`** (`AddListIndicators` ~120 строк), **`Reports/js/Stress/stress-ui.js`** (`handleGetStressTestVersionsResponse` → `PrognozVersionEls`, `addListIndicators.init()`), **`Reports/js/Stress/index.js`** (глобальный `Stress.addListIndicators`).  
Справочно при переносе UI: **`utils.js`** (`formatState`, `formatSelected`, `initSelect2Event`) — **не импортировать**; копировать в `*View` приватными методами.  
Эталон архитектуры и стиль плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**, **`OutputComponent/output.md`**, **`ScenarioNodes/analytics-analysis-popups.md`** (п.18).  
Контракты координатора: **`docs/16-stress-controller-contracts.md`** §4–5 (узел создаётся в зоне Input/Output, не в `StressController`).

**Родительская задача плана:** п.17 — «AddListIndicators: новые контракты, связь Input/Output» (`stress-refactor-tasks.md` **T4.2**).

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `*Controller` / `*Service` / `*View` / `*Validator` в `ScenarioNodes/AddListIndicators/` | Разметка модалки `#select_AddListIndicators_block`, CSS `.modal-custom__AddListIndicators`, `#AddListIndicatorsSelect` |
| Открытие и «Скопировать» через колбеки `InputController` / `OutputController` | Select2 на комбо версий, кнопка «Скопировать», inline-ошибка «Не заполнено поле!» — как в легаси |
| Список версий и API — через `*Service` → `StressApi`; без глобального `stress` | Поведение: **полная замена** списка строк Input или Output выбранным блоком из другой версии стресс-теста |
| Закрытие модалки и copy — через view → controller, не `onclick="Reports.Stress.addListIndicators.*"` | Оверлей `waiter` при copy (`"Copy List"`) — как `common.waiter` в легаси |
| Экземпляр попапа на блок (`'Input'` / `'Output'`), не один глобальный | Формат ответа `GetStressVersion` → `getValidData` → `Input` / `Output` в JSON |

**`*View` попапа** — без прямых вызовов Fore/API; модули → `*Service` → `StressApi`. UI-хелперы из легаси — **только копия в view**, без `import` из `Stress/`.

Критерий готовности подпункта: на той же HTML-странице модалка **выглядит и ведёт себя** как до рефакторинга (сравнение с легаси).

### Читаемость кода (заказчик)

Не размножать в `*View` и контроллерах попапа проверки «на всякий случай» на каждый DOM-узел. Разметку модалок считаем **как в `StressConf.html`**. См. **`input.md`** п.0.3, **`stressnew.mdc`**.

### Явные аргументы (заказчик, п.17+)

**Запрещён** паттерн `constructor(options)` с раскладкой `this.getParams = options.getParams` и т.п.

| Плохо | Хорошо |
|-------|--------|
| `new AddListIndicatorsController({ apiClient, getParams, onCopy })` | `new AddListIndicatorsController(service, 'Input', () => this.params, (rows) => this._onAddListCopy(rows))` |

- Экземпляр создаётся в **`InputController`** или **`OutputController`** (не один глобальный на оба блока) → `table` фиксирован при `new`; аргумент `_table` в `openIndicatorsList` — **no-op** (как п.18).
- Колбеки — **отдельные аргументы**, не поля внутри `options`.
- Зафиксировано в **`.cursor/rules/stressnew.mdc`**.

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию, реализуем, проверяем на странице отчёта (или сверка с легаси).
2. В таблице: `[x]` — сделано, `[ ]` — нет, `[—]` — вне scope / намеренный пропуск.
3. **`AddListIndicatorsValidator`** — минимально; inline guard «Не заполнено поле!» — во view + вызов validator при необходимости (как легаси в `copy()`).
4. Confirm перед заменой всего списка — **не в легаси**; не добавляем без явного запроса заказчика.

---

## Текущее состояние StressNew (кратко)

| Область | Статус |
|---------|--------|
| `ScenarioNodes/AddListIndicators/*` | готово (§0–5) |
| `InputView` / `OutputView` → `openIndicatorsList` → `addListIndicatorsController.openModal()` | готово |
| `StressConf.html` — модалка без `onclick="Reports.Stress.addListIndicators.*"` | готово (§6.2) |
| `applyLoadedIndicatorRows` / copy / `getData()` → `buildStressModulePayload` | готово (§5.3–5.4) |
| Ручная проверка на BI | отложена (§6.4) |

---

## Границы (что входит / не входит)

| Входит в п.17 | Не входит (другие пункты плана) |
|---------------|----------------------------------|
| Перенос **`AddListIndicators`**: init Select2, `openModal`, `closeModal`, `copy` | **`AnalyticsPopUp` / `AnalysisPopUp`** — п.18 (готово) |
| Открытие из шапки Input/Output (`data-stress-action`) | **`SelectDistribution`**, Chart — п.16 |
| `GetStressVersion` + `getValidData` → замена `indicators` в одном блоке | **`UploadFilePopUp` / `ArrayDataPopUp`** — п.19 |
| Замена legacy `onclick` на модалке | Confirm «заменить весь список?» — **нет в легаси** |
| Waiter при copy (проброс `setWaiter` из блока) | Смена **params** (даты, версия прогноза) при copy — легаси не меняет |
| Bind view при первом `bindView` блока (§6.1) | Полный `validate()` save/run — п.15 |
| | Прогон на рабочем BI (см. конец файла) |

---

## Карта легаси → StressNew

| Легаси | Назначение | Куда в StressNew |
|--------|------------|------------------|
| `AddListIndicators` в `stress-add-list.js` | Модалка «Добавить список» | `ScenarioNodes/AddListIndicators/*` |
| `constructor(stress, getUserId)` | Зависимости | `AddListIndicatorsService(apiClient)` + `() => this.params` из блока; `userId` — `apiClient.getUserId()` в service |
| `init()` | Select2 на `#AddListIndicatorsSelect` (базовая конфигурация) | `AddListIndicatorsView.bind` + `_initVersionSelect2` |
| `openModal(table)` | Запомнить table, заполнить Select2 из `PrognozVersionEls`, показать модалку | `openModal()`: `table` из `this.table`; опции — `service.loadStressTestVersionOptions(prognozVersionId)` |
| `PrognozVersionEls` | Список версий стресс-теста | `ParamsService.loadStressTestVersions` (тот же API `GetStressTestVersions`); `prognozVersionId` из `getParams().versionId` |
| `copy()` | `GetStressVersion` → `getValidData` → `renderInput` / `renderOutput` | `service.fetchRowsForCopy` + `onCopy(rows)` → `setIndicators(rows)` |
| `PrognozVersionComboSelected` при copy | Текущая версия прогноза для аргумента `version` API | `getParams().versionId` |
| `closeModal()` | Скрыть, сбросить select, убрать error | `AddListIndicatorsView.closeModal` |
| Пустой выбор при copy | Inline «Не заполнено поле!» | `AddListIndicatorsView.showFieldRequiredError` |
| `stress.common.waiter` | show/hide `"Copy List"` | `InputController._withWaiter` / `setWaiter` → `AddListIndicatorsController.setWaiter` или колбек из блока |
| `Stress.addListIndicators` глобально | Один экземпляр | Экземпляры в **`InputController`** / **`OutputController`** |
| Toolbar «Добавить список» | `addListIndicators.openModal` | Уже: `InputView` / `OutputView` → `openIndicatorsList` |

### Цепочка copy (легаси, сохраняем)

```text
1. Пользователь выбрал версию стресс-теста в #AddListIndicatorsSelect (id = item.key из GetStressTestVersions).
2. GetStressVersion({ StressVersion: id }, userId, текущий prognozVersionId).
3. getValidData(json, json.prognozVersion, userId).
4. Если ответ ERROR / faultstring — взять сырой json из шага 2 (как легаси).
5. Иначе — JSON.parse(message).
6. Input: заменить список на res.Input; Output: на res.Output.
7. closeModal; hide waiter.
```

---

## Контракт колбеков (целевой)

Согласован с **`16-stress-controller-contracts.md`** и п.18: координатор **не** владеет попапом.

### Сборка

```text
StressController
  └─ InputController(new InputService(apiClient), onChange)   // без ScenarioNodes

InputController (конструктор)
  └─ this.addListIndicatorsController = this._createAddListIndicatorsController(inputService.apiClient)

Метод `_createAddListIndicatorsController(apiClient)` — сборка `new AddListIndicatorsController(...)`;
`view.bind(root)` — в `_bindPopUpViewsOnce` (§6.1), вместе с analytics/analysis.
```

Симметрично **`OutputController`**. Правок **`StressController`** нет (кроме уже существующего `setWaiter`).

### AddListIndicatorsController

```text
InputController / OutputController (конструктор)
  └─ this.addListIndicatorsController = new AddListIndicatorsController(
       new AddListIndicatorsService(inputService.apiClient),
       'Input',
       () => this.params,
       (rows) => this._onAddListIndicatorsCopy(rows)
     )
```

**`getParams`** — минимум `{ versionId }` для API; блок передаёт `this.params` (уже синхронизируется из `StressController.onParamsChanged`).

**`onCopy` (минимум):**

1. `await this.applyLoadedIndicatorRows(rows)` — тот же путь, что `applyStructureRowsFromParams` (§5.3).
2. `_notifyIndicatorsChanged()` — колбек в координатор без auto-validate (как п.18 / `input.md` §П. 7.2).

**`openIndicatorsList` в блоке:**

```js
openIndicatorsList(_table) {
  void _table
  void this.addListIndicatorsController.openModal()
}
```

**Waiter (§5.2):** `AddListIndicatorsController.setWaiter(show, hide)` или использование `_withWaiter` блока через метод-обёртку `copy()` в контроллере блока — на выбор реализации; токен **`'Copy List'`** как в легаси.

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | Создать `AddListIndicators/`: `AddListIndicatorsController`, `AddListIndicatorsService`, `AddListIndicatorsView`, `AddListIndicatorsValidator`; `export` классов; `import` только из ScenarioNodes и `InputController` / `OutputController` | `ScenarioNodes/AddListIndicators/*.js` | каркас T4.2 | [x] |
| 0.2 | Конструктор — **явные аргументы** `(service, table, getParams, onCopy)`; jQuery / Select2 только в `*View`; Service → `StressApi` | `*Controller.js`, `*View.js`, `*Service.js` | `stress-add-list.js` | [x] |
| 0.3 | ~~Массовые проверки DOM~~ **не делаем** (как `input.md` п.0.3). | этот файл | — | [—] |

---

### 1. AddListIndicators — каркас и bind модалки

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `AddListIndicatorsView.bind(root)`: `#select_AddListIndicators_block`, `#AddListIndicatorsSelect`; `openModal` / `closeModal` (класс `Hidden`) | `AddListIndicatorsView.js` | open/close | [x] |
| 1.2 | Базовый Select2 на комбо (multiple, `maximumSelectionLength: 1`, `initSelect2Event` — копия в view) | `AddListIndicatorsView.js` | `init()` | [x] |
| 1.3 | Закрытие по крестику: убрать `Reports.Stress.addListIndicators.closeModal` — bind во view | `AddListIndicatorsView.js`, `StressConf.html` | onclick ~597 | [x] |
| 1.4 | Экземпляр на блок: `_createAddListIndicatorsController` в `InputController` / `OutputController` | `*Controller.js` | `index.js` global | [x] |

---

### 2. Открытие из шапки Input/Output

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | `openModal`: загрузить опции версий стресс-теста по `getParams().versionId`; Select2 `data` в формате `id#;name` (как `handleGetStressTestVersionsResponse`) | `AddListIndicatorsController.js`, `AddListIndicatorsService.js` | `openModal`, `PrognozVersionEls` | [x] |
| 2.2 | `formatState` / `formatSelected` / `matcher` на комбо — копия в view (как легаси / `ParamsView`) | `AddListIndicatorsView.js` | `openModal` select2 opts | [x] |
| 2.3 | Scroll to top при открытии (`$('html').animate`) | `AddListIndicatorsView.js` | `openModal` | [x] |
| 2.4 | `InputController.openIndicatorsList` / `OutputController.openIndicatorsList` → `addListIndicatorsController.openModal()` | `*Controller.js` | toolbar | [x] |
| 2.5 | Guard: нет `versionId` в params — опции пустые; поведение как пустой `PrognozVersionEls` (без нового диалога, если легаси так) | `AddListIndicatorsController.js` | — | [x] |

---

### 3. Copy — API и замена списка

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 3.1 | `AddListIndicatorsService.fetchRowsForCopy(stressVersionId, prognozVersionId, table)`: `getStressVersion` → `getValidData` → parse; fallback на сырой json при ERROR/faultstring | `AddListIndicatorsService.js`, `StressApi.js` | `copy()` then-chain | [x] |
| 3.2 | Вернуть `Input` или `Output` массив в зависимости от `table` | `AddListIndicatorsService.js` | `StressModes.INPUT/OUTPUT` | [x] |
| 3.3 | Bind кнопки «Скопировать» (`data-btn="copy"`): view → `controller.handleCopy` | `AddListIndicatorsView.js`, `StressConf.html` | onclick ~621 | [x] |
| 3.4 | Пустой выбор: inline error «Не заполнено поле!» на `.SelectAnalysisItem`; не вызывать API | `AddListIndicatorsView.js`, `AddListIndicatorsValidator.js` | `copy()` else-branch | [x] |
| 3.5 | `InputController._onAddListIndicatorsCopy` / Output: `setIndicators` + `_notifyIndicatorsChanged` | `*Controller.js` | `renderInput` / `renderOutput` | [x] |
| 3.6 | После успешного copy: `closeModal`, сброс ошибки поля | `AddListIndicatorsController.js` | — | [x] |

---

### 4. Waiter и ошибки API

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 4.1 | Waiter `'Copy List'` на время `fetchRowsForCopy` + `onCopy` | `AddListIndicatorsController.js`, `*Controller.js` | `common.waiter` | [x] |
| 4.2 | Проброс `setWaiter` из блока (как analytics / `checkIndicator`) | `*Controller.js` | — | [x] |
| 4.3 | Ошибка сети / не-OK `GetStressVersion`: закрыть waiter; UI-сообщение — минимум (console / без диалога, если легаси молчит) | `AddListIndicatorsController.js` | then без catch | [x] |

---

### 5. Согласование с Input / Output

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | Расширить `_bindPopUpViewsOnce`: `addListIndicatorsController.view.bind(scope)` | `InputController.js`, `OutputController.js` | init page | [x] |
| 5.2 | Два экземпляра на одну модалку в DOM — как п.18: открывает тот блок, чья кнопка шапки; `table` зафиксирован в конструкторе | этот файл | один global | [x] |
| 5.3 | Сверка: строки после copy проходят `_normalizeIndicatorRow` / `_prepareIndicatorRow` так же, как при `applyStructureRowsFromParams` | `InputController.js`, `OutputController.js` | `renderInput(data)` | [x] |
| 5.4 | `getData()` после copy — формат строк для save/run без регрессий (поля key/name, analytics, distribution) | `StressService.js` | save payload | [x] |

---

### 6. Завершение фазы п.17

| # | Шаг | Статус |
|---|-----|--------|
| 6.1 | Пройти чеклист 0–5 для Input и Output | [x] |
| 6.2 | Убедиться: нет рабочих `onclick="Reports.Stress.addListIndicators.*"` в `StressConf.html` StressNew | [x] |
| 6.3 | Обновить ссылки в `input.md` / `output.md` (границы, «Следующий шаг») | [x] |
| 6.4 | Ручная проверка на BI — smoke 2026-06-22 | [x] |

---

## Чеклист 6.1 (сверка по коду, Input и Output)

| § | Input | Output |
|---|-------|--------|
| 0 | `AddListIndicatorsController` в конструкторе; `(service, 'Input', …)` | то же, `'Output'` |
| 1 | `view.bind` в `_bindPopUpViewsOnce`; close/copy через view | симметрично |
| 2 | `data-stress-action="openInputIndicatorsList"` → `openIndicatorsList` → `openModal` | `openOutputIndicatorsList` |
| 3 | `onCopy` → `applyLoadedIndicatorRows`; waiter `'Copy List'` | симметрично |
| 4 | `setWaiter` → `addListIndicatorsController.setWaiter` | симметрично |
| 5 | `setAsActive` при open; copy в активный блок; `applyLoadedIndicatorRows` | симметрично |

`StressController` попап не импортирует; `params.versionId` пробрасывается через `this.params` блока.

---

## checkIndicator — частично закрыто блоком

**Легаси:** после `renderInput` / `renderOutput` строки могут иметь `status`; отдельного массового `checkIndicator` в `copy()` нет.

**StressNew:** `setIndicators` уже вызывает **`_checkIndicatorsWithoutStatus`** для строк без `status` (Input; симметрично проверить Output).

**В п.17:** дополнительный `recheckAllIndicators` после copy **не обязателен**, unless заказчик явно включит подпункт **5.5**.

---

## Confirm перед заменой списка — вне scope

Легаси **не** спрашивает подтверждение перед заменой всего списка (в отличие от «Очистить список»). В п.17 **не добавляем** confirm на copy без отдельного согласования.

---

## Вне этого файла

- **`AnalyticsPopUp` / `AnalysisPopUp`** — п.18 (готово).
- **`SelectDistribution`**, Chart — п.16.
- **`UploadFilePopUp` / `ArrayDataPopUp`** — п.19.
- **`validation.md`** — save/run validation **реализовано** (п.15 закрыт).
- Документы `StressNew/docs/*` — обновлять по правилам репозитория после закрытия п.17.

---

## Проверка на BI / сервере

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик).

- [x] Input: шапка «Добавить список» → модалка → выбор версии стресс-теста → «Скопировать» → список Input заменён, строки отрисованы.
- [x] Output: то же для блока Output.
- [ ] Пустой выбор → «Не заполнено поле!» (негативный сценарий не прогонялся явно).
- [x] Waiter на время copy.
- [ ] После copy payload save/run на сервере — формальная сверка (`REFACTORING_REMAINING.md` §2.5).
- [x] Нет `onclick` на модалке AddListIndicators (§6.2, сверка по `StressConf.html`).

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-06-10 | — | — | Создан файл плана `add-list-indicators.md` (п.17) |
| 2026-06-10 | 0.1 | — | ES-модули `AddListIndicators/*`; конструктор `(service, table, getParams, onCopy)`; `_createAddListIndicatorsController` в Input/Output |
| 2026-06-10 | 0.2 | — | JSDoc слоёв; Select2/helpers только во view; `handleCopy` — view → validator; service — только `apiClient` |
| 2026-06-10 | 1.1 | — | `bind`: modal/content/select; `openModal`/`closeModal` через `Hidden`; `view.bind` в `_bindPopUpViewsOnce` Input/Output |
| 2026-06-10 | 1.2 | — | `_initVersionSelect2` в `bind`: multiple, max 1, `_bindSelect2DropdownUi`; guard при повторном bind |
| 2026-06-10 | 1.3 | — | `_bindCloseButton` → `controller.closeModal`; убран onclick на крестике в `StressConf.html` |
| 2026-06-10 | 2.1 | — | `loadStressTestVersionOptions` → `GetStressTestVersions`; `openModal` → `setStressTestVersionOptions` + show |
| 2026-06-10 | 2.2 | — | `_formatVersionState/Selected`, `_matcherVersion` в `_stressTestVersionSelect2Options`; bind + openModal |
| 2026-06-10 | 2.3 | — | `$('html').animate({ scrollTop: 0 }, 500)` в `openModal` |
| 2026-06-10 | 2.4 | — | `openIndicatorsList` → `addListIndicatorsController.openModal()` в Input/Output |
| 2026-06-10 | 2.5 | — | `_getPrognozVersionId`; без versionId → `[]`, open без `GetStressTestVersions` |
| 2026-06-10 | 3.1 | — | `fetchRowsForCopy`: `GetStressVersion` → `getValidData`; fallback на structure при ERROR/faultstring |
| 2026-06-10 | 3.2 | — | `_extractRowsFromStructure`; `fetchRowsForCopy` → `Input`/`Output` по `table` |
| 2026-06-10 | 3.3 | — | `_bindCopyButton` → `handleCopy`; убран onclick «Скопировать» в `StressConf.html` |
| 2026-06-10 | 3.4 | — | `FIELD_REQUIRED` + `getFieldRequiredMessage`; controller → `showFieldRequiredError(message)` |
| 2026-06-10 | 3.5 | — | `handleCopy` → `fetchRowsForCopy` → `onCopy`; `_onAddListIndicatorsCopy` → `setIndicators` |
| 2026-06-10 | 3.6 | — | `closeModal` после успешного `onCopy`; сброс select/error во view |
| 2026-06-10 | 4.1 | — | `setWaiter` + `_withWaiter`; `handleCopy` обёрнут в `'Copy List'` |
| 2026-06-10 | 4.2 | — | `InputController` / `OutputController.setWaiter` → `addListIndicatorsController.setWaiter` |
| 2026-06-10 | 4.3 | — | `rows == null` / catch → `console.error`; waiter в `finally`; `fetchRowsForCopy` catch → `null` |
| 2026-06-10 | 5.1 | — | `_bindPopUpViewsOnce`: `addListIndicatorsController.view.bind` в Input/Output (с 1.1) |
| 2026-06-11 | 5.2 | — | `setAsActive` в `openModal`; close/copy → `_activeController` (Input/Output на одну модалку) |
| 2026-06-11 | 1.4 | — | статус синхронизирован: `_createAddListIndicatorsController` уже в Input/Output |
| 2026-06-11 | 5.3 | — | `applyLoadedIndicatorRows` — единая точка: structure / copy / upload → `setIndicators` → normalize / prepare / sync / `_checkIndicatorsWithoutStatus` |
| 2026-06-11 | 5.4 | — | сверка: copy → `applyLoadedIndicatorRows` → `getData()` → `buildStressModulePayload` (без правок маппинга в `StressService`) |
| 2026-06-11 | 6.1 | — | чеклист §0–5: Input и Output симметричны (см. таблицу выше) |
| 2026-06-11 | 6.2 | — | `StressConf.html`: на `#select_AddListIndicators_block` нет `Reports.Stress.addListIndicators.*` |
| 2026-06-11 | 6.3 | — | `input.md` §п.17; `output.md` в репозитории нет — симметрия в этом файле |
| 2026-06-22 | 6.4 | — | Smoke BI: AddList Input/Output — OK |

---

## Следующий шаг

**П.17 закрыт** (код + документация + smoke BI). Следующие задачи — `REFACTORING_REMAINING.md` §2, §9 (завершающая фаза).
