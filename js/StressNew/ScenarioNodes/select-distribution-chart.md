# SelectDistribution — план переноса (таблица + график в одном view)

Путь кода: **`Reports/js/StressNew/ScenarioNodes/SelectDistribution/`** (только эта папка; отдельного `Chart/` **нет**).  
Легаси (только чтение): **`Reports/js/Stress/stress-input-select-distribution.js`** (`InputSelectDistribution` ~600 строк), **`Reports/js/Stress/stress-chart.js`** (`StressChart` ~245 строк — переносим **методами** в `SelectDistributionView.js`), **`Reports/js/Stress/stress-input-rows.js`** (клик `[data-rowBtn="selection"]`, `checkValidDataFromSelection`), **`Reports/js/Stress/stress-ui.js`** (`chart.init`, `InputSelectDistribution.init`, `initSerachDistributionToListPopUp`), **`Reports/js/Stress/stress-custome-popup.js`** (режимы `addNewDistribution` / `searchDistribution` — см. границы).  
Справочно при переносе UI: **`utils.js`** (`formatDate`, `toFixedNoRounding`) — **не импортировать**; копировать в `*View` / service приватными методами.  
Эталон архитектуры и стиль плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**, **`ScenarioNodes/analytics-analysis-popups.md`**, **`ScenarioNodes/add-list-indicators.md`**.  
Контракты координатора: **`docs/16-stress-controller-contracts.md`** §4 (узел создаётся в **`InputController`**, не в `StressController`).

**Родительская задача плана:** п.16 — «SelectDistribution: перенос модалки подбора; график только через payload, без глобального `stress`».

---

## Архитектура (решение заказчика, п.16)

**Одна модалка — один ScenarioNode, один view.**

```text
InputController
  └─ selectDistributionController
       ├─ SelectDistributionService   → StressApi (GetDistributionData, ChoiceDistribution, DeleteDistribution)
       ├─ SelectDistributionValidator
       └─ SelectDistributionView      → DOM модалки: таблица #SelectDistributionGrid + ECharts #SelectDistributionChart
```

| Было в черновике плана | Стало |
|------------------------|--------|
| `ScenarioNodes/Chart/` (Controller + Service + Validator + View) | **Убрано** — график не отдельный компонент |
| `chartController` в `InputController` | **Убрано** — `InputController` знает только `selectDistributionController` |
| `ChartController.update(payload)` | **`SelectDistributionController`** → `this.view.updateChart(chartPayload)` |
| `ChartService` / `ChartValidator` | **Не нужны** — нет API у графика; guard payload — в controller (`if (!payload) return`) |

**Почему график в `SelectDistributionView`, а не в controller:** в легаси `StressChart` ~245 строк — это ECharts/DOM; controller остаётся без `$` и без `echarts`. Таблица и график — части **одной** разметки `.modal-custom__distribution`.

**Payload-контракт сохраняем:** controller собирает `chartPayload` из `distributionState` + `sessionContext`; view **не** читает `stress`, `inputDataRows`, `distributionState` — только аргумент метода.

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `SelectDistributionController` / `Service` / `View` / `Validator` | Разметка `#select_Distribution_block`, `.modal-custom__distribution`, `#SelectDistributionGrid`, `#SelectDistributionChart` |
| Состояние таблицы — в **controller** (`distributionState`) | ECharts: серии «Факт» / «Исторические данные», toolbox, fullscreen, dataView |
| График: **`view.updateChart(chartPayload)`** — данные только из аргумента | Кнопка `[data-rowBtn="selection"]`, радио `parameterType`, кнопки модалки |
| API → `SelectDistributionService` → `StressApi` | JSON `GetDistributionData` / `ChoiceDistribution` / `DeleteDistribution` |
| Choose → `onApply` → **`InputController.applyDistribution`** (п.13 §2.5) | Поля строки: `distributionId`, `distributionName`, `distributionParams`, Schedule |
| События модалки — view → controller, не `onclick="Reports.Stress.*"` | jQuery, tippy, waiter в `.Grid` |

**Запрещено в view-методах графика (п.16):**

| Легаси (`StressChart`) | StressNew (`SelectDistributionView`) |
|------------------------|--------------------------------------|
| `this.stress.InputSelectDistribution.distributionObj` | Только **`chartPayload`** в `updateChart` / `addChartSeries` |
| `this.stress.inputDataRows.find(...)` | `rowContext` внутри `chartPayload` |
| Прямой доступ к `this.stress` | Нет импорта `InputController` / `StressApi` |

**`SelectDistributionView`** — без Fore/API; UI-хелперы из легаси — **копия** приватными методами, без `import` из `Stress/`.

### Читаемость кода (заказчик)

Не размножать проверки «на всякий случай» на каждый DOM-узел. Разметка — как в `StressConf.html`. См. **`input.md`** п.0.3, **`stressnew.mdc`**.

### Явные аргументы (заказчик, п.16+)

**Запрещён** паттерн `constructor(options)`.

| Плохо | Хорошо |
|-------|--------|
| `new SelectDistributionController({ apiClient, onApply })` | `new SelectDistributionController(service, getParams, getDistributionOptions, onApply)` |
| Отдельный `ChartController` в `InputController` | График — методы **`SelectDistributionView`**, вызов из **`SelectDistributionController`** |

- Экземпляр — только в **`InputController`** (зона Input; Output не открывает подбор).
- `SelectDistributionService` — **inline** в `InputController`: `new SelectDistributionService(apiClient)`.

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию, проверяем на странице отчёта (или сверка с легаси).
2. В таблице: `[x]` — сделано, `[ ]` — нет, `[—]` — вне scope.
3. **`SelectDistributionValidator`** — минимально; тексты guard/confirm — с подпунктом или **`../validation.md`** (п.15).
4. **CustomePopUp** — см. §«CustomePopUp»; не блокирует open → таблица → график → choose.

---

## Текущее состояние StressNew (кратко)

| Область | Сейчас | Цель |
|---------|--------|------|
| `ScenarioNodes/SelectDistribution/*` | Каркас Controller/Service/Validator/View; service inline в Input | Полный перенос `InputSelectDistribution` + `StressChart` в **view** |
| `ScenarioNodes/Chart/` | **Удалено** (решение п.16) | — |
| `InputController` | Только `selectDistributionController` | Без `chartController` |
| `InputView` | Кнопка `selection` в шаблоне | bind → `openSelectDistributionForRow` |
| `applyDistribution` | Готово (п.13 §2.5) | `onApply` после choose |
| `StressApi` | `getDistributionData`, `choiceDistribution`, `deleteDistribution` | Из `SelectDistributionService` |
| `StressConf.html` | Legacy `onclick` на модалке | Bind во `SelectDistributionView` |

---

## Границы (что входит / не входит)

| Входит в п.16 | Не входит |
|---------------|-----------|
| Модалка подбора: **таблица + график** в одном view | `UploadFilePopUp` / `ArrayDataPopUp` — п.19 |
| Открытие из `[data-rowBtn="selection"]` | `filteringIndicator` / `filteringDistribution` — CustomePopUp |
| API: GetDistributionData, ChoiceDistribution, DeleteDistribution | `checkIndicator` после choose — опционально (отдельно от `params.md` §6.2) |
| ECharts в `SelectDistributionView` | AddListIndicators, Analytics/Analysis — п.17–18 |
| Payload графика без `stress` | Прогон BI (конец файла) |
| `chooseDistribution` → `applyDistribution` | Debounced validate на patch — `input.md` §7.2 |
| Guard `checkValidDataFromSelection` | Новые бизнес-правила |

### CustomePopUp — частично в scope

| Подпункт | В п.16? |
|----------|---------|
| `addAllDistributionToList` | **да** (§4.4) |
| Поиск `.search__input` в модалке | **да** (§4.5) |
| `addDistributionToList` + CustomePopUp | **опционально** §4.6 |
| Полный `CustomePopUp` | **нет** |

---

## Карта легаси → StressNew

| Легаси | Куда в StressNew |
|--------|------------------|
| `InputSelectDistribution` | `SelectDistributionController` + `Service` + `View` (таблица) |
| `loadingData`, `checkDistribution`, `chooseDistribution`, … | `SelectDistributionController` + `Service` |
| `renderRow` | `SelectDistributionView.renderTableRow` |
| `StressChart` | **`SelectDistributionView`**: `bind` (init echarts), `updateChart`, `addChartSeries`, `removeChartSeries`, `clearChart` |
| `StressChart.init` | `SelectDistributionView.bind` — `#SelectDistributionChart` |
| `StressChart.loadingData` | `view.updateChart(chartPayload)` ← `controller.buildChartPayload()` |
| `addSeries` / `removeSeries` / `clear` | `view.addChartSeries` / `removeChartSeries` / `clearChart` |
| `stress-input-rows` → `selection` | `InputView` → `InputController.openSelectDistributionForRow` |
| `checkValidDataFromSelection` | `InputService` / `InputValidator` + диалоги |
| `Stress.chart` + `InputSelectDistribution` глобально | Один `selectDistributionController` в **`InputController`** |

---

## Контракт chartPayload

**Controller** — единственное место сборки. **View** — только отрисовка.

```text
{
  indicatorType: 1 | 2,
  binCenters: number[],
  binHeights: number[],
  rowContext: {
    excelType: number | null,
    excelGuid: string | null,
  },
  checkedSeries?: [{ name, points, color? }]
}
```

### Когда вызывать методы view

| Событие | Controller → View |
|---------|-------------------|
| Успешный `GetDistributionData` | `view.updateChart(buildChartPayload())` |
| Успешный `ChoiceDistribution` | `view.updateChart(...)` |
| Смена `parameterType` | `view.clearChart()` → fetch → `updateChart` |
| Checkbox в таблице | `view.addChartSeries(spec)` / `view.removeChartSeries(name)` |
| `clearList` / закрытие с очисткой | `view.clearChart()` |

### API методов графика в `SelectDistributionView`

```text
bind(scope)              — модалка + echarts.init (легаси chart.init + привязки таблицы)
updateChart(payload)     — базовые серии (легаси loadingData)
addChartSeries(spec)     — легаси addSeries
removeChartSeries(name)  — легаси removeSeries
clearChart()             — легаси clear
```

---

## Контракт SelectDistribution

### Сборка в InputController

```text
InputController (конструктор)
  └─ this.selectDistributionController = new SelectDistributionController(
       new SelectDistributionService(inputService.apiClient),
       () => this.params,
       () => this.distributionOptions,
       (data) => this._onSelectDistributionApply(data)
     )

_onSelectDistributionApply(data) → applyDistribution(data)
```

`view.bind(scope)` — в `InputController._bindPopUpViewsOnce` (вместе с analytics / analysis / addListIndicators).

### `open(sessionContext)`

```text
{
  rowNumber, indicatorId, indicatorName,
  indicatorType: 1 | 2,
  historicalRangeFrom, historicalRangeTo,
  analytics, excelGuid, excelType,
  distributionName,
}
```

Controller хранит `sessionContext`; API-вызовы **не** ищут строку по `[isactive="true"]` в DOM.

### JSON для API

Собирать в **`SelectDistributionService.buildRequestPayload(sessionContext, params, extras)`** — см. прежний план (prognozVersion, forecastData, dateFrom/To, analytics, ExcelGUID, dist_type для Choice).

---

## Guard открытия (selection)

| Условие | Поведение |
|---------|-----------|
| Нет `indicatorId` | `SELECT_INDICATOR` |
| Ошибки HistoricalRange без Excel | Диалоги как в легаси |
| `ExcelType === 2` с файлом | Не открывать |

Правило: **`InputService.canOpenSelectDistribution(row)`** или **`InputValidator`**; показ — `setShowConfirmDialog` / `setMessages`.

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | ES-модули `SelectDistribution/*`; `import` в `InputController` | `*/*.js`, `InputController.js` | каркас | [x] |
| 0.2 | Конструктор: `(service, getParams, getDistributionOptions, onApply)`; service inline; **без** `apiClient` в controller | `*Controller.js`, `InputController.js` | — | [x] |
| 0.3 | ~~Массовые проверки DOM~~ **не делаем** | — | — | [—] |
| 0.4 | Архитектура: график в **`SelectDistributionView`**, папка **`Chart/` удалена** | этот файл, код | — | [x] |
| 0.5 | Зафиксировать в **`.cursor/rules/stressnew.mdc`** (SelectDistribution + chart в view) | `stressnew.mdc` | — | [x] |

---

### 1. SelectDistributionView — bind модалки и ECharts

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `bind`: `.modal-custom__distribution`, `#SelectDistributionGrid`, `[data-btn]`, `[name="parameterType"]` | `SelectDistributionView.js` | `InputSelectDistribution.init` | [x] |
| 1.2 | В том же `bind`: `echarts.init(#SelectDistributionChart)`, базовый `option` | `SelectDistributionView.js` | `StressChart.init` | [x] |
| 1.3 | Toolbox: fullscreen, dataView, myRestore | `SelectDistributionView.js` | toolbox | [x] |
| 1.4 | `updateChart(chartPayload)`: bar «Факт» (type 1) / line «Исторические данные» (type 2) | `SelectDistributionView.js` | `loadingData` | [x] |
| 1.5 | `addChartSeries` / `removeChartSeries` / `clearChart` — только из `chartPayload` / аргументов | `SelectDistributionView.js` | add/remove/clear | [x] |
| 1.6 | `openModal` / `closeModal`, scroll top | `SelectDistributionView.js` | `toggleModal` | [x] |
| 1.7 | Убрать legacy `onclick` на модалке | `SelectDistributionView.js`, `StressConf.html` | onclick | [x] |
| 1.8 | `selectDistributionController.view.bind(scope)` в `_bindPopUpViewsOnce` | `InputController.js` | stress-ui chart.init | [x] |

---

### 2. SelectDistributionController — состояние и оркестрация

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | `distributionState` (`results`, `unable_to_fit`, `bin_centers`, `bin_heights`) | `SelectDistributionController.js` | `distributionObj` | [x] |
| 2.2 | `buildChartPayload()` — единственная сборка для view | `SelectDistributionController.js` | — | [x] |
| 2.3 | После загрузки/choice: `this.view.updateChart(this.buildChartPayload())` | `SelectDistributionController.js` | handle*Response | [x] |

---

### 3. Открытие из строки Input

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 3.1 | `InputView`: bind `[data-rowBtn="selection"]` | `InputView.js` | selection click | [x] |
| 3.2 | Guard `canOpenSelectDistribution` + диалоги | `InputController.js`, `InputValidator.js` | `checkValidDataFromSelection` | [x] |
| 3.3 | `openSelectDistributionForRow` → `selectDistributionController.open(sessionContext)` | `InputController.js` | — | [x] |
| 3.4 | `open` → waiter → `fetchDistributionTable` → render table → `updateChart` | Controller, Service | `loadingData` | [x] |
| 3.5 | Текст кнопки choose по `indicatorType` | `SelectDistributionView.js` | handleGetDistributionDataResponse | [x] |

---

### 4. Таблица — интерактив

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 4.1 | `renderTableRow` + tippy | `SelectDistributionView.js` | `renderRow` | [x] |
| 4.2 | Сортировка LR; выбранное `distributionName` — вверх | Controller | handleGetDistributionDataResponse | [x] |
| 4.3 | Checkbox → `addChartSeries` / `removeChartSeries` | Controller → View | checkbox | [x] |
| 4.4 | `addAllDistributionToList` | Controller | — | [x] |
| 4.5 | `.search__input` — фильтр строк | View / Controller | initSerachDistributionToListPopUp | [x] |
| 4.6 | `addDistributionToList` + CustomePopUp | View / Controller | `addNewDistribution` | [x] |
| 4.7 | Удаление строки + `DeleteDistribution` | Controller, Service | removeRow | [x] |
| 4.8 | `clearList` + `clearChart` | Controller | clearList | [x] |
| 4.9 | Смена `parameterType` → clear + reload | Controller | changeType | [x] |
| 4.10 | Сортировка thead (`th.sortable`) — bind во view, без `Common.SortTable` onclick | `SelectDistributionView.js`, оба `StressConf.html` | `Common.SortTable` | [x] |

---

### 5. ChoiceDistribution и choose

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | «Рассчитать» → `choiceDistribution` | Controller, Service | checkDistribution | [x] |
| 5.2 | Merge response → `updateRow` в таблице | Controller | handleChoiceDistributionResponse | [x] |
| 5.3 | `chooseDistribution` → `onApply` → `applyDistribution` | Controller, InputController | updateSelectInputIndicator | [x] |
| 5.4 | Validator: `PARAM_NOT_SELECTED` | Validator | chooseDistribution | [x] |
| 5.5 | `closeModal` после choose | Controller | toggleModal | [x] |

---

### 6. SelectDistributionService — API

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 6.1 | `buildRequestPayload` | `SelectDistributionService.js` | loadingData prop | [x] |
| 6.2 | `fetchDistributionTable` → `getDistributionData` | Service | GetDistributionData | [x] |
| 6.3 | `choiceDistribution` | Service | ChoiceDistribution | [x] |
| 6.4 | `deleteDistribution` | Service | DeleteDistribution | [x] |
| 6.5 | Ошибки `faultstring` / тексты | Controller, Validator | showDialog | [x] |
| 6.6 | Waiter в `.Grid` | View | waiter | [x] |

---

### 7. Согласование с Input

| # | Шаг | Файлы | Статус |
|---|-----|-------|--------|
| 7.1 | `setShowConfirmDialog` / `setShowDialog` в SelectDistribution | `InputController.js` | [x] |
| 7.2 | Сверка `getData().input[]` после choose | `StressService.js` | [x] |
| 7.3 | **`StressController` не знает** о SelectDistribution | — | [x] |

---

### 8. Завершение п.16

| # | Шаг | Статус |
|---|-----|--------|
| 8.1 | Чеклист §0–7 | [x] |
| 8.2 | Нет `onclick="Reports.Stress.InputSelectDistribution|chart.*"` | [x] |
| 8.3 | `SelectDistributionView` не импортирует `StressApi` / `InputController` | [x] |
| 8.4 | Ручная проверка BI — smoke 2026-06-22 | [x] |

---

## checkIndicator после choose — опционально

После `applyDistribution` **не** вызываем `checkIndicator` (отдельный подпункт, если нужен паритет с легасi). Не путать с **`recheckAllIndicators`** при смене версии прогноза — **`params.md` §6.2** (**✓** C.1).

---

## Вне этого файла

- Upload/ArrayData — п.19; AddListIndicators, Analytics — п.17–18; CustomePopUp фильтры — отдельно.
- **`validation.md`** — confirm-тексты при §4–5.
- **`input.md`** — обновить «selection — п.16» после закрытия фазы.

---

## Проверка на BI

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик).

- [x] selection → модалка, таблица, график «Факт»
- [x] Смена распределение/модель → перезагрузка
- [x] Checkbox → линии на графике
- [x] ChoiceDistribution → критерии + график через payload
- [x] Choose → строка Input обновлена, `getData()` ок
- [x] Guards как в легаси

---

## Журнал выполнения

| Дата | Подпункт | Комментарий |
|------|----------|-------------|
| 2026-06-15 | — | Создан план `select-distribution-chart.md` (п.16) |
| 2026-06-15 | 0.1–0.2 | ES-модули; service inline в InputController |
| 2026-06-15 | 0.4–0.5 | Решение: график в `SelectDistributionView`; удалён `ScenarioNodes/Chart/`; план и `stressnew.mdc` обновлены |
| 2026-06-15 | 1.1 | `SelectDistributionView.bind`: модалка, grid, `[data-btn]`, `parameterType`; close + toolbar → controller |
| 2026-06-15 | 1.2 | `echarts.init` на `#SelectDistributionChart`, базовый option (без toolbox), resize окна |
| 2026-06-15 | 1.3 | Toolbox: myRestore, dataView, fullscreen + `fullscreenchange` |
| 2026-06-15 | 1.4 | `updateChart(chartPayload)`: bar «Факт» / line «Исторические данные», resize |
| 2026-06-15 | 1.5 | `addChartSeries` / `removeChartSeries` / `clearChart`, `_getRandomColor`, `usedColors` |
| 2026-06-15 | 1.6 | `openModal` / `closeModal`: scroll top, cleanup tbody+chart при наличии строк, `onModalClosed` |
| 2026-06-15 | 1.7 | `StressConf.html`: сняты onclick InputSelectDistribution; `data-btn` на SVG; `_stripLegacyOnclick` |
| 2026-06-15 | 1.8 | `selectDistributionController.view.bind` в `InputController._bindPopUpViewsOnce` (§1 закрыт) |
| 2026-06-15 | 2.1 | `distributionState`: `defaultDistributionState`, `resetDistributionState`, `clearDistributionTableState`, `setDistributionStateFromApiResponse`, `mergeChoiceDistributionResponse`, `findResultByDistType`; `onModalClosed` → полный сброс |
| 2026-06-15 | 2.2 | `ChartPayload` typedef; `buildChartPayload`, `_resolveChartIndicatorType`, `_buildChartRowContext`, `_hasChartBaseData`; `buildChartSeriesSpec`, `registerCheckedChartSeries` / `unregisterCheckedChartSeries` |
| 2026-06-15 | 2.3 | `_refreshChart()` → `view.updateChart(buildChartPayload())` после `setDistributionStateFromApiResponse` и `mergeChoiceDistributionResponse`; §2 закрыт |
| 2026-06-15 | 3.1 | `InputView`: click `[data-rowBtn="selection"]` → `InputController.openSelectDistributionForRow(number)` |
| 2026-06-15 | 3.2 | `InputValidator.canOpenSelectDistribution` + тексты NO_HISTORICAL/VALID/DATA_FOR_FIT; `openSelectDistributionForRow` → guard + `_showDialog` / `setMessages` |
| 2026-06-15 | 3.3 | `_buildSelectDistributionSessionContext`, `setActiveInputRow` / `getSelectionButtonType`; `selectDistributionController.open` |
| 2026-06-15 | 3.4 | `loadDistributionTable`, `buildRequestPayload`, `fetchDistributionTable`; `renderTableRow` + waiter; §3 закрыт |
| 2026-06-16 | 4.3 | Checkbox → `onDistributionCheckboxChange` → `addChartSeries` / `removeChartSeries`; подсветка строки |
| 2026-06-16 | 4.4 | `handleAddAllDistributionToList`: confirm, unselected из `getDistributionOptions`, строки `new` |
| 2026-06-16 | 4.5 | `.search__input` → popup поиска, клик — строка вверх таблицы |
| 2026-06-17 | 4.6 | `addDistributionToList`: делегированный bind `[data-btn]`, popup одного unselected элемента, добавление строки `new` |
| 2026-06-17 | HTML | `Reports/StressConf.html`: синхронизирована модалка подбора с `StressNew/StressConf.html` (`data-btn`, без `InputSelectDistribution` onclick) |
| 2026-06-17 | fix | Двойной confirm «Добавить всё»: `_stripLegacyOnclick` до bind + снятие `onclick` с `[data-btn]`; `stopImmediatePropagation` в toolbar |
| 2026-06-17 | 4.10 | Сортировка колонок: `_bindTableSort` / `_sortTable` (копия `Common.SortTable`); снят `onclick` с `th.sortable` в **обоих** `StressConf.html` |
| 2026-06-17 | — | Правило агента: любые правки разметки — синхронно `Reports/StressConf.html` + `StressNew/StressConf.html` (`stressnew.mdc`) |
| 2026-06-16 | 4.7 | `onRemoveDistributionRow`: new — локально; fit — confirm + API; unable_to_fit — API; §6.4 |
| 2026-06-16 | 4.8 | `handleClearList`: confirm, `DeleteDistribution` для текущих ключей, очистка state + tbody + chart |
| 2026-06-16 | 4.9 | `onParameterTypeChange`: обновление `sessionContext.indicatorType`, clear table/chart, reload |
| 2026-06-16 | 5.1 | `handleCheckDistribution`: `needUpdate` → `ChoiceDistribution`; service `choiceDistribution`; waiter + ошибки |
| 2026-06-16 | 5.2 | `updateCalculatedRows`: criteria/params для success, `x` + hidden controls для unable_to_fit; `needUpdate` снимается |
| 2026-06-16 | 5.3 | `handleChooseDistribution`: selected radio → payload (`distributionId/name/params`) → `InputController.applyDistribution` |
| 2026-06-16 | 5.4 | `validateChooseDistribution`: если radio не выбран — `PARAM_NOT_SELECTED` через dialog |
| 2026-06-16 | 5.5 | После успешного `onApply` вызывается `closeModal`; `_onSelectDistributionApply` возвращает результат `applyDistribution` |
| 2026-06-16 | 7.2 | Сверен контракт choose → `getData().input[]` → `StressService`: `distribution` берётся из `distributionId`, имя — из `distributionName` |
| 2026-06-16 | 6.5 | Унифицированы API-ошибки: fault fallback, `Ошибка:` для GetDistributionData, `DATA_NOT_FOUND` для пустого Choice |
| 2026-06-16 | 8.1–8.3 | Финальная сверка кода: §0–7 закрыты, legacy onclick не найден, view без forbidden imports/global stress |
| 2026-06-22 | 8.4 | Smoke BI: SelectDistribution — OK |
