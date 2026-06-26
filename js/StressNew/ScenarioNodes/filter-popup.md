# FilterPopUp — план переноса фильтров списка (CustomePopUp)

Путь кода: **`Reports/js/StressNew/ScenarioNodes/FilterPopUp/`**  
Легасi (только чтение): **`Reports/js/Stress/stress-custome-popup.js`** (режимы `filtering*`, ~400 строк из ~796), **`Reports/js/Stress/stress-ui.js`** (`filterInputItems`, `filterOutputItems`, `initFilterInputIndicator`, `initFilterOutputIndicator`), **`Reports/js/Stress/stress-input-rows.js`** (клик `[data-rowBtn="filteringIndicator"]`, `[data-rowBtn="filteringDistribution"]`), **`Reports/js/Stress/stress-output-rows.js`** (клик `[data-rowBtn="filteringIndicator"]`), **`Reports/js/Stress/constants.js`** (`StressModes.FILTERING_*`).  
Справочно при переносе UI: **`utils.js`** (`formatState`, `formatSelected`, `formatDistribution`) — **не импортировать**; копировать в `FilterPopUpView` / `InputView` / `OutputView` приватными методами.  
Эталон архитектуры и стиль плана: **`ParamsComponent/params.md`**, **`InputComponent/input.md`**, **`OutputComponent/output.md`**, **`ScenarioNodes/add-list-indicators.md`**, **`ScenarioNodes/select-distribution-chart.md`**.  
Контракты координатора: **`docs/16-stress-controller-contracts.md`** §4 (узел создаётся в **`InputController`** / **`OutputController`**, не в `StressController`). API dims: **`StressApi._fetchDimElements`**, **`docs/STRESS_API.md`**.

**Родительская задача:** **`REFACTORING_REMAINING.md`** §5.1, этап **C.3** — фильтры `filtering*` (CustomePopUp).

---

## Архитектура (решение заказчика, C.3)

**Один ScenarioNode — floating popup `.custom-popup`, два экземпляра (Input / Output).**

```text
InputController
  └─ filterPopUpController
       ├─ FilterPopUpService    → StressApi (dims: блоки, STRESS_POKS по BLOCK_ID)
       ├─ FilterPopUpValidator  → каркас (минимум; см. §Validator)
       └─ FilterPopUpView        → DOM: динамический .custom-popup (не модалка в HTML)

OutputController
  └─ filterPopUpController     (симметрично; без filteringDistribution)
```

| Было в легасi | Стало |
|---------------|-------|
| `Stress.customePopUp` глобально | Экземпляры только в **`InputController`** / **`OutputController`** |
| `customePopUp.init($el, data, selected, mode, $nav)` | **Три метода** `FilterPopUpController`: `openHeaderFilter`, `openDistributionFilter`, `openIndicatorBlockFilter` |
| Dispatch по строке `mode` (`filteringIndicatorInput`, …) | **Нет** — см. §«Отказ от mode» |
| Прямая перезагрузка select2 в методах `createfiltering*` | Колбеки блока → **`InputView` / `OutputView`** |
| `BlocksIndicatorsEls` на `stress` | Кэш в **`InputController` / `OutputController`** или lazy-load через **`FilterPopUpService`** |
| `filterInputItems` / `filterOutputItems` в `stress-ui.js` | **`FilterPopUpService.buildHeaderFilterItems`** + controller |

**Зона ответственности:** UI-фильтрация списка строк и options select2 в строке. **Payload save/run не меняется** (фильтры не пишут в модель, кроме косвенного выбора в select2 пользователем после сужения списка).

### Что уже перенесено из CustomePopUp (не входит в C.3)

| Режим легасi (`StressModes`) | Куда ушло |
|--------------|-----------|
| `addNewDistribution` | `SelectDistributionView.showAddDistributionPopup` (п.16 §4.6) |
| `searchDistribution` | `SelectDistributionView.showSearchDistributionPopup` (п.16 §4.5) |
| `getUnselectedItems` | `SelectDistributionController` |

---

## Отказ от mode (архитектурное решение, обязательное)

В легасi **`CustomePopUp`** — один класс с **`init(..., mode)`** и ветвлением по девяти строкам `StressModes.FILTERING_*`. Это **не переносим** в StressNew.

| Легасi (плохо для StressNew) | StressNew (как у AddList / Upload / SelectDistribution) |
|------------------------------|-----------------------------------------------------------|
| `customePopUp.init($btn, data, [], "filteringInputItemsNumber", $nav)` | `filterPopUpController.openHeaderFilter('Number', $btn, $nav)` |
| Строка `mode` в view для позиции, поиска, side-effect | **`FilterPopUpController`** — явный метод + колбеки; **`FilterPopUpView.showListPopup`** — только UI: `layout`, `searchMatch`, `getItemLabel` |
| Файл `FilterPopUpModes.js` / копия `StressModes` | **Не создаём** — нет enum «режимов popup» в коде приложения |
| `FilterPopUpOpenContext { mode: string }` | Контекст клика: `$anchor`, `$nav`, `rowNumber`; тип сценария = **имя метода** controller |

### Три сценария (единственные entry point'ы FilterPopUp)

| Метод controller | Кто вызывает (§3–5) | После выбора |
|------------------|---------------------|--------------|
| `openHeaderFilter(headerColumn, $anchor, $nav)` | `InputView` / `OutputView` — клик `[data-rowBtn="filteringInput\|filteringOutput"]` | колбек `onHeaderFilter` → `applyHeaderRowFilter` в блоке |
| `openDistributionFilter(rowNumber, $anchor, $nav)` | `InputView` — `[data-rowBtn="filteringDistribution"]` | `onDistributionOptions` → refresh distribution select2 |
| `openIndicatorBlockFilter(rowNumber, $anchor, $nav)` | `InputView` / `OutputView` — `[data-rowBtn="filteringIndicator"]` | `onIndicatorOptions` → refresh indicator select2 |

`headerColumn` — **не** enum приложения: значение атрибута `mode` на SVG в `StressConf.html` (`Number` / `Name` / `Product`). Читается из DOM в `InputView` / `OutputView` и передаётся строкой в controller.

`table` (`'Input'` / `'Output'`) задаётся **при `new FilterPopUpController(...)`** в блоке — как у `AddListIndicators` / `AnalyticsPopUp`.

### View: `showListPopup` (без `mode`)

```text
FilterPopUpListOptions {
  $anchor, $nav, items, onSelect,
  layout: 'header' | 'row',           // позиция popup (легасi разный top)
  searchMatch: 'contains' | 'exact',  // поле «Найти» (Number в шапке — exact)
  getItemLabel?, getItemKey?,         // подпись пункта и подсветка кнопки
}
```

Поведение легасi по-прежнему покрывается комбинацией **метода controller** + **UI-опций view**, без копирования имён `filteringInputItemsNumber` в код.

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `*Controller` / `*Service` / `*View` / `*Validator` в `ScenarioNodes/FilterPopUp/` | Кнопки `filtering*` в разметке строк и шапки (`StressConf.html`) |
| Явные аргументы конструктора, без `options` | CSS `.custom-popup`, `.custom-popup__input`, `.custom-popup__item` (как в легасi / SelectDistribution) |
| Popup — view; API dims — service; side-effects — колбеки блока | Подсветка кнопки фильтра: `fill` `#004c97` / `#00972e`, `data-selected`, tippy «Фильтр» / имя |
| Закрытие по клику вне popup | Поиск в popup: `placeholder="Найти"`, фильтрация списка по вводу |
| Два экземпляра на блок (`'Input'` / `'Output'`) | Header filter «Все» сбрасывает фильтр; Number — точное совпадение `number.toString() === val` |

**`*View`** — без прямых вызовов Fore/API. UI-хелперы из легасi — **копия** приватными методами, без `import` из `Stress/`.

### Читаемость кода (заказчик)

Не размножать проверки «на всякий случай» на каждый DOM-узел. Разметка кнопок — как в `StressConf.html`. См. **`input.md`** п.0.3, **`stressnew.mdc`**.

### Явные аргументы (заказчик)

**Запрещён** паттерн `constructor(options)`.

| Плохо | Хорошо |
|-------|--------|
| `new FilterPopUpController({ apiClient, table, onFilter })` | `new FilterPopUpController(service, 'Input', getIndicators, getProductOptions, getDistributionOptions, getIndicatorCatalog, onIndicatorOptions, …)` |

- Экземпляры — только в **`InputController`** / **`OutputController`**.
- `FilterPopUpService` — **inline**: `new FilterPopUpService(apiClient)`.

### Validator — каркас сейчас, чистка позже

По согласованию с заказчиком: **все 4 слоя** создаём сразу (в т.ч. **`FilterPopUpValidator`** как заглушка). В легасi фильтры **не валидируют** save/run и не показывают inline-ошибки. После реализации, если validator остаётся пустым — удалить в **`CODEBASE_HARDENING.md`** (фаза D), как мёртвые заглушки.

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию, проверяем на странице отчёта (или сверка с легасi).
2. В таблице: `[x]` — сделано, `[ ]` — нет, `[—]` — вне scope.
3. **§0** — каркас всех четырёх файлов + wiring в Input/Output (можно одной итерацией).
4. Порядок реализации поведения: **§3** (header) → **§4** (distribution) → **§5** (indicator по блоку) — от простого к API.
5. Сверка с легасi — side-by-side на той же структуре с несколькими строками Input/Output.

---

## Текущее состояние StressNew (кратко)

| Область | Сейчас |
|---------|--------|
| `ScenarioNodes/FilterPopUp/*` | §0–§5 готово (фильтры header, distribution, indicator) |
| `InputView` / `OutputView` | Все `filtering*` handler'ы подключены |
| `StressApi` | `getModelBlockDimElements`, `getStressPoksIndicators(indType, blockId)` — §2 |
| BI | Фильтры `filtering*` — smoke **✓** 2026-06-24 (заказчик); фаза C.3 закрыта |

---

## Границы (что входит / не входит)

| Входит в C.3 | Не входит |
|--------------|-----------|
| **Шапка Input:** `filteringInput` mode=`Number` / `Name` / `Product` | `addNewDistribution` / `searchDistribution` — п.16 |
| **Шапка Output:** `filteringOutput` (те же mode) | — |
| **Строка Input:** `filteringIndicator`, `filteringDistribution` | Изменение payload / auto-validate save-run |
| **Строка Output:** `filteringIndicator` | Confirm перед фильтрацией — **нет в легасi** |
| Floating popup + search + click outside | Новые бизнес-правила фильтрации |
| Скрытие строк `.hidden__row` (header filter) | Вынос общего `CustomPopupHelper` — опционально в hardening |
| Перезагрузка options select2 в **текущей** строке | Массовая перезагрузка всех строк |
| Загрузка `DK_MODEL_BLOCK_NSISPRAV` + `STRESS_POKS` с `BLOCK_ID` | Прогон BI (конец файла) |

---

## Карта легасi → StressNew (фильтры)

Справочная таблица: что делал каждый `StressModes.FILTERING_*` в легасi и **какой метод StressNew** это заменяет (не строка mode).

| Легасi `mode` / триггер | StressNew |
|-------------------------|-----------|
| `filteringInputItemsNumber` / `Name` / `Product` | `openHeaderFilter(headerColumn, …)` + `layout: 'header'` |
| `filteringOutputItems*` | то же (`table: 'Output'` в конструкторе) |
| `filteringDistributionInput` | `openDistributionFilter` (только Input) |
| `filteringIndicatorInput` / `Output` | `openIndicatorBlockFilter` |
| `CustomePopUp.render` / `createfiltering*` | `FilterPopUpView.showListPopup` |
| `applyIndicatorOptionsFromData` | `InputView.refreshRowIndicatorSelect2` / Output |
| `createSerachInputItems` / `Output` | `InputView.applyHeaderRowFilter` / Output |
| `filterInputItems` / `filterOutputItems` | `FilterPopUpService.buildHeaderFilterItems` |
| `BlocksIndicatorsEls` | `FilterPopUpService.loadModelBlockOptions` + кэш controller |
| `$nav.append($popUp)` | `$anchor`, `$nav` в `showListPopup` |
| Позиционирование | `layout: 'header' \| 'row'` во view (§1) |

### Подготовка data для header filter (легасi `filterInputItems`)

```text
headerColumn === "Product":
  data = productOptions → { number: id, indicatorName: name }
иначе:
  data = текущие строки блока → { number, indicatorName }
  unshift { number: "Все", indicatorName: "Все" }
  если headerColumn !== "Number" → unique by indicatorName
```

---

## Карта легасi → StressNew (слои)

| Легасi | Куда в StressNew |
|--------|------------------|
| `CustomePopUp.init` / `render` | Три метода `FilterPopUpController` → `FilterPopUpView.showListPopup` |
| `createfilteringIndicatorInput/Output` | `FilterPopUpView` items + `controller.handleIndicatorBlockSelect` → service → callback |
| `applyIndicatorOptionsFromData` | `InputView.refreshRowIndicatorSelect2` / `OutputView.refreshRowIndicatorSelect2` |
| `createfilteringDistributionInput` | `FilterPopUpView` + `InputView.refreshRowDistributionSelect2` |
| `createSerachInputItems` / `createSerachOutputItems` | `FilterPopUpView` + `InputView.applyHeaderRowFilter` / `OutputView.applyHeaderRowFilter` |
| `filterInputItems` / `filterOutputItems` | `FilterPopUpService.buildHeaderFilterItems(table, mode, …)` |
| `initFilterInputIndicator` / `initFilterOutputIndicator` | `InputView.bind` / `OutputView.bind` → controller |
| `BlocksIndicatorsEls` | `FilterPopUpService.loadModelBlockOptions()` + кэш в controller блока |
| `$nav.append($popUp)` | anchor: `$btn.parent()` (row) или `.ListHeadlines` (header) — как легасi |
| Позиционирование `getBBox`, `offsetRight=24` | `FilterPopUpView._positionPopup` (копия из `SelectDistributionView`) |

---

## Контракт вызова из InputView / OutputView

Блок **не** вызывает `init(mode)` и **не** обращается к `filterPopUpController` напрямую — только к методам **`InputController`** / **`OutputController`** (как `openSelectDistributionForRow`, `openAnalyticsForRow`). ScenarioNode — деталь реализации контроллера блока.

```text
// Шапка Input (§3.1)
$('[data-rowBtn="filteringInput"]').click →
  controller.openHeaderFilter(
    $(el).attr('mode'),   // 'Number' | 'Name' | 'Product'
    $(el),
    $('#input_block .ListHeadlines'),
  )

// Строка Input — распределение (§4.1)
$('[data-rowBtn="filteringDistribution"]').click →
  controller.openDistributionFilter(rowNumber, $(el), $(el).parent())

// Строка — показатель по блоку (§5.1)
$('[data-rowBtn="filteringIndicator"]').click →
  controller.openIndicatorBlockFilter(rowNumber, $(el), $(el).parent())
```

Output — симметрично (`filteringOutput`, `filteringIndicator`; без `filteringDistribution`).

### Сборка в InputController

```text
InputController (конструктор)
  └─ this.filterPopUpController = new FilterPopUpController(
       new FilterPopUpService(inputService.apiClient),
       'Input',
       () => this.indicators,
       () => this.productOptions,
       () => this.distributionOptions,
       () => this.inputIndicatorOptions,
       (ctx) => this._onFilterPopUpIndicatorOptions(ctx),
       (ctx) => this._onFilterPopUpDistributionOptions(ctx),
       (ctx) => this._onFilterPopUpHeaderFilter(ctx),
     )
```

**OutputController** — без `getDistributionOptions` и без callback distribution (симметрично с `'Output'`).

### Колбеки блока (минимум)

| Колбек | Когда | Действие |
|--------|-------|----------|
| `_onFilterPopUpHeaderFilter` | выбран пункт шапки | `view.applyHeaderRowFilter(headerColumn, value)` |
| `_onFilterPopUpDistributionOptions` | выбран тип распределения | `view.refreshRowDistributionSelect2(rowNumber, filteredOptions)` |
| `_onFilterPopUpIndicatorOptions` | выбран блок | `service.fetchIndicatorsByBlock(indType, blockId)` → `view.refreshRowIndicatorSelect2(...)` |

**Модель строк (`indicators`)** при header filter **не меняется** — только DOM visibility.

---

## FilterPopUpValidator (ожидания)

| Проверка | Нужна? | Примечание |
|----------|--------|------------|
| Пустой список items | опционально | Показать пустой popup — как легасi |
| Guard API fault | опционально | Пустой select2 / console — сверить с легасi (молчит) |
| Save/run validation | **нет** | Вне scope |

**§6:** класс с `export` и JSDoc «заглушка C.3». **§6.4:** удалить в **`CODEBASE_HARDENING.md`** §1.1 — вызовы `validatePopupItems` в `FilterPopUpController` с `void validation`, функционально не используется.

---

## План по шагам

### 0. Техническая база (каркас)

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 0.1 | Создать `FilterPopUp/`: `FilterPopUpController`, `FilterPopUpService`, `FilterPopUpView`, `FilterPopUpValidator`; `export` классов | `ScenarioNodes/FilterPopUp/*.js` | каркас C.3 | [x] |
| 0.2 | Конструктор controller — **явные аргументы**; service → `apiClient`; view → controller ref; validator — stub | `*Controller.js`, `*Service.js`, `*View.js`, `*Validator.js` | — | [x] |
| 0.3 | `_createFilterPopUpController` в **`InputController`** / **`OutputController`**; `_bindPopUpViewsOnce`: `filterPopUpController.view.bind(scope)` (пустой bind OK) | `InputController.js`, `OutputController.js` | `index.js` global | [x] |
| 0.4 | Архитектура: **без** `FilterPopUpModes` / `init(mode)`; явные методы controller + `showListPopup({ layout, searchMatch })` | `filter-popup.md` §«Отказ от mode», `*Controller.js`, `*View.js` | `constants.js` — только справочно | [x] |
| 0.5 | ~~Массовые проверки DOM~~ **не делаем** | этот файл | — | [—] |

---

### 1. FilterPopUpView — общий floating popup

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `showListPopup({ $anchor, $nav, items, layout, searchMatch, onSelect })`: создать `.custom-popup`, удалить старый в `$nav` | `FilterPopUpView.js` | `render()` shell | [x] |
| 1.2 | Позиционирование: `layout: 'row'` — `top: elPosition.top + 24`; `layout: 'header'` — `top: 2.125rem`; `left` через `getBBox` | `FilterPopUpView.js` | `render()` css | [x] |
| 1.3 | Search input + filter: `searchMatch: 'exact'` (header Number) / `'contains'` | `FilterPopUpView.js` | `$searchInput.on('input')` | [x] |
| 1.4 | Render items: highlight `data-selected`; click → `onSelect(item)`; закрыть popup | `FilterPopUpView.js` | `createfiltering*` / `createSerach*` | [x] |
| 1.5 | Click outside → remove popup (`setTimeout` + `$(document).on('click')`) | `FilterPopUpView.js` | `handleClickOutside` | [x] |
| 1.6 | `updateFilterButtonState($anchor, name)`: fill, `data-selected`, tippy | `FilterPopUpView.js` | повтор в каждом create* | [x] |

---

### 2. FilterPopUpService — dims и подготовка data

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 2.1 | `StressApi.getModelBlockDimElements()` → `Dims.DK_MODEL_BLOCK_NSISPRAV`; prepend `{ k: "-1", n: "Все" }` | `StressApi.js`, `FilterPopUpService.js` | `BlocksIndicatorsData` | [x] |
| 2.2 | `fetchIndicatorsByBlock(indType, blockId)`: `STRESS_POKS` + `BLOCK_ID` через `_fetchDimElements` | `FilterPopUpService.js`, `StressApi.js` | `openDimCombo` + `getFiltredDimElements` | [x] |
| 2.3 | `buildHeaderFilterItems(table, headerColumn, rows, productOptions)` — логика `filterInputItems` / `filterOutputItems` | `FilterPopUpService.js` | `stress-ui.js` | [x] |
| 2.4 | `buildDistributionFilterItems()` — фикс. три пункта «Все / Распределение / Модель» | `FilterPopUpService.js` | `stress-input-rows` click | [x] |
| 2.5 | `filterDistributionOptions(allOptions, typeId)` — `typeId 0` → all; `1/2` → by `distributionType` | `FilterPopUpService.js` | `createfilteringDistributionInput` | [x] |
| 2.6 | Lazy-load / cache model blocks в controller при первом open indicator filter | `FilterPopUpController.js` | `BlocksIndicatorsEls` once | [x] |

---

### 3. Header filter — шапка Input / Output

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 3.1 | `InputView.bind`: click `[data-rowBtn="filteringInput"]` → `controller.openHeaderFilter(attr('mode'), $btn, $nav)` | `InputView.js`, `InputController.js` | `initFilterInputIndicator` | [x] |
| 3.2 | `OutputView.bind`: `[data-rowBtn="filteringOutput"]` → `controller.openHeaderFilter` | `OutputView.js`, `OutputController.js` | `initFilterOutputIndicator` | [x] |
| 3.3 | `InputView.applyHeaderRowFilter(headerColumn, value)`: `.hidden__row` на `#input_block_list` | `InputView.js`, `InputController.js` | `createSerachInputItems` | [x] |
| 3.4 | `OutputView.applyHeaderRowFilter` — `#output_block_list` | `OutputView.js`, `OutputController.js` | `createSerachOutputItems` | [x] |
| 3.5 | CSS: убедиться, что `.hidden__row { display: none }` (или эквивалент легасi) подключён на странице отчёта | стили отчёта | — | [x] |

---

### 4. Row filter — distribution (только Input)

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 4.1 | `InputView`: click `[data-rowBtn="filteringDistribution"]` → `controller.openDistributionFilter(rowNumber, $btn, $nav)` | `InputView.js`, `InputController.js` | `stress-input-rows` ~334 | [x] |
| 4.2 | `FilterPopUpController.openDistributionFilter`: items из service → popup → callback | `FilterPopUpController.js` | `filteringDistributionInput` | [x] |
| 4.3 | `InputView.refreshRowDistributionSelect2(rowNumber, options)`: `empty().select2({ data })` с `formatDistribution` / matcher — **копия** из существующего init | `InputView.js`, `InputController.js` | `createfilteringDistributionInput` ~593 | [x] |

---

### 5. Row filter — indicator по блоку (Input + Output)

| # | Шаг | Файлы | Легасi | Статус |
|---|-----|-------|--------|--------|
| 5.1 | `InputView` / `OutputView`: click `[data-rowBtn="filteringIndicator"]` → `controller.openIndicatorBlockFilter(rowNumber, $btn, $nav)` | `*View.js`, `*Controller.js` | `stress-input-rows` / `stress-output-rows` | [x] |
| 5.2 | `FilterPopUpController.openIndicatorBlockFilter`: load blocks (once) → popup | `FilterPopUpController.js` | `filteringIndicatorInput/Output` | [x] |
| 5.3 | On select (не «Все»): `fetchIndicatorsByBlock` → callback | `FilterPopUpController.js`, `FilterPopUpService.js` | `applyIndicatorOptionsFromData` | [x] |
| 5.4 | `InputView.refreshRowIndicatorSelect2` / Output — select2 config как `_initInputIndicatorSelect2` | `*View.js`, `*Controller.js` | `applyIndicatorOptionsFromData` | [x] |
| 5.5 | Выбор «Все» (`blockId -1`): полный справочник `inputIndicatorOptions` / output catalog | `FilterPopUpController.js` | `id === 0` / «Все» в distribution; для blocks `k: "-1"` | [x] |

---

### 6. Завершение фазы C.3

| # | Шаг | Статус |
|---|-----|--------|
| 6.1 | Пройти чеклист §0–5 для Input; Output — без §4 | [x] |
| 6.2 | Обновить `input.md` §6.5, `output.md` §4.5 / §6.5 — статус фильтров | [x] |
| 6.3 | Обновить `REFACTORING_REMAINING.md` §5.1 — C.3 | [x] |
| 6.4 | `FilterPopUpValidator` — удалён в **CODEBASE_HARDENING** §1.1b | [x] |
| 6.5 | Ручная проверка на BI — smoke фильтров | [x] |

---

## Чеклист 6.1 (сверка по коду)

| § | Input | Output |
|---|-------|--------|
| 0 | `FilterPopUpController` в конструкторе; `'Input'` | `'Output'` |
| 1 | popup открывается у row + header кнопок | row + header |
| 2 | model blocks + STRESS_POKS API | то же, `indType=2` |
| 3 | header Number/Name/Product скрывает строки | симметрично |
| 4 | `filteringDistribution` сужает distribution select2 | **—** |
| 5 | `filteringIndicator` сужает indicator select2 | симметрично |

`StressController` FilterPopUp **не импортирует**.

---

## Согласование с SelectDistribution

`SelectDistributionView` уже содержит дублирующий код `.custom-popup` (§4.5–4.6). **В C.3** допустимо повторить паттерн в `FilterPopUpView` (как в других переносах). Общий helper — **не блокер**; вынести при hardening, если заказчик согласует.

---

## Вне этого файла

- **`SelectDistribution`** — search/add distribution из CustomePopUp **готово** (п.16).
- **`recheckAllIndicators`** — **✓ C.1** (`params.md` §6.2).
- **`stressIdPopUp`** — **✓ C.2** (`StressView` + `StressController.runTest`).
- **`validation.md`** — фильтры **не участвуют** в save/run.
- Заглушки `openEditPopup` / `openUploadPopup` — удалить в hardening, не путать с FilterPopUp.

---

## Проверка на BI / сервере

- [x] Input header: Number / Name / Product — показывается одна строка; «Все» — весь список.
- [x] Output header: то же.
- [x] Input row: `filteringDistribution` — список распределений только выбранного типа; иконка зелёная при активном фильтре.
- [x] Input row: `filteringIndicator` — выбор блока → другой набор в select2 показателя.
- [x] Output row: `filteringIndicator` — симметрично.
- [x] Click outside закрывает popup; повторный open — один popup.
- [x] Save/run payload **не меняется** от header filter (строки скрыты, но в модели остаются).
- [x] Нет регрессий SelectDistribution search/add popup.

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-06-24 | — | — | Создан файл плана `filter-popup.md` (C.3 / FilterPopUp) |
| 2026-06-24 | 0.1 | — | `ScenarioNodes/FilterPopUp/*` — четыре ES-модуля, `export` классов |
| 2026-06-24 | 0.2 | — | JSDoc слоёв и typedefs; service — stub API + `filterDistributionOptions`; controller — `open*` + handlers; view — `showPopup` stub |
| 2026-06-24 | 0.3 | — | `_createFilterPopUpController` + stub-колбеки в Input/Output; `view.bind` в `_bindPopUpViewsOnce` |
| 2026-06-24 | 0.4 | — | ~~`FilterPopUpModes.js`~~ отменено; §«Отказ от mode»: `openHeaderFilter` / `openDistributionFilter` / `openIndicatorBlockFilter` + `showListPopup({ layout, searchMatch })` |
| 2026-06-24 | 1.1 | — | `showListPopup`: guard anchor/nav, `_removePopupInNav`, `_createPopupShell`, append в `$nav` |
| 2026-06-24 | 1.2 | — | `_positionListPopup` + `_getAnchorWidth` (`layout` header/row, `getBBox`, offset 24) |
| 2026-06-24 | 1.3 | — | `_prependSearchInput`, `_filterItemsForSearch` (exact/contains), `_fillListBody` (preview без click) |
| 2026-06-24 | 1.4 | — | `_fillListBody`: highlight `data-selected`, click → `onSelect` + `closeAllPopups`; `_isItemHighlighted` |
| 2026-06-24 | 1.5 | — | `_bindClickOutside` / `_unbindClickOutside`; `setTimeout(0)` + `click.filterPopUpOutside` на document |
| 2026-06-24 | 1.6 | — | `updateFilterButtonState`: fill `#004c97`/`#00972e`, `data-selected`, tippy «Фильтр»/имя |
| 2026-06-24 | 2.1 | — | `StressApi.getModelBlockDimElements()` + `FilterPopUpService.loadModelBlockOptions()` (prepend «Все») |
| 2026-06-24 | 2.2 | — | `getStressPoksIndicators(indType, blockId)` + `fetchIndicatorsByBlock` → `_normalizeDimItems` |
| 2026-06-24 | 2.3 | — | `buildHeaderFilterItems`: Product из справочника; иначе rows + «Все» + unique by `indicatorName` |
| 2026-06-24 | 2.4–2.6 | — | Уже в коде с §0.2: `buildDistributionFilterItems`, `filterDistributionOptions`, `_ensureModelBlockOptions` — отмечены в чеклисте |
| 2026-06-24 | 3.1 | — | `InputView._bindHeaderFilterButtons`: click `filteringInput` → `openHeaderFilter(mode, $btn, $nav)` |
| 2026-06-24 | 3.2 | — | `OutputView._bindHeaderFilterButtons`: click `filteringOutput` → `openHeaderFilter(mode, $btn, $nav)` |
| 2026-06-24 | 3.3 | — | `InputView.applyHeaderRowFilter` + `_onFilterPopUpHeaderFilter` → `.hidden__row` на `#input_block_list` |
| 2026-06-24 | 3.4 | — | `OutputView.applyHeaderRowFilter` + колбек OutputController — симметрично §3.3 |
| 2026-06-24 | 3.5 | — | `.hidden__row { display: none !important }` в `less/StressConf.less` — подключён на странице отчёта |
| 2026-06-24 | 4.1 | — | `InputView.renderIndicators`: click `filteringDistribution` → `controller.openDistributionFilter` |
| 2026-06-24 | — | — | Рефакторинг: View → `InputController`/`OutputController.openHeaderFilter` / `openDistributionFilter`, не `filterPopUpController` напрямую |
| 2026-06-24 | 4.2 | — | `openDistributionFilter` + `_handleDistributionItemSelect` → `onDistributionOptions` (уже с §0.2 / §2.4–2.5) |
| 2026-06-24 | 4.3 | — | `InputView.refreshRowDistributionSelect2`; `_onFilterPopUpDistributionOptions` → view |
| 2026-06-24 | 5.1 | — | `openIndicatorBlockFilter` в Input/OutputController; bind `filteringIndicator` в `renderIndicators` |
| 2026-06-24 | 5.2 | — | `openIndicatorBlockFilter` + `_ensureModelBlockOptions` — popup блоков (с §0.2) |
| 2026-06-24 | 5.3 | — | `_handleIndicatorBlockItemSelect` → `fetchIndicatorsByBlock` → `onIndicatorOptions` |
| 2026-06-24 | 5.4 | — | `refreshRowIndicatorSelect2` Input/Output; колбеки `_onFilterPopUpIndicatorOptions` |
| 2026-06-24 | 5.5 | — | `getIndicatorCatalog` в FilterPopUpController; «Все» → `inputIndicatorOptions` / `outputIndicatorOptions` |
| 2026-06-24 | 6.1 | — | Чеклист §0–5: Input полный; Output без §4 — сверка + BI smoke |
| 2026-06-24 | 6.2 | — | `input.md` §6.5, `output.md` §4.5 / §6.5 — фильтры → FilterPopUp |
| 2026-06-24 | 6.3 | — | `REFACTORING_REMAINING.md` — C.3 закрыт, фильтры сняты с §5.1 |
| 2026-06-24 | 6.4 | — | `FilterPopUpValidator` — backlog **CODEBASE_HARDENING.md** §1.1 (удалить в фазе D) |
| 2026-06-24 | 6.5 | — | BI smoke фильтров — **✓** (заказчик) |

---

## Следующий шаг

**Фаза C.3 закрыта (§0–§6).** C.1–C.2 — **✓** 2026-06-25. Перенос функциональности из легаси — **~98%** (см. `docs/REFACTORING_REMAINING.md`). Дальше: **B.1** (сверка payload) или **CODEBASE_HARDENING** (в т.ч. удаление `FilterPopUpValidator`, §6.4; синхронизация корневого `StressConf.html`).
