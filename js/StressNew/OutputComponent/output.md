# Блок Output — план переноса из легаси

Путь кода: `Reports/js/StressNew/OutputComponent/`  
Легаси (только чтение): **`Reports/js/Stress/stress-output-rows.js`**, **`Reports/js/Stress/stress-ui.js`** (фильтр шапки, `clearOutputList`), **`Reports/js/Stress/index.js`** (`initBtnAnalysts`, `syncProductFieldFromAnalytics`, `loadingAnalysts`).  
Справочно при переносе UI: **`utils.js`** (`getOutputTemplate`, `formatState`, `formatSelected`, `matcherTemplate`, `initSelect2Event`) — **не импортировать**; копировать в `OutputView` приватными методами.  
Эталон архитектуры и стиль плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**.
Для реализации Output опираемся на уже сделанный `ParamsComponent` и, в первую очередь, на актуальный `InputComponent` (та же архитектура, но меньше сценариев).

**Родительская задача плана:** п.14 — «Блок Output: перенос логики строк вывода, кнопок, данных строк» (симметрично п.13 Input).

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `OutputController` / `OutputService` / `OutputView`, связь с `StressController` | Разметка, CSS-классы, селекторы `#output_block_list`, `.OutputContent` |
| Явные зависимости (`StressApi`, сервисы) | jQuery, Select2, tippy — как в легаси |
| Состояние в контроллере (`indicators`) | Формат `text: "key#;name"` для Select2, формат строк для save/run |
| Без глобального объекта `stress` | События `select2:select`, `dropdownParent`, язык `noResults` |

**`OutputView`** — без прямых вызовов Fore/API; виджеты и события → контроллер. UI-хелперы из легаси — **только копия в view**, без `import` из `Stress/`.

Критерий готовности подпункта: на той же HTML-странице блок Output **выглядит и ведёт себя** как до рефакторинга (сравнение с легаси).

### Читаемость кода (заказчик)

Не размножать в `*View` и контроллерах проверки «на всякий случай» на каждый DOM-узел. Разметку отчёта считаем **как в легаси**; устойчивость к пустой странице — отдельная задача по явному запросу.

См. **`InputComponent/input.md`** (раздел «Принцип рефакторинга»), **`ParamsComponent/params.md`** (п.0.3).

---

## Как работать по плану

1. Берём **один** подпункт (например `1.2`), реализуем, проверяем на странице отчёта.
2. В таблице: `[x]` — сделано, `[ ]` — нет.
3. После согласования с заказчиком — следующий подпункт (не пачкой).
4. **`OutputValidator.js`** — guards, confirm-тексты, save/run — **`../validation.md`** (§3, §6).
5. **Попапы и ScenarioNodes** — не в этом плане (п.16–19): аналитики, «добавить список», «анализ списка», фильтры.

---

## Текущее состояние StressNew Output (закрыт по scope п.14)

| Область | Статус |
|---------|--------|
| `OutputController` | CRUD, patch, `setParams` → `recheckAllIndicators` при смене versionId, `onIndicatorSelect`, колбек |
| `OutputService` | `loadOutputDimLists`, нормализация, DTO для view |
| `OutputView` | render, Select2, кнопки, tooltips, `setMessages`, FilterPopUp |
| `OutputValidator` | Guards, confirm, save/run — **`../validation.md`** §3 |
| `StressController` | `setIndicators(source.Output)`, `setParams`, `getData().output` |
| BI smoke | **✓** 2026-06-22; validation run/save — **✓** 2026-06-24 |
| Сверка payload §8.2 | **B.1** — открыто |

---

## Сравнение Output и Input (объём работ)

| Есть в Input | В Output |
|--------------|----------|
| Показатель + распределение + даты + Excel + Options + Schedule | Только **показатель**, **продукт**, кнопка **аналитики** |
| `save` в строке | **`cancel`** (выход из editor без валидации опций) |
| `recalculate` / valid range / AirDatepicker | **Нет** — в Output нет пересчёта дат; `setParams` без `recalculate` (hardening §1.2) |
| Много кнопок строки (Excel, подбор, …) | `editeRow`, `cancel`, `removeRow`, `analytics`, `filteringIndicator` (последние два — попапы) |
| `#input_block_list` | `#output_block_list` (класс списка `.OutputContent`) |

План Output **короче**, чем Input: нет разделов «распределение», «исторические даты», «Excel».

---

## Границы (что входит / не входит)

| Входит в этот план | Не входит (отдельные задачи) |
|--------------------|------------------------------|
| Модель строки, CRUD списка | `analytics` → `AnalyticsPopUp` |
| Render: №, показатель, продукт, статус строки, view/editor | ~~`filteringIndicator`~~ → **FilterPopUp** (C.3) |
| Select2 на `.indicator` (справочник Output, `indType=2`) | ~~`filteringOutput` в шапке~~ → **FilterPopUp** §3 |
| Кнопки шапки: добавить, очистить список (`data-stress-action`) | «Добавить список», «Анализ списка» — `AddListIndicators` / `AnalysisPopUp` |
| `editeRow` / `cancel` / `removeRow` | `loadingAnalysts` при select — **✓** `onIndicatorSelect` → `resolveRowAnalytics` (§4.3) |
| `initBtnAnalysts` — видимость/стиль кнопки аналитик по уже загруженным `analytics` | `checkIndicator` при смене версии — **реализовано**, см. **`params.md` §6.2**; при смене показателя отдельного вызова нет |
| `setMessages` в зоне output | Run/save validation — **`../validation.md`** (диалог, как легасi) |
| Сверка `getData()` с `StressService._mapOutputRowToModule` | Прогон на рабочем BI (см. конец файла) |

---

## Карта легаси → StressNew

| Легаси (`OutputRowsManager` / `StressUI`) | Куда в StressNew |
|-------------------------------------------|------------------|
| `OutputDataRows` | `OutputController.indicators` |
| `renderOutput` | `OutputView.renderIndicators` + `OutputController.syncIndicators` |
| `getNextOutputNumber` / `addNewOutput` | `addNewIndicator` + guard; пустая строка `status: -1`; первый `checkIndicator` — `onIndicatorSelect` |
| `initOutputIndicator` | `OutputView` + `onIndicatorSelect` в контроллере |
| `addOutputBtnEvent` | обработчики в `OutputView` → контроллер |
| `initBtnAnalysts` | `OutputService` или `OutputView._renderAnalyticsButton` |
| `syncProductFieldFromAnalytics` | `OutputService` + view (как Input `_resolveProductLabel`) |
| `loadingAnalysts` | `OutputController.onIndicatorSelect` → `AnalyticsPopUpService.resolveRowAnalytics` | **✓** §4.3 |
| `filterOutputItems` / `initFilterOutputIndicator` | **`FilterPopUpController`** (C.3, `../ScenarioNodes/filter-popup.md`) |
| `clearOutputList` | `clearAllIndicators` + `data-stress-action="clearOutputIndicators"` |
| `getOutputTemplate` | `OutputView` — копия шаблона строки (не импорт `utils.js`) |
| `OutputIndicatorEls` из `initVersion` | `OutputService.loadOutputDimLists` → `getStressPoksIndicators(2)` |

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | `export` / `import`: `OutputView`, `OutputValidator`, `OutputController`, `OutputService`; связь в `StressController` | `Output*.js` | — | [x] частично (файлы есть, view пустой) |
| 0.2 | UI-паритет: во `OutputView` — jQuery + Select2 + tippy; хелперы **скопировать** (`_format*`, `_matcher*`, `_bindSelect2DropdownUi`, `getOutputTemplate`); контроллер/сервис без `$` | `OutputView.js` | `initOutputIndicator`, `utils.js` | [x] |
| 0.3 | ~~Массовые проверки DOM~~ **не делаем** (как `input.md` п.0.3, `params.md` п.0.3). | `output.md` | — | [x] |

---

### 1. Инициализация и справочники

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `bind` → `await controller.onBind()`: `loadOutputDimLists()` — показатели Output (`indType=2`) + продукты | `OutputController.js`, `OutputService.js`, `StressApi.js` | `initVersion` → `OutputIndicatorEls` | [x] |
| 1.2 | Нормализация справочников `{ id, name }` / Select2 `id#;name` | `OutputService.js`, `OutputView.js` | как `InputService._normalizeDimItems` | [x] |
| 1.3 | View: Select2 на `.indicator` с полным `data` на каждой строке | `OutputView.js` | `initOutputIndicator` | [x] |
| 1.4 | После init — `renderIndicators(getData())` | `OutputView.js` | `renderOutput` после dims | [x] |

---

### 2. CRUD списка и координатор

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | Guard «добавить строку»: `OutputValidator.canAddRow` + `setMessages` | `OutputController.js` | `addNewOutput` ~24–33 | [x] |
| 2.2 | Прокрутка к новой строке при добавлении | `OutputView.js`, `OutputController.js` | scroll в `renderOutput([null])` ~44–47 | [x] |
| 2.3 | `setIndicators([])` / пустая структура — очистить `#output_block_list` | `OutputController.js`, `OutputView.js` | `OutputDataRows = []` | [x] |
| 2.4 | `patchIndicator(number, partial, { rerender })` | `OutputController.js` | — (симметрия Input) | [x] |
| 2.5 | `applyIndicator` / загрузка структуры: нормализация полей `key`/`name` → `indicatorId`/`indicatorName`, `number`, `analytics`, `status` | `OutputController.js` | `renderOutput` item из структуры ~56–62 | [x] |

---

### 3. Полная отрисовка строки (read-only часть)

Для каждой строки при `renderIndicators`:

| # | Шаг | Поле / UI | Легаси | Статус |
|---|-----|-----------|--------|--------|
| 3.1 | Номер, `row-id` | Number | ~70–71 | [x] |
| 3.2 | Product из `analytics.product` + справочник продуктов | Product | `syncProductFieldFromAnalytics` | [x] |
| 3.3 | Статус строки: `ListRow__error` при `status !== 0` (без `checkIndicator`) | row | ~75–79 | [x] |
| 3.4 | Режим view/editor: загруженная строка — view, новая — editor | mode | ~61–63 | [x] |
| 3.5 | Кнопка analytics: `initBtnAnalysts` по текущим `analytics` (disabled / цвет / tooltip) | analytics | ~68–69, `index.initBtnAnalysts` | [x] |
| 3.6 | Tooltips `tippy` на `[tooltipe]` в строке | — | ~80–90 | [x] |

---

### 4. Редактирование показателя

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 4.1 | Select2: `templateResult` / `templateSelection`, `matcherTemplate`, `initSelect2Event` → `_bindSelect2DropdownUi` | `OutputView.js` | `initOutputIndicator` ~95–109 | [x] |
| 4.2 | `select2:select` → контроллер: `indicatorId`, `indicatorName`, сброс Product в DOM при пустых analytics | `OutputController.js` | ~111–141 | [x] |
| 4.3 | `loadingAnalysts` после выбора показателя — `onIndicatorSelect` → `resolveRowAnalytics`, `patchIndicator`, re-render | `OutputController.js`, `AnalyticsPopUpService.js` | ~138–141 | [x] |
| 4.4 | Программный выбор показателя при render загруженной строки (`val`, `trigger`, без лишнего API) | `OutputView.js` | ~144–162 | [x] |
| 4.5 | `filteringIndicator` в строке — **FilterPopUp** C.3 (`openIndicatorBlockFilter`) | `OutputView.js`, `OutputController.js` | ~200–203 | [x] |

---

### 5. Кнопки строки (без попапов)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | `editeRow` → editor | `OutputView.js` → `onEditRow` | ~187–192 | [x] |
| 5.2 | `cancel` → view (аналог «отмена редактирования», **не** save с валидацией) | `OutputView.js` → `onCancelRow` | ~181–186 | [x] |
| 5.3 | `removeRow` — удаление строки (confirm — `validation.md` §6.4) | `OutputController.js` | ~172–179 | [x] |
| 5.4 | `analytics` — **пропуск** клика (попап); видимость кнопки — п. 3.5 | — | ~193–198 | [—] |

---

### 6. Кнопки шапки блока Output

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 6.1 | `StressConf.html`: `data-stress-action` вместо `onclick` — `addOutputIndicator`, `clearOutputIndicators`, заглушки списка/анализа | `StressConf.html` | кнопки ~247–275 | [x] |
| 6.2 | `OutputView._bindBlockToolbarActions` (как Input) | `OutputView.js` | `addNewOutput`, `clearOutputList` | [x] |
| 6.3 | `addNewIndicator` / `clearAllIndicators` в контроллере | `OutputController.js` | `addNewOutput`, `clearOutputList` | [x] |
| 6.4 | Tooltips на кнопках шапки и легенде блока Output (`tippy` на `[tooltipe]` в секции) | `OutputView.js` | `initTooltip` (фрагмент для блока) | [x] |
| 6.5 | `filteringOutput` в `ListHeadlines` — **FilterPopUp** C.3 (`openHeaderFilter`) | `OutputView.js`, `OutputController.js` | `initFilterOutputIndicator` | [x] |

---

### 7. Реакция на Params и координатор

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 7.1 | `setParams`: обновление `params`; при смене `versionId` — `recheckAllIndicators()` (без `recalculate`, hardening §1.2) | `OutputController.js` | — | [x] |
| 7.2 | `onOutputChanged` в `StressController` — **отложено** (как Input п. 7.2): колбек есть, без auto-validate на каждый patch | `StressController.js` | — | [—] отложено |
| 7.3 | `setMessages` — `[data-output-messages]` / `.block-output__messages` (fallback: секция Output / перед `#output_block_list`) | `OutputView.js` | симметрия Input 7.3 | [x] |

---

### 8. Завершение фазы Output (п.14)

| # | Шаг | Статус |
|---|-----|--------|
| 8.1 | Пройти чеклист 0–7 в scope (без отложенных попапов) | [x] |
| 8.2 | Сверка `getData()` / `setIndicators` с форматом save/run и `StressService._mapOutputRowToModule` | [ ] |
| 8.3 | Краткая запись в журнал ниже | [x] |
| 8.4 | Ручная проверка на BI | [x] smoke 2026-06-22; validation run/save ✓ 2026-06-24 |

---

## `checkIndicator` при смене версии прогноза

Перенос **`checkIndicator`** при смене **версии прогноза** для строк Output (симметрично Input) в StressNew уже реализован:

| Что реализовано | Где |
|-----------------|-----|
| `recheckAllIndicators()` | `OutputController` + подсветка в `OutputView` |
| Вызов из `StressController` после смены `versionId` | `StressController.onParamsChanged` → `OutputController.setParams` |

При смене версии прогноза Output-строки не перезагружаются из структуры, а перепроверяются через `setParams` / `recheckAllIndicators()`.

---

## П. 4.3 — `loadingAnalysts` (закрыто)

**Легаси:** после выбора показателя — Dim `EKR_ANALYTICSPOKAZ_TABLSPRAV`, объект `analytics`, Product + кнопка analytics.

**StressNew:** `OutputController.onIndicatorSelect` → `analyticsPopUpController.service.resolveRowAnalytics(indicatorId, 'Output', null)` → `patchIndicator` с `rerender: true`. Симметрично Input (`InputController.onIndicatorSelect`).

---

## Confirm диалоги (`validation.md` §6.4)

| Кнопка | Легаси | Сообщение (ориентир) |
|--------|--------|----------------------|
| `removeRow` | `CONFIRM_DELETE_OUTPUT_INDICATOR` | удаление показателя | [x] |
| `clearOutputIndicators` | `CONFIRM_DELETE_ALL_OUTPUT` | удаление всех Output-показателей | [x] |

---

## Вне этого файла

- **`OutputValidator`** — guards, confirm, save/run — **`../validation.md`** §3, §6.
- **ScenarioNodes:** `AnalyticsPopUp`, `AnalysisPopUp`, `AddListIndicators`, **`FilterPopUp`** (C.3).

---

## Проверка на BI / сервере

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик). Run/Save — не проверялись.

- [x] Открыть отчёт — справочник Output-показателей подгружается.
- [x] Смена версии стресс-теста — строки Output из структуры.
- [x] Добавление / удаление строки, режимы view / editor, cancel.
- [x] Смена показателя — данные в `getData()` (payload на сервере — §8.2).
- [x] «Очистить список» — пустой список.
- [x] `filteringIndicator` в строке / `filteringOutput` в шапке — **✓** C.3 FilterPopUp (BI 2026-06-24).

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-06-01 | — | — | Создан файл плана `output.md` по анализу легаси `stress-output-rows.js` и каркаса StressNew |
| 2026-06-02 | 0.2 | — | `OutputView`: добавлен локальный `getOutputTemplate` (копия `utils.getOutputTemplate`), базовые Select2/tippy-хелперы (`_formatIndicator*`, `_matcherIndicator`, `_bindSelect2DropdownUi`, `_destroySelect2`, `_initRowTooltips`), без импорта из легаси |
| 2026-06-02 | 1.1 | — | `OutputService.loadOutputDimLists`: загрузка `STRESS_POKS` (`indType=2`) и продуктов; `OutputController.onBind` сохраняет справочники и передаёт их в `OutputView`; `OutputView.bind` запускает `_runInitialBind` |
| 2026-06-02 | 1.2 | — | `OutputView._toSelect2Data`: формат `text: "id#;name"` для Select2 как в легаси; `setIndicatorSelect2Options` переведён на общий helper |
| 2026-06-02 | 1.3 | — | `OutputView._initOutputIndicatorSelect2` + `_outputIndicatorSelect2Options`: Select2 на `.indicator` с полным `data`, форматтерами, matcher и UI-обвязкой |
| 2026-06-02 | 1.4 | — | `OutputView._runInitialBind`: после `onBind` вызывает `renderIndicators(getData())`; добавлен базовый `renderIndicators` (номер, отображаемое имя показателя, `row-id`, init Select2/tippy) |
| 2026-06-02 | 2.1 | — | `OutputController.addNewIndicator`: guard `_canAddNewIndicator` по params (`versionId`, `iterations`, `simulations`), расчёт `number` и создание пустой строки Output |
| 2026-06-02 | 2.2 | — | `OutputView.renderIndicators(rows, scrollToNumber)` + `_scrollToRow`; `OutputController.addNewIndicator` вызывает render с прокруткой к новой строке |
| 2026-06-02 | 2.3 | — | `OutputController.syncIndicators` как единая цепочка render+callback; `setIndicators`/`applyUploaded` через `_normalizeIndicatorRows` и `syncIndicators`, `[]` гарантированно очищает `#output_block_list` |
| 2026-06-02 | 2.4 | — | Добавлен `patchIndicator(number, partial, { rerender })`; `applyIndicator` переведён на `patchIndicator(..., { rerender: true })` |
| 2026-06-02 | 2.5 | — | `OutputController._normalizeIndicatorRow`: `key/name -> indicatorId/indicatorName`, `id -> number`, нормализация `analytics/status`; применено в `setIndicators`, `applyUploaded`, `applyIndicator`, `patchIndicator` |
| 2026-06-02 | 3.1 | — | `OutputController._toViewRow` + `syncIndicators` через view DTO; `OutputView._renderRowNumber`: `row-id` и текст № в view/editor (легаси ~70–71) |
| 2026-06-02 | 3.2 | — | Product: `OutputController._resolveProductLabel` (analytics.product + справочник продуктов), `OutputView._renderRowProduct` (view/editor) |
| 2026-06-02 | 3.3 | — | `OutputService.resolveRowErrorState`, `rowErrorState` в `_toViewRow`, `OutputView._renderRowErrorState`: `ListRow__error` при `status !== 0`; без `checkIndicator` |
| 2026-06-02 | 3.4 | — | `OutputService.resolveRowViewMode` / `_isLoadedIndicatorRow`, `isViewMode` в `_toViewRow`, `OutputView._renderRowViewMode` (загруженная строка — view, новая — editor) |
| 2026-06-02 | 3.5 | — | `OutputService.resolveAnalyticsButtonState`, `analyticsButton` в `_toViewRow`, `OutputView._renderAnalyticsButton` (fill/disabled/tooltip/invisibility; легаси initBtnAnalysts) |
| 2026-06-02 | 3.6 | — | `_initRowTooltips` на `[tooltipe]` после append строки; `_releaseListTooltips` перед полным render; guard если нет `tippy`; раздел 3 закрыт |
| 2026-06-02 | 4.1 | — | Select2 показателя: `_formatIndicator*`, `_matcherIndicator`, `_outputIndicatorSelect2Options`; порядок destroy → empty → select2 → `_bindSelect2DropdownUi` (как Input 4.1) |
| 2026-06-02 | 4.2 | — | `parseIndicatorFromSelect2`, `onIndicatorSelect`, `_bindIndicatorSelect2Change`, `_applyIndicatorSelectToRow`; сброс Product в DOM; без loadingAnalysts/checkIndicator |
| 2026-06-02 | 4.4 | — | `_selectIndicatorInCombo` + `_hideSelect2InlineSearch` в `_initOutputIndicatorSelect2`; `val`/`change`/`select2:close` для загруженной строки (как Input) |
| 2026-06-02 | 5.1 | — | `onEditRow` / `setRowEditMode`; bind `[data-rowBtn="editeRow"]`; `_renderRowViewMode` → editor |
| 2026-06-02 | 5.2 | — | `onCancelRow` → `setRowEditMode(false)`; bind `[data-rowBtn="cancel"]`; без валидации (как легаси Output) |
| 2026-06-02 | 5.3 | — | `removeIndicator`: фильтр по `number` + `syncIndicators`; bind `[data-rowBtn="removeRow"]`; confirm — п.15 |
| 2026-06-02 | 6.1 | — | `StressConf.html`: `data-stress-action` — `addOutputIndicator`, `openOutputIndicatorsList`, `openOutputIndicatorsAnalysis`, `clearOutputIndicators` (вместо `onclick` Reports.Stress) |
| 2026-06-02 | 6.2 | — | `OutputView._bindBlockToolbarActions` в `bind`; маппинг action → `addNewIndicator` / `clearAllIndicators` / заглушки попапов |
| 2026-06-02 | 6.3 | — | `addNewIndicator` (guard params, `_getNextRowNumber`, пустая строка, scroll); `clearAllIndicators` → `setIndicators([])`; confirm — п.15 |
| 2026-06-02 | 6.4 | — | `_initOutputBlockTooltips` на `.block-parameters__nav` (шапка + легенда); `_mountTippyOnElement`; строки — `_initRowTooltips` |
| 2026-06-25 | hardening §1.2 | `recalculate()` и заглушки `open*Popup` удалены; `setParams` — только `recheckAllIndicators` при смене versionId |
| 2026-06-02 | 7.3 | — | `setMessages`: `[data-output-messages]` / `.block-output__messages`; fallback `#output_block` или перед `#output_block_list`; цепочка через `OutputController.setMessages` |
| 2026-06-24 | 8.1 | — | Чеклист §0–7 закрыт; validation run/save на BI ✓ (`validation.md` §7.2/§7.6) |
| 2026-06-24 | docs | — | §7.5: сняты отсылки «п.15 отложено» для OutputValidator |
| 2026-06-24 | C.3 | — | Фильтры `filteringIndicator` / `filteringOutput` → FilterPopUp; §4.5, §6.5, BI-чеклист |
| 2026-06-25 | docs | — | C.1: `recheckAllIndicators` при смене версии — статус «реализовано» (`params.md` §6.2) |

---

## Следующий шаг

**8.2** — сверка `getData().output[]` с `_mapOutputRowToModule` (**B.1**, `REFACTORING_REMAINING.md` §2.3).
