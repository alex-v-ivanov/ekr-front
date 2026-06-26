# AnalyticsPopUp + AnalysisPopUp — план переноса, открытие из строк, колбеки

Путь кода: `Reports/js/StressNew/ScenarioNodes/AnalyticsPopUp/`, `ScenarioNodes/AnalysisPopUp/`  
Легаси (только чтение): **`Reports/js/Stress/stress-popups.js`** (`AnalyticsPopUp` ~190 строк, `AnalysisPopUp` ~170 строк), **`Reports/js/Stress/index.js`** (`initBtnAnalysts`, `loadingAnalysts`, `fillAnalysts`, `syncProductFieldFromAnalytics`), **`Reports/js/Stress/stress-input-rows.js`** / **`stress-output-rows.js`** (клик `[data-rowBtn="analytics"]`).  
Справочно при переносе UI: **`utils.js`** (`getRowTemplate` для Analysis, шаблоны Select2) — **не импортировать**; копировать в `*View` приватными методами.  
Эталон архитектуры и стиль плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**, **`OutputComponent/output.md`**.  
Контракты координатора: **`docs/16-stress-controller-contracts.md`** §4–5 (узлы создаются в зоне Input/Output, не в `StressController`).

**Родительская задача плана:** п.18 — «AnalyticsPopUp + AnalysisPopUp: перенос, открытие из строк, колбеки».

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `*Controller` / `*Service` / `*View` / `*Validator` в `ScenarioNodes/` | Разметка модалок `#select_Analytics_block`, `#select_Analysis_block`, CSS-классы `.modal-custom__analytics`, `.SelectAnalysis*` |
| Открытие и сохранение через колбеки `InputController` / `OutputController` | Виджеты в модалках: Select2 / `<select>` / кнопки «Применить» / «Очистить фильтр» — как в легаси |
| Данные строк — из контроллера блока (`getData()` / `indicators`), без глобального `stress` | Формат `row.analytics` (`product`, `movementType`, `company`, `trCurrency`, `lt_st`, дефолт `-1`) — как `DEFAULT_ANALYTICS` в `StressService.js` |
| Закрытие модалок и фильтры — через view → controller, не `onclick="Reports.Stress.*"` | Поведение кнопки `[data-rowBtn="analytics"]` в строке и шапки «Анализ списка» |

**`*View` попапов** — без прямых вызовов Fore/API; Dim и модули → `*Service` → `StressApi`. UI-хелперы из легасi — **только копия в view**, без `import` из `Stress/`.

Критерий готовности подпункта: на той же HTML-странице модалки **выглядят и ведут себя** как до рефакторинга (сравнение с легасi).

### Читаемость кода (заказчик)

Не размножать в `*View` и контроллерах попапов проверки «на всякий случай» на каждый DOM-узел. Разметку модалок считаем **как в `StressConf.html`**. См. **`input.md`** п.0.3, **`stressnew.mdc`**.

### Явные аргументы (заказчик, п.18+)

**Запрещён** паттерн `constructor(options)` с раскладкой `this.getInputRows = options.getInputRows` и т.п. — непрозрачно при чтении кода.

| Плохо | Хорошо |
|-------|--------|
| `new AnalyticsPopUpController({ apiClient, getInputRows, getOutputRows, onApply })` | `new AnalyticsPopUpController(apiClient, table, getIndicators, onApply)` |
| `new AnalysisPopUpController({ getInputRows, onRowsChanged })` | `new AnalysisPopUpController(apiClient, table, getIndicators, onRowRemoved, getRemoveRowConfirmMessage)` + `setShowConfirmDialog` |

- Экземпляр попапа создаётся в **`InputController`** или **`OutputController`** (не один глобальный на оба блока) → не нужны одновременно `getInputRows` и `getOutputRows`; достаточно **`getIndicators`** и фиксированного **`table`** (`'Input'` / `'Output'`).
- Колбеки — **отдельные аргументы**, не поля внутри `options`.
- Зафиксировано в **`.cursor/rules/stressnew.mdc`**.

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию, реализуем, проверяем на странице отчёта (или сверка с легасi).
2. В таблице: `[x]` — сделано, `[ ]` — нет.
3. **`AnalyticsPopUpValidator` / `AnalysisPopUpValidator`** — минимально, как заглушки п.6; полные тексты guard — вместе с подпунктом или **`../validation.md`** (п.15), если сообщение уже есть в легасi (`SELECT_INDICATOR`).
4. **AddListIndicators**, CustomePopUp, Upload/ArrayData — **не в этом плане** (п.17, п.19, фильтры строк).

---

## Текущее состояние StressNew (кратко)

| Область | Сейчас | Цель |
|---------|--------|------|
| `ScenarioNodes/AnalyticsPopUp/*`, `AnalysisPopUp/*` | Каркасы в git (Controller/Service/Validator/View — заглушки); в рабочей копии папки могут отсутствовать | Полный перенос логики из `stress-popups.js` |
| `InputView` / `OutputView` | `_renderAnalyticsButton` + bind `[data-rowBtn="analytics"]` → `openAnalyticsForRow`; guard `disabled` → no-op | Dim при открытии — §2.5; `render` — §3.2 |
| `InputController.openIndicatorsAnalysis` / `OutputController.openIndicatorsAnalysis` | Делегирование в `analysisPopUpController.openModal()` | То же |
| `InputView._bindBlockToolbarActions` | `openInputIndicatorsAnalysis` / `openOutputIndicatorsAnalysis` → контроллер блока | Toolbar без legacy onclick |
| `StressConf.html` | Модалки на месте; close/filter на **`onclick="Reports.Stress.analyticsPopUp|analysisPopUp.*"`** | События через `*View.bind` (без legacy onclick) |
| `row.analytics` в модели | Есть из структуры; Product в строке из `analytics.product` | После save попапа — patch строки + re-render Product / кнопки analytics |
| `loadingAnalysts` при выборе показателя | **✓** `InputController` / `OutputController.onIndicatorSelect` → `resolveRowAnalytics` | Dim при открытии попапа — §2.5 (дублирует для пустых analytics) |
| `checkIndicator` после save analytics | **Реализовано** (`InputController.applyAnalytics` / `OutputController.applyAnalytics`) | §«checkIndicator после save analytics» |

---

## Границы (что входит / не входит)

| Входит в п.18 | Не входит (другие пункты плана) |
|---------------|----------------------------------|
| Перенос **`AnalyticsPopUp`**: init по строке, render формы, save → `row.analytics` | **`AddListIndicators`** — п.17 (готово, `add-list-indicators.md`) |
| Открытие AnalyticsPopUp из **`[data-rowBtn="analytics"]`** (Input и Output) | **`filteringIndicator`** / CustomePopUp — отдельная задача |
| Перенос **`AnalysisPopUp`**: список строк, фильтры, удаление строки | SelectDistribution, Chart, Upload, ArrayData — п.16, п.19 |
| Открытие AnalysisPopUp из шапки: `openInputIndicatorsAnalysis`, `openOutputIndicatorsAnalysis` | `recheckAllIndicators` при смене версии — **`params.md` §6.2** (реализовано в Input/Output, C.1) |
| Колбеки **`onApply`** / **`onRowsChanged`** → patch + `syncIndicators` в Input/Output | Debounced `validate()` на каждый patch — `input.md` §«П. 7.2» |
| Замена legacy `onclick` на модалках analytics/analysis | Прогон на рабочем BI (см. конец файла) |
| Guard «нет показателя» при открытии analytics из строки (`SELECT_INDICATOR`) | — |

---

## Карта легасi → StressNew

| Легасi | Назначение | Куда в StressNew |
|--------|------------|------------------|
| `AnalyticsPopUp` в `stress-popups.js` | Модалка «Аналитики» по одной строке | `ScenarioNodes/AnalyticsPopUp/*` |
| `AnalyticsPopUp.init(id, table)` | Контекст строки Input/Output | `AnalyticsPopUpController.init({ rowNumber, indicatorId, indicatorName, analytics })`; `table` — из `this.table` экземпляра |
| `render`, `getField`, `getSelectItems` | Форма `.SelectAnalyticsContent` / `.SelectAnalyticsForm` | `AnalyticsPopUpView` + `AnalyticsPopUpService` (Dim) |
| Save analytics → `rowData.analytics` | Обновление модели строки | `onApply` → `InputController.applyAnalytics` / `OutputController.applyAnalytics` |
| Save Input → `updateInputValidDateRange` | AcceptableRange после смены analytics | `InputController` после patch (уже есть `updateInputValidDateRange`) |
| Save → `checkIndicator` | `ListRow__error` | **Отложено** §«checkIndicator» |
| `AnalysisPopUp` в `stress-popups.js` | Модалка «Анализ списка» | `ScenarioNodes/AnalysisPopUp/*` |
| `analysisPopUp.openModal(table)` | Input или Output | `InputController.openIndicatorsAnalysis('Input')` / `OutputController.openIndicatorsAnalysis('Output')` |
| `render`, `getRowTemplate` | Таблица `.SelectAnalysisBody` | `AnalysisPopUpView` (копия шаблона строки, не import `utils.js`) |
| `applyFilter` / `clearFilter` | Фильтры `#analysis__product` … `#analysis__lt_st` | `AnalysisPopUpController` + view |
| Удаление строки из списка | `common.showDialog` + splice массива | `onRowRemoved` → `removeIndicator`; confirm — колбеки из блока (п.15 §6) |
| `index.loadingAnalysts` / `fillAnalysts` | Dim `EKR_ANALYTICSPOKAZ_TABLSPRAV` после выбора показателя | `AnalyticsPopUpService.loadAnalyticsDictionary(indicatorId, table)` — см. §«loadingAnalysts» |
| `index.initBtnAnalysts` | Кнопка analytics в строке | Уже: `InputService.resolveAnalyticsButtonState` / `OutputService` + `_renderAnalyticsButton` |
| `stress-input-rows` / `stress-output-rows` клик analytics | Открытие попапа | `InputView` / `OutputView` bind → контроллер блока |
| `Stress.analyticsPopUp` / `analysisPopUp` на странице | Глобальные экземпляры | Экземпляры в **`InputController`** / **`OutputController`** (lazy init), не в `StressController` |

---

## Контракт колбеков (целевой)

Согласован с **`16-stress-controller-contracts.md`**: координатор **не** владеет попапами; Input/Output создают узлы и пробрасывают узкий API.

### Сборка сервисов

**`StressController` не знает о попапах** — только `new InputService(apiClient)` / `new OutputService(apiClient)`, как сейчас.

Сервисы попапов создаёт **сам блок** в конструкторе, беря `apiClient` из уже переданного `*Service`:

```text
StressController
  └─ InputController(new InputService(apiClient), onChange)   // без ScenarioNodes

InputController (конструктор)
  ├─ this.analyticsPopUpController = this._createAnalyticsPopUpController(inputService.apiClient)
  └─ this.analysisPopUpController = this._createAnalysisPopUpController(inputService.apiClient)

Методы `_create*PopUpController(apiClient)` — сборка `new *PopUpController(...)`; `view.bind(root)` — в `bindView` (§6.1).
```

Симметрично **`OutputController`**. Отдельных полей `*PopUpService`, lazy `_get*PopUp()` и правок **`StressController`** нет.

### AnalyticsPopUp

```text
InputController / OutputController (конструктор)
  └─ this.analyticsPopUpController = new AnalyticsPopUpController(
       new AnalyticsPopUpService(inputService.apiClient),
       'Input',
       () => this.indicators,
       (rowNumber, analytics) => { ... }
     )
```

**`onApply` (минимум):**

1. `patchIndicator(number, { analytics }, { rerender: true })`.
2. Product / кнопка analytics — через существующий `_toViewRow` + render.
3. **Input only:** `updateInputValidDateRange(number)` если есть `indicatorId` и params.versionId (легасi после save analytics).
4. `_notifyIndicatorsChanged()` (колбек в координатор без auto-validate).

### AnalysisPopUp

```text
InputController / OutputController (конструктор)
  └─ this.analysisPopUpController = new AnalysisPopUpController(
       new AnalysisPopUpService(inputService.apiClient),
       'Input',
       () => this.indicators,
       (rowNumber) => this.removeIndicator(rowNumber),
       () => this.validator.getRemoveRowConfirmMessage()
     )
     // `setShowConfirmDialog` — §6.2
```

**`openModal()`** (без `table` в аргументах — таблица задана при `new`): только чтение + фильтрация; мутации списка — через `onRowRemoved` после confirm удаления.

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 0.1 | Восстановить/создать папки `AnalyticsPopUp/`, `AnalysisPopUp/`; `export` классов; `import` только внутри ScenarioNodes и из `InputController` / `OutputController`; конструкторы — **явные аргументы**, не `options` | `ScenarioNodes/**/*.js`, `InputController.js`, `OutputController.js` | каркас п.6 | [x] |
| 0.2 | Зафиксировать: jQuery / Select2 только в `*View` попапов; Service → `StressApi`; без `$` в Controller попапа | `*View.js`, `*Controller.js`, `*Service.js` | `stress-popups.js` | [x] |
| 0.3 | ~~Массовые проверки DOM~~ **не делаем** (как `input.md` п.0.3). | этот файл | — | [ ] |

---

### 1. AnalyticsPopUp — каркас и bind модалки

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `AnalyticsPopUpView.bind(root)`: `#select_Analytics_block`, `.SelectAnalyticsContent`; `openModal` / `closeModal` (класс `Hidden`) | `AnalyticsPopUpView.js` | open/close | [x] |
| 1.2 | `AnalyticsPopUpController.init(context)`: `{ rowNumber, indicatorId, indicatorName, analytics }` — хранить контекст сессии (`getSessionContext`) | `AnalyticsPopUpController.js` | `init(id, table)` | [x] |
| 1.3 | Закрытие по крестику: убрать зависимость от `Reports.Stress.analyticsPopUp.closeModal` — bind во view | `AnalyticsPopUpView.js`, `StressConf.html` | onclick ~471 | [x] |
| 1.4 | Экземпляр на блок в `InputController` / `OutputController` (`_create*PopUpController`, п.0.2+) | `InputController.js`, `OutputController.js` | `index.js` globals | [x] |

---

### 2. AnalyticsPopUp — открытие из строки

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 2.1 | `InputController.openAnalyticsForRow(number)` / `OutputController.openAnalyticsForRow(number)` | `*Controller.js` | click analytics | [x] |
| 2.2 | Guard: нет `indicatorId` → сообщение **`SELECT_INDICATOR`** (легасi; текст — константа в `InputValidator` / `OutputValidator` или локально в контроллере попапа) → `setMessages` зоны блока, **без** открытия модалки | `*Controller.js`, `*Validator.js` | validation.md §2.x ссылка на analytics | [x] |
| 2.3 | Guard: кнопка disabled (`resolveAnalyticsButtonState`) — в легасi клик не expected; можно no-op или тот же guard | `*View.js` | initBtnAnalysts | [x] |
| 2.4 | `InputView` / `OutputView`: bind `[data-rowBtn="analytics"]` → `openAnalyticsForRow(number)` (как `removeRow` / `save`) | `InputView.js`, `OutputView.js` | `addInputBtnEvent` / `addOutputBtnEvent` | [x] |
| 2.5 | При открытии: `init` + загрузка справочника analytics для показателя, если `row.analytics` пустой (легаси `loadingAnalysts` / `fillAnalysts`); patch строки + re-render кнопки/Product; **без** `render` формы — §3.2 | `AnalyticsPopUpController.js`, `AnalyticsPopUpService.js`, `StressApi.js`, `*Controller.js` | `loadingAnalysts`, `fillAnalysts` | [x] |

---

### 3. AnalyticsPopUp — форма и сохранение

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 3.1 | `AnalyticsPopUpService`: загрузка Dim-элементов для полей analytics (порт `getSelectItems` / `getFieldLabel`; Dim — `DK_PRODUCTS_NSISPRAV`, `DK_EKR_NSISPRAV_FLOWKIND`, `DK_COMPANIES_TABLSPRAV`, `DK_TRCURR_NSISPRAV`, `DK_EKR_NSSPRAV_KLASS_LT_ST`) | `AnalyticsPopUpService.js`, `StressApi.js` | `getSelectItems`, `initVersion` в stress-ui | [x] |
| 3.2 | `render`: построение `.SelectAnalyticsForm` в `.SelectAnalyticsContent`; начальные значения из `row.analytics` | `AnalyticsPopUpView.js`, `AnalyticsPopUpController.js`, `*Controller.js` | `render` | [x] |
| 3.3 | Select2 / `<select>` на полях — как в легасi; хелперы **копия** в view | `AnalyticsPopUpView.js` | `getField`, `utils.js` справочно | [x] |
| 3.4 | Кнопка сохранения (разметка по HTML отчёта): collect → `AnalyticsPopUpValidator.validateFormState` (минимум) → `onApply` | `AnalyticsPopUpView.js`, `AnalyticsPopUpController.js`, `AnalyticsPopUpValidator.js` | save handler | [x] |
| 3.5 | `InputController.applyAnalytics` / `OutputController.applyAnalytics`: patch, `syncIndicators`, Input → `updateInputValidDateRange` | `InputController.js`, `OutputController.js` | post-save chain | [x] |
| 3.6 | После успешного save: `closeModal` | `AnalyticsPopUpController.js` | — | [x] |

---

### 4. AnalysisPopUp — каркас и открытие из шапки

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 4.1 | `AnalysisPopUpView.bind(root)`: `#select_Analysis_block`, фильтры `#analysis__*`, `.SelectAnalysisBody` | `AnalysisPopUpView.js` | разметка HTML | [x] |
| 4.2 | `openModal(table)`: запомнить `table`, заполнить фильтры опциями из union analytics по строкам | `AnalysisPopUpController.js` | `openModal` | [x] |
| 4.3 | Реализовать `InputController.openIndicatorsAnalysis` / `OutputController.openIndicatorsAnalysis` → `analysisPopUp.openModal(table)` | `*Controller.js` | toolbar + legacy | [x] |
| 4.4 | Закрытие модалки: bind крестик; убрать `onclick="Reports.Stress.analysisPopUp.closeModal()"` | `AnalysisPopUpView.js`, `StressConf.html` | ~489 | [x] |
| 4.5 | Bind «Применить» / «Очистить фильтр»: view → `applyFilter` / `clearFilter` (убрать legacy onclick ~558–566) | `AnalysisPopUpView.js`, `StressConf.html` | applyFilter | [x] |

---

### 5. AnalysisPopUp — таблица, фильтр, удаление

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 5.1 | `render`: строки в `.SelectAnalysisBody`; для Input — колонки Distribution / HistoricalRange / AcceptableRange; для Output — без лишних колонок (как легасi `table`) | `AnalysisPopUpView.js` | `getRowTemplate`, render | [x] |
| 5.2 | `applyFilter` / `clearFilter`: фильтрация по `#analysis__product`, `movementType`, `company`, `trCurrency`, `lt_st` | `AnalysisPopUpController.js` | applyFilter | [x] |
| 5.3 | Удаление строки из модалки: confirm (текст через `getRemoveRowConfirmMessage` из блока) → `onRowRemoved` | `AnalysisPopUpController.js` | showDialog | [x] |
| 5.4 | После удаления: re-render модалки + `syncIndicators` в блоке (номера строк — как в легасi: не перенумеровывать без необходимости) | `*Controller.js` | splice row | [x] |

---

### 6. Согласование с Input / Output (колбеки)

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 6.1 | Вызов `analyticsPopUp.view.bind(document)` при первом `bindView` Input/Output (или из `StressApp` после bind блоков — один раз на страницу) | `InputController.js`, `OutputController.js` | init page | [x] |
| 6.2 | Проброс `setShowConfirmDialog` в `AnalysisPopUpController` (удаление из analysis) | `*Controller.js` | common.showDialog | [x] |
| 6.3 | Сверка `getData().input/output[].analytics` после save попапа с `StressService._map*RowToModule` | `StressService.js` | save payload | [x] |
| 6.4 | Заглушки `openIndicatorsList` **не трогаем** — п.17 AddListIndicators | — | addListIndicators | [—] |

---

### 7. Завершение фазы п.18

| # | Шаг | Статус |
|---|-----|--------|
| 7.1 | Пройти чеклист 0–6 для обеих модалок | [x] |
| 7.2 | Убедиться: нет рабочих `onclick="Reports.Stress.analyticsPopUp|analysisPopUp.*"` на странице StressNew | [x] |
| 7.3 | Ручная проверка на BI | [x] smoke 2026-06-22 |

---

## loadingAnalysts — закрыто (Input + Output)

**Легаси:** после выбора показателя — Dim → объект `analytics` → Product + кнопка analytics.

**StressNew:** `onIndicatorSelect` в `InputController` и `OutputController` вызывает `AnalyticsPopUpService.resolveRowAnalytics` и `patchIndicator` с `rerender: true`. Дополнительно при **открытии** AnalyticsPopUp — §2.5, если в строке analytics ещё пустой.

---

## checkIndicator после save analytics — реализовано

**Легасi:** после save analytics — `checkIndicator` → `ListRow__error`.

**StressNew:** `InputController.applyAnalytics` → `checkIndicator(rowNumber)` после patch строки (п.18 §3.5; код ~1495).

**Отдельно (не п.18):** `recheckAllIndicators` при смене **версии прогноза** — **`params.md` §6.2** (**✓** C.1; `InputController` / `OutputController.setParams`).

---

## SELECT_INDICATOR (guard открытия analytics)

Легасi: при клике analytics без выбранного показателя — **`StressValidationMessages.SELECT_INDICATOR`** (не путать с save строки — **`validation.md` §2.x**).

| Действие | Текст (ориентир легасi) | Где показывать |
|----------|-------------------------|----------------|
| analytics без `indicatorId` | «Выберите показатель» (сверить символ в символ с `constants.js`) | `setMessages` зоны **input** / **output** |

Текст — в **`InputValidator` / `OutputValidator`** при реализации п. **2.2** (не отдельный файл констант).

---

## Вне этого файла

- **`AddListIndicators`** — п.17 **готово** (`add-list-indicators.md`).
- **`checkIndicator`** после save analytics — **реализовано** (`InputController.applyAnalytics`); при смене версии — **`params.md` §6.2** (**✓** C.1).
- **CustomePopUp** (filteringIndicator в строке) — отдельная задача.
- **`validation.md`** — confirm удаления строки уже §6; `SELECT_INDICATOR` добавить при п. 2.2.
- Документы `StressNew/docs/*` — обновлять по правилам репозитория после закрытия п.18.

---

## Проверка на BI / сервере

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик).

- [x] Input: строка с показателем → analytics → модалка → save → Product и цвет кнопки analytics обновились.
- [x] Input: save analytics → AcceptableRange пересчитался (при наличии versionId).
- [x] Output: то же без колонок Input-only в AnalysisPopUp.
- [x] analytics без показателя → сообщение, модалка не открылась.
- [x] Шапка «Анализ списка» Input/Output → таблица, удаление строки с confirm.
- [ ] `getData()` для save/run на сервере — формальная сверка payload (`REFACTORING_REMAINING.md` §2.6)

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-06-05 | — | — | Создан файл плана `analytics-analysis-popups.md` (п.18) |
| 2026-06-05 | 0.1 | — | ES-модули ScenarioNodes; явные аргументы конструкторов (не `options`); lazy-init в Input/Output; правило в `stressnew.mdc` |
| 2026-06-05 | 0.2 | — | JSDoc слоёв; `/* global $ */` во view; Service → StressApi; убран `this.apiClient` из контроллеров попапов; `view.bind(document)` при lazy-init |
| 2026-06-05 | 0.2+ | — | Сервисы попапов в конструкторе `InputController`/`OutputController` из `*Service.apiClient`; `StressController` без попапов; в попап-контроллер — service |
| 2026-06-05 | 0.2++ | — | `_createAnalyticsPopUpController` / `_createAnalysisPopUpController` — сборка вынесена из конструктора блока |
| 2026-06-05 | 1.1 | — | `AnalyticsPopUpView`: `$modal`/`$content`, `openModal`/`closeModal` через `Hidden` (jQuery) |
| 2026-06-05 | 1.2 | — | `init(context)`, `sessionContext`, `getSessionContext`, `_normalizeAnalytics` (дефолты как `StressService`) |
| 2026-06-05 | 1.3 | — | `_bindCloseButton`: крестик в nav → `controller.closeModal`; убран `onclick` в `StressConf.html` |
| 2026-06-05 | 2.1 | — | `openAnalyticsForRow`: строка → `init` + `openModal`; guards/render — §2.2–2.5 |
| 2026-06-05 | 2.2 | — | `canOpenAnalytics` + `SELECT_INDICATOR` в Input/OutputValidator; `setMessages` с `meta.rowIndex`, без `openModal` |
| 2026-06-05 | 2.3–2.4 | — | bind `[data-rowBtn="analytics"]` в Input/OutputView; guard `disabled` → no-op (как легаси) |
| 2026-06-08 | 2.5 | — | `StressApi.getAnalyticsPokazDimElements`; `loadAnalyticsDictionary` + `fillAnalysts`; `ensureAnalyticsLoaded`; patch строки; уточнена формулировка 2.5 (без render) |
| 2026-06-08 | 3.1 | — | `StressApi`: movementType, company, trCurrency, lt_st; `loadFieldOptions`, `getSelectItems`, `getFieldLabel` |
| 2026-06-08 | 3.2 | — | `renderForm` + `view.render`: форма, поля, `<select>` с опциями и начальными значениями; кнопка «Сохранить» без handler (§3.4) |
| 2026-06-08 | 3.3 | — | Select2 на полях: `formatState`/`formatSelected`/matcher/`initSelect2Event` — копия в view |
| 2026-06-08 | 3.4 | — | `collectFormFieldValues`, `handleSave`, `_buildAnalyticsFromForm`; validate → `onApply` |
| 2026-06-08 | 3.5 | — | `applyAnalytics`: patch + rerender; Input → `updateInputValidDateRange` при `indicatorId` + `versionId` |
| 2026-06-08 | 3.6 | — | `handleSave` → `closeModal` после `onApply` |
| 2026-06-08 | 4.1 | — | `AnalysisPopUpView.bind`: modal/content/body, `$filterSelects`, `openModal`/`closeModal` |
| 2026-06-08 | 4.2 | — | `openModal`: Dim → union analytics → Select2 на `#analysis__*`; колонки Input-only |
| 2026-06-08 | 4.3 | — | Toolbar `data-stress-action` → `openIndicatorsAnalysis` → `analysisPopUpController.openModal()` (Input/Output) |
| 2026-06-08 | 4.4 | — | `_bindCloseButton` в `AnalysisPopUpView`; убран legacy onclick на крестике |
| 2026-06-08 | 4.5 | — | `_bindFilterButtons`: `.analysis-popUp-apply` / `.analysis-popUp-clear` → controller |
| 2026-06-08 | 5.1 | — | `buildRenderRows` + `render`/`getRowTemplate`; Input-only колонки, Excel/tippy |
| 2026-06-08 | 5.2 | — | `collectFilterValues` / `applyRowVisibility` / `clearFilterSelects`; `closeModal` → `clearFilter` |
| 2026-06-08 | 5.3 | — | `handleRemoveRow`: confirm → `onRowRemoved` + `removeAnalysisRow`; текст — колбек из блока |
| 2026-06-08 | 5.4 | — | `onRowRemoved` → `removeIndicator` + `_refreshModalAfterRowsChanged` (union, таблица, фильтры) |
| 2026-06-08 | 6.1 | — | `_bindPopUpViewsOnce(root)` в `bindView`; bind analytics + analysis view |
| 2026-06-08 | 6.2 | — | `AnalysisPopUpController.setShowConfirmDialog`; проброс из Input/Output |
| 2026-06-08 | 6.3 | — | `mapAnalyticsToModule` в `StressService`; patch строки и `_map*RowToModule` через одну функцию |
| 2026-06-08 | 7.1 | — | Сверка чеклиста 0–6 по коду: всё [x]/[—]; 0.3 — намеренно не делаем |
| 2026-06-08 | 7.2 | — | `StressConf.html` (оба): нет onclick на analytics/analysis модалках |
| 2026-06-22 | 7.3 | — | Smoke BI: Analytics/Analysis попапы — OK |
| 2026-06-24 | docs | — | §7.7: `checkIndicator` после `applyAnalytics` — реализовано (не «отложено») |
| 2026-06-25 | docs | — | C.1: `recheckAllIndicators` при смене версии — **✓** (`params.md` §6.2); убраны устаревшие «отложено» |

---

## Следующий шаг

П.18 закрыт. Формальная сверка analytics в payload — **B.1** (`REFACTORING_REMAINING.md` §2.6).
