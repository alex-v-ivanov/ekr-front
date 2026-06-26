# Блок Input — план переноса из легаси

Путь кода: `Reports/js/StressNew/InputComponent/`  
Легаси (только чтение): `Reports/js/Stress/stress-input-rows.js`, `stress-ui.js`  
Эталон архитектуры: `Reports/js/StressNew/ParamsComponent/`

**Родительская задача плана:** п.13 — «Блок Input: перенос логики строк ввода, кнопок, данных строк».

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои Controller / Service / View, координатор вместо глобального `stress` | Разметка, CSS-классы, виджеты на странице |
| Явные зависимости (`StressApi`, сервисы) | jQuery, Select2, AirDatepicker, tippy — как в легаси |
| Состояние в контроллере блока | Формат данных для save/run, цепочки событий UI |
| Читаемый перенос из `Reports/js/Stress/` | Поведение кнопок, комбо, дат, режимов view/editor |

**View в StressNew** — без API и бизнес-правил, но **с тем же UI-стеком**, что в легаси: глобальные `$`, `.select2()`, `AirDatepicker`, tippy.

**Не импортировать** `Reports/js/Stress/utils.js` и любой другой код легаси. Если нужны шаблоны Select2, matcher, обвязка dropdown — **копируем** в `InputView` (приватные методы, по образцу `ParamsView`). Легаси `utils.js` — только справочник при переносе.

Критерий готовности подпункта: на той же HTML-странице блок **выглядит и ведёт себя** как до рефакторинга (сравнение с легаси).

**Блок Params** (даты AirDatepicker, Select2 на комбо) — отдельный план: **`Reports/js/StressNew/ParamsComponent/params.md`**.

### Читаемость кода (заказчик)

Не размножать в `*View` и контроллерах проверки «на всякий случай» на каждый DOM-узел (чтобы основная логика оставалась читаемой). Разметку отчёта считаем **как в легаси**; отдельная задача на устойчивость к пустой разметке — только по явному запросу.

---

## Как работать по плану

1. Берём **один** подпункт (например `1.2`), реализуем, проверяем в IDE.
2. Отмечаем в таблице: `[x]` — сделано, `[ ]` — нет.
3. После согласования с заказчиком — следующий подпункт (не пачкой).
4. **`InputValidator`** — guards, `validateRowOptions`, confirm-тексты, save/run — **`../validation.md`** (§2, §6).
5. **ScenarioNodes** — вне п.13, кроме точек интеграции из других планов (см. §«Связь с п.18»).

---

## Границы (что входит / не входит)

| Входит в этот план | Не входит (отдельные задачи) |
|--------------------|------------------------------|
| Модель строки, CRUD списка | ~~`filteringIndicator` / `filteringDistribution`~~ → **`FilterPopUp`** (C.3, `../ScenarioNodes/filter-popup.md`) |
| Полная отрисовка колонок строки | Полный `validate()` save/run — **`../validation.md`** (реализовано; BI ✓ 2026-06-24) |
| Select2/комбо показатель и распределение | `recheckAllIndicators` при смене версии — **✓** `params.md` §6.2 |
| Даты, Options, Schedule, AcceptableRange | ~~Фильтр списка в шапке~~ → **FilterPopUp** §3 |
| view/editor, save/editeRow; `validateRowOptions` при save | Прогон на рабочем BI (§8.4) |
| Реакция на `setParams`, загрузка справочников | |
| `setMessages`, confirm `removeRow` / `fileRemove` / clear list | |
| Связь с `StressController`, шапка `data-stress-action` | |
| **ScenarioNodes в Input** (§п.16–19): Analytics/Analysis (п.18), AddList (п.17), SelectDistribution (п.16), **`loadingFile` / `data`** (Upload/ArrayData, п.19) — **готово** | |

---

## Текущий статус (закрыт по scope п.13; сверка payload — B.1)

| Область | Статус |
|---------|--------|
| Каркас Controller / Service / View / `StressController` | готово |
| Справочники + init при bind (§1) | готово |
| CRUD, patch, `applyDistribution` (§2) | готово |
| Полный render строки (§3) | готово |
| Комбо показатель/распределение (§4.1–4.5) | готово |
| Исторический/допустимый диапазон (§5) | готово |
| Кнопки строки editeRow/save/remove/fileRemove (§6) | готово |
| `recalculate`, `setMessages` (§7.1, 7.3) | готово |
| Analytics / Analysis из строки и шапки (п.18) | готово |
| AddListIndicators из шапки (п.17) | готово |
| **`loadingFile` / `data`** (Upload / ArrayData, п.19) | готово |
| `selection` (SelectDistribution, п.16) | готово |
| `filtering*` (FilterPopUp, C.3) | готово — `../ScenarioNodes/filter-popup.md` |
| Полный `validate()` save/run | **`../validation.md`** — реализовано; BI ✓ 2026-06-24 |
| `checkIndicator` при смене версии | реализовано — `params.md` §6.2 |
| Завершение §8 (сверка payload, BI smoke) | BI ✓ 2026-06-22; **8.2** [ ] |

---

## Карта легаси → StressNew

| Легаси (`InputRowsManager`) | Куда в StressNew |
|-----------------------------|------------------|
| `inputDataRows` | `InputController.indicators` |
| `renderInput` | `InputView.renderIndicators` + методы контроллера |
| `addNewInput` | `addNewIndicator` + guard; пустая строка `status: -1` (красный без API); первый `checkIndicator` — `onIndicatorSelect` |
| `addInputBtnEvent` | обработчики во `InputView` → контроллер |
| `initInputIndicator` | контроллер + view (select2) |
| `initInputDistribution` | контроллер + view |
| `initInputHistoricalRange`, `fillHistoricalRange` | контроллер + view |
| `fillDistributionOptions`, `applyDistributionParamsData` | контроллер + view |
| `updateInputValidDateRange`, `handleCheckDataResponse` | `InputService` + контроллер |
| `checkRangeDate` | контроллер (подсветка UI, без диалогов) |
| `chackValidInputOptions` | `InputValidator.validateRowOptions` при save строки (`validation.md` §2.2–2.3) |
| `analyticsPopUp` / `analysisPopUp` | `InputController`: `openAnalyticsForRow`, `openIndicatorsAnalysis` (п.18) |
| `uploadFilePopUp` / `arrayDataPopUp` | `InputController`: `openUploadFileForRow`, `openArrayDataForRow`, `applyExcelToRow` (п.19) |
| `selection`, filter в `addInputBtnEvent` | `selection` → `openSelectDistributionForRow` (п.16); `filtering*` → `FilterPopUpController` (C.3) |

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | `import` в `InputController`: `InputView`, `InputValidator`; `export` класса `InputView` | `InputController.js`, `InputView.js` | — | [x] |
| 0.2 | UI-паритет: во `InputView` — jQuery + Select2; нужные хелперы **скопировать** в view (как в Params: `_format*`, `_bindSelect2DropdownUi`), **без импорта** из легаси; контроллер/сервис без `$` | `InputView.js` | `initInputIndicator`, `initInputDistribution` | [x] |
| 0.3 | ~~Проверки наличия `#input_block_list` / кнопки~~ **не делаем** на этом этапе (тот же принцип, что в `params.md` п.0.3: без захламления view). | документы | — | [x] |

---

### 1. Инициализация и справочники

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 1.1 | `bindView` → `await controller.init()` (или `onBind`): вызов `loadInputDimSelectOptions()` | `InputController.js`, `InputView.js` | `stress-ui` загрузка `InputIndicatorEls` | [x] |
| 1.2 | Нормализовать элементы справочников в контроллере (`id`/`name` для select2) | `InputController.js` | формат `InputIndicatorEls` | [x] |
| 1.3 | View: Select2 на `.indicator` / `.distribution` с полным `data` (не одной опцией) | `InputView.js` | `initInputIndicator` data | [x] |
| 1.4 | После init — `renderIndicators(getData())` | `InputView.js` | `renderInput` после загрузки dims | [x] |

---

### 2. CRUD списка и координатор

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | Guard «добавить строку»: `InputValidator.canAddRow` + `setMessages` | `InputController.js` | `addNewInput` проверка combo | [x] |
| 2.2 | Прокрутка к новой строке при добавлении (опционально) | `InputView.js` | scroll в `renderInput([null])` | [x] |
| 2.3 | `setIndicators([])` / пустая структура — очистить список | `InputController.js`, `InputView.js` | очистка `inputDataRows` | [x] |
| 2.4 | `patchIndicator(number, partial)` — точечное обновление модели без полного re-render (по необходимости) | `InputController.js` | — | [x] |
| 2.5 | `applyDistribution(data)` — мерж в строку по `number`, не только `syncIndicators` | `InputController.js` | логика после подбора (без попапа — только контракт) | [x] |

---

### 3. Полная отрисовка строки (read-only часть)

Для каждой строки из `indicators` при `renderIndicators`:

| # | Шаг | Поле / UI | Легаси | Статус |
|---|-----|-----------|--------|--------|
| 3.1 | Номер, `row-id` | Number | ✓ частично | [x] |
| 3.2 | Product из `analytics.product` | Product | `syncProductFieldFromAnalytics` | [x] |
| 3.3 | Schedule: иконка `img/distribution/{name}.svg` | Schedule | блок ~130–136 | [x] |
| 3.4 | Options: отрисовка `distributionParams` (текст/инпуты без валидации) | Options | `fillDistributionOptions` | [x] |
| 3.5 | AcceptableRange: `validDateFrom`–`validDateTo` | AcceptableRange | ~168–179 | [x] |
| 3.6 | HistoricalRange: значения + id полей `dateFrom__{n}` | HistoricalRange | ~181–184 | [x] |
| 3.7 | Excel-состояние: классы `ListRow__green/yellow`, видимость Distribution/HistoricalRange | row | ~146–166 | [x] |
| 3.8 | fileInfo / fileRemove: видимость, tooltip по `ExcelName` (без удаления файла пока) | кнопки | ~157–165 | [x] |
| 3.9 | Статус строки: `ListRow__error` по `status` (без вызова `checkIndicator`) | row | ~140–144 | [x] |
| 3.10 | Режим view/editor: для загруженных строк — view, для новой — editor | mode | ~110–111 | [x] |
| 3.11 | Tooltips `tippy` на `[tooltipe]` (если библиотека есть на странице) | — | ~189–201 | [x] |

---

### 4. Редактирование: показатель и распределение

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 4.1 | Select2 на `.indicator`: templateResult/Selection как в легаси (методы в `InputView`, без импорта) | `InputView.js` | `initInputIndicator` | [x] |
| 4.2 | `select2:select` → контроллер: обновить `indicatorId`, `indicatorName`, сброс/обновление product | `InputController.js` | ~421–462 | [x] |
| 4.3 | Select2 на `.distribution` + matcher для моделей | `InputView.js` | `initInputDistribution` | [x] |
| 4.4 | Смена распределения → `distributionId/Name`, `getParamFromRequest`, загрузка params | `InputController.js`, `InputService.js` | ~517–580 | [x] |
| 4.5 | После смены — перерисовать Options, Schedule, видимость HistoricalRange | `InputView.js` | `fillDistributionOptions` | [x] |
| 4.6 | `loadingFile`, `data` — bind → п.19; `selection` — bind → п.16; `filtering*` — bind → C.3 FilterPopUp; `analytics` — п.18 | — | `addInputBtnEvent` | [x] |

---

### 5. Исторический и допустимый диапазон дат

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | Datepicker на `dateFrom` / `dateTo` (как на странице отчёта) | `InputView.js` | `initInputHistoricalRange` | [x] |
| 5.2 | Изменение дат → запись в `historicalRangeFrom/To`, `syncIndicators` или patch | `InputController.js` | change handlers | [x] |
| 5.3 | `fillHistoricalRange(number)` при `setParams` / `recalculate` | `InputController.js` | `fillHistoricalRange` | [x] |
| 5.4 | `InputService`: метод запроса допустимого диапазона (если уже есть в `StressApi`) | `InputService.js`, `StressApi.js` | `updateInputValidDateRange` | [x] |
| 5.5 | Ответ API → обновить `validDateFrom/To` и AcceptableRange в строке | `InputController.js` | `handleCheckDataResponse` | [x] |
| 5.6 | Подсветка ошибок дат в DOM (без `showDialog`) | `InputView.js` | `checkRangeDate` | [x] |

---

### 6. Кнопки строки (без попапов)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 6.1 | `editeRow` → показать editor, скрыть view | `InputView.js` → контроллер | ~254–258 | [x] |
| 6.2 | `save` → view; `validateRowOptions` → `setMessages` при ошибке (легаси `chackValidInputOptions`) | `InputView.js`, `InputValidator.js` | ~236–257 | [x] |
| 6.3 | `removeRow` + confirm (`onRemoveRow` → `removeIndicator`) | `InputController.js` | ~224–234 | [x] |
| 6.4 | `fileRemove` — сброс `ExcelGUID/ExcelType/ExcelName` в модели + re-render (без API удаления файла, если API в попапе) | `InputController.js` | ~346–358 | [x] |
| 6.5 | ~~no-op / disabled~~ **пропуск** (см. ниже) | — | — | [—] |

---

### 7. Реакция на Params и координатор

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 7.1 | Реализовать `recalculate()` при `setParams`: обход строк, `fillHistoricalRange`, при необходимости запрос valid range | `InputController.js` | связь с params | [x] |
| 7.2 | `onInputChanged` в `StressController` — минимум: заглушка или триггер глобального validate (без логики) | `StressController.js` | — | [—] отложено |
| 7.3 | `setMessages` во view — зона сообщений input (разметка как у Params, если есть) | `InputView.js` | — | [x] |

---

### 8. Завершение задачи п.13

| # | Шаг | Статус |
|---|-----|--------|
| 8.1 | Пройти чеклист 0–7, все `[x]` в scope (`[—]` — осознанные пропуски) | [x] |
| 8.2 | Сверка `getData()` с форматом save/run (`StressService._mapInputRowToModule`, `mapAnalyticsToModule`) | [ ] |
| 8.3 | Краткая запись в `TASK_LOG` / `CHANGELOG` (когда появится папка `docs`) | [ ] |
| 8.4 | Ручная проверка на BI (см. ниже) | [x] smoke 2026-06-22 |

---

## `checkIndicator` при смене версии прогноза

Легаси **`checkIndicator`** при смене **версии прогноза** (`stress-ui.js` `initPrognozVersionCombo` ~210–232, `index.js` `checkIndicator`) в StressNew уже перенесён.

| Что реализовано | Где |
|-----------------|-----|
| `recheckAllIndicators()` — цикл по строкам, `CheckSingleStructure`, `ListRow__error` | `InputController` + `InputView`; симметрично для **Output** |
| Вызов после смены `versionId` | `StressController.onParamsChanged` → `InputController.setParams` / `OutputController.setParams` |
| Зависимости | Полный render строк, API в сервисе, п. 3.9+ (статус строки) |

При смене версии прогноза строки **не перезагружаются**, а перепроверяются в `setParams`; загрузка структуры остаётся отдельной цепочкой через `stressTestVersionId`.

---

## П. 6.5 — кнопки строки и шапки (ScenarioNodes)

| Кнопка | Статус |
|--------|--------|
| `analytics` | **[x]** п.18 — `openAnalyticsForRow`, `AnalyticsPopUpController` в `InputController` |
| Шапка «Анализ списка» | **[x]** п.18 — `openIndicatorsAnalysis` → `AnalysisPopUpController` |
| `loadingFile` | **[x]** п.19 — `openUploadFileForRow` → `UploadFilePopUpController`; guard показателя — `canOpenUploadFile` |
| `data` | **[x]** п.19 — `openArrayDataForRow` → `ArrayDataPopUpController`; без guard (паритет легасi) |
| `selection` | **[x]** п.16 — `openSelectDistributionForRow` → `SelectDistributionController` |
| `filteringIndicator`, `filteringDistribution` | **[x]** C.3 — `FilterPopUpController` в `InputController`; план `../ScenarioNodes/filter-popup.md` |
| `filteringInput` (шапка) | **[x]** C.3 — `openHeaderFilter` → `applyHeaderRowFilter` |

Планы попапов: **`../ScenarioNodes/analytics-analysis-popups.md`** (п.18), **`../ScenarioNodes/select-distribution-chart.md`** (п.16), **`../ScenarioNodes/upload-array-data-popups.md`** (п.19), **`../ScenarioNodes/filter-popup.md`** (C.3).

---

## П. 7.2 — отложено (решение заказчика)

Колбек `InputController` → `StressController.onInputChanged` **уже подключён** (`_notifyIndicatorsChanged`), данные для save/run — через `getData()`.

**Сейчас не делаем:** авто-`validate()` / `setMessages` на каждый `patchIndicator` (слишком часто; валидаторы пустые).

**Позже (п. 15 или отдельно):** debounced `validate()` + раскладка сообщений, либо логика только на save/run (как сейчас). Симметрично — `onOutputChanged` в `StressController`.

---

## Связь с п.18 (AnalyticsPopUp / AnalysisPopUp)

План: **`../ScenarioNodes/analytics-analysis-popups.md`**.

| Что | Где в Input |
|-----|-------------|
| Экземпляры попапов | `InputController` конструктор: `_createAnalyticsPopUpController`, `_createAnalysisPopUpController` |
| `view.bind` модалок | `_bindPopUpViewsOnce` при первом `bindView` |
| Save analytics в строку | `applyAnalytics` → `checkIndicator` + `updateInputValidDateRange` (п.18 §3.5) |
| Confirm удаления из Analysis | `setShowConfirmDialog` → `analysisPopUpController` |

`StressController` **не импортирует** ScenarioNodes.

---

## Связь с п.17 (AddListIndicators)

План: **`../ScenarioNodes/add-list-indicators.md`**. Симметрично в **`OutputController`** / **`OutputView`**.

| Что | Где в Input |
|-----|-------------|
| Экземпляр попапа | `InputController`: `_createAddListIndicatorsController` |
| `view.bind` модалки | `_bindPopUpViewsOnce` при первом `bindView` |
| Шапка «Добавить список» | `InputView` → `openInputIndicatorsList` → `openIndicatorsList` → `openModal` |
| Copy в список | `onCopy` → `applyLoadedIndicatorRows` → `setIndicators` |
| Waiter | `setWaiter` → `addListIndicatorsController.setWaiter`; токен `'Copy List'` |
| Одна модалка в DOM | `AddListIndicatorsView.setAsActive` при `openModal` (§5.2) |

`StressController` **не импортирует** ScenarioNodes. `InputService` **не импортирует** `StressService`.

---

## Связь с п.19 (UploadFilePopUp / ArrayDataPopUp)

План: **`../ScenarioNodes/upload-array-data-popups.md`**.

| Что | Где в Input |
|-----|-------------|
| Экземпляры попапов | `InputController`: `_createUploadFilePopUpController`, `_createArrayDataPopUpController` |
| `view.bind` модалок | `_bindPopUpViewsOnce` при первом `bindView` |
| Кнопки строки | `InputView`: `[data-rowBtn="loadingFile"]` → `openUploadFileForRow`; `[data-rowBtn="data"]` → `openArrayDataForRow` |
| Save / Select → строка | `applyExcelToRow` ← `_onUploadFileApply` / `_onArrayDataApply` |
| ArrayData: `checkIndicator` после apply | `_onArrayDataApply` (легасi `selected`); Upload — без check |
| JSON для API Excel | `InputService.buildExcelRequestPayload` |
| PutBin | `StressController.setPutBinConfig` → `InputController` → Upload (не import ScenarioNodes в координаторе) |
| Payload save/run | `getData().input[]` → `StressService._appendExcelFieldsIfPresent` (п.19 §7.4) |
| `fileRemove` + `DeleteExcelDataSet` | п.19 §8 — отдельно от модалок |

`StressController` **не импортирует** ScenarioNodes.

---

## Confirm диалоги (`validation.md` §6)

| Кнопка | Метод | Текст (`InputValidator`) | Статус |
|--------|-------|--------------------------|--------|
| `removeRow` | `onRemoveRow` | `CONFIRM_DELETE_INDICATOR` | [x] |
| `fileRemove` | `onFileRemove` | `CONFIRM_DELETE_FILE` | [x] |
| «Очистить список» | `onClearAllIndicators` | `CONFIRM_DELETE_ALL_INPUT` | [x] |

Проброс диалога: `StressController.setShowConfirmDialog` → `InputController.setShowConfirmDialog`. API `DeleteExcelDataSet` для `fileRemove` — **`upload-array-data-popups.md` §8** (локальный сброс — п.13 §6.4).

---

## Вне плана п.13

- Локальная валидация save/run — **`../validation.md`** (реализовано). Сквозные правила — `StressValidator`.
- **`SelectDistribution`** — п.16 **готово** (план `../ScenarioNodes/select-distribution-chart.md`).
- **`UploadFilePopUp` / `ArrayDataPopUp`** — п.19 **готово** (код §0–7; §8 `DeleteExcelDataSet`, BI — в плане).
- **`AddListIndicators`** — п.17 **готово** (план `../ScenarioNodes/add-list-indicators.md`; Output — симметрично, отдельного `output.md` нет).
- `recheckAllIndicators` при смене версии — **`../ParamsComponent/params.md`** §6.2 (**✓** C.1).
- `stress-ui.js`: `filterInputItems`, `initFilterInputIndicator`.
- `stress-input-select-distribution.js` (легаси подбора).

---

## Проверка на BI / сервере (§8.4)

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик). Run/Save сценария — не проверялось.

Базовый блок Input (п.13):

- [x] `bindView` — справочники подгружаются, строки из структуры.
- [x] Добавление/удаление строки (confirm), save/edit, `validateRowOptions` при save.
- [x] Смена показателя/распределения/дат — UI и `getData()` (payload на сервере — §8.2).
- [x] `recalculate` при смене params — HistoricalRange, AcceptableRange.

П.18 (из `analytics-analysis-popups.md`):

- [x] analytics по строке → save → Product и кнопка analytics.
- [x] save analytics → AcceptableRange (при `versionId`).
- [x] analytics без показателя → «Выберите показатель».
- [x] Шапка «Анализ списка» — таблица, удаление с confirm.
- [x] `filteringIndicator` / `filteringDistribution` / `filteringInput` — **✓** C.3 FilterPopUp (BI 2026-06-24).

П.17 (из `add-list-indicators.md`):

- [x] Шапка «Добавить список» → модалка → copy → список заменён.
- [x] Нет legacy `onclick` на модалке AddListIndicators (сверка по коду).

П.19 (из `upload-array-data-popups.md`):

- [x] `loadingFile` → модалка upload, drag-drop, SaveExcelDataSet → строка green/yellow, fileInfo
- [x] `data` → список наборов, выбор → те же поля Excel на строке
- [ ] Excel в save/run payload на сервере — формальная сверка §8.2 / `REFACTORING_REMAINING.md` §2.4
- [x] Нет legacy `onclick` на модалках Upload / ArrayData (сверка по коду)

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-05-16 | 0.1 | — | ES-модули: import в InputController, export InputView и InputValidator |
| 2026-05-18 | 0.3 | — | Отменено: без массовых проверок DOM в view (согласование с заказчиком; см. `stressnew.mdc`, `params.md`) |
| 2026-05-20 | 0.2 | — | `InputView`: Select2 на `.indicator`/`.distribution`, хелперы `_format*`, `_matcher*`, `_bindSelect2DropdownUi` (копия из легаси/utils и ParamsView); программный выбор без `select2:select`; `InputValidator.js` — заглушка |
| 2026-05-20 | 1.1 | — | `InputView.bind`: render + `void controller.onBind()` (как Params `_bind`); `bindView` синхронный; `StressApi` — методы справочников по образцу `getForecastVersions` |
| 2026-05-20 | 1.2 | — | `InputService._normalizeDimItems`: `{ k, n }` → `{ id, name }`; view — только `id#;name` для Select2 |
| 2026-05-20 | 1.3 | — | `InputView.setSelect2Options`: полный `data` для всех строк; `_initInput*Select2` с `empty().select2({ data })`; контроллер передаёт справочник после load |
| 2026-05-28 | 1.4 | — | `_runInitialBind`: await `onBind` (справочники) → `renderIndicators(getData())`; убран render до загрузки dims |
| 2026-05-28 | 2.1 | — | `_canAddNewIndicator` в `addNewIndicator`; сообщения — TODO в `InputValidator` (п.15) |
| 2026-05-28 | 2.2 | — | `syncIndicators(number)` → `renderIndicators` + `_scrollToRow` (`scrollIntoView`) только при добавлении |
| 2026-05-28 | 2.3 | — | `_normalizeIndicatorRows`; сброс при `stressTestVersionId == null` / нет source в `StressController`; `renderIndicators` — пустой массив |
| 2026-05-28 | 2.4 | — | `patchIndicator(number, partial, { rerender })`; `applyIndicator` → patch с `rerender: true`; `_notifyIndicatorsChanged` |
| 2026-05-28 | 2.5 | — | `applyDistribution` → `_distributionPartialFromData` + `patchIndicator(..., { rerender: true })` |
| 2026-06-01 | 3.2 | — | Product: `getProductsDimElements`, `setProductCatalog`, `_syncProductField` как `syncProductFieldFromAnalytics` |
| 2026-06-01 | 3.3 | — | `_syncScheduleIcon`: `img/distribution/{distributionName}.svg`, снятие width/height и `invisibility` |
| 2026-06-01 | 3.4 | — | `_fillDistributionOptions`, `_buildOptionsEl` (копия getOptionsEl), без API fillDistributionOptions и без валидации |
| 2026-06-01 | 3.5 | — | `formatAcceptableRange` в service, `acceptableRangeLabel` в DTO, `_renderAcceptableRange` во view; без checkRangeDate / updateInputValidDateRange |
| 2026-06-01 | 3.6 | — | `formatHistoricalRangeDisplay`, `_renderHistoricalRange`: view-текст, `.val()`, id `dateFrom__{n}` / `dateTo__{n}`; без AirDatepicker (п. 5.1) |
| 2026-06-01 | 3.7 | — | `resolveExcelRowState` в service, `_renderExcelRowState` во view; без fileInfo/fileRemove (п. 3.8) |
| 2026-06-01 | 3.8 | — | `resolveExcelFileButtons`, `_renderExcelFileButtons`; tooltip по `ExcelName`; без click fileRemove (п. 6.4) |
| 2026-06-01 | 3.9 | — | `resolveRowErrorState`, `_renderRowErrorState`: `ListRow__error` при `status !== 0`; без `checkIndicator` |
| 2026-06-01 | 3.10 | — | `resolveRowViewMode`, `_renderRowViewMode`; `getParamFromRequest=false` при загрузке строки с `indicatorId`; Options следуют `optionsUseEditorMode` |
| 2026-06-01 | 3.11 | — | `_initRowTooltips`: tippy на `[tooltipe]`, guard если библиотеки нет; раздел 3 закрыт |
| 2026-06-01 | 4.1 | — | `_formatIndicatorTemplateResult/Selection`, `_matcherIndicator`, `_destroySelect2`; опции Select2 как initInputIndicator |
| 2026-06-01 | 4.2 | — | `parseIndicatorFromSelect2`, `onIndicatorSelect`, `_bindIndicatorSelect2Change`; сброс Product в DOM; без analysts/checkIndicator |
| 2026-06-01 | 4.3 | — | `_formatDistributionTemplateResult/Selection`, `_matcherDistribution`, `_destroySelect2` на distribution; data — distributions+models из service |
| 2026-06-01 | 4.4 | — | `parseDistributionFromSelect2`, `loadDistributionParams`, `getDistributionParamDimElements`; `onDistributionSelect`/`onDistributionUnselect`; `_bindDistributionSelect2Change` |
| 2026-06-01 | 4.5 | — | `distributionType` в справочнике; `resolveDistributionTypeByName`, `resolveHistoricalRangeAfterDistributionChange`; `_applyDistributionSelectToRow` + `_renderHistoricalRangeAfterDistributionChange`; `indicatorType` / type кнопки selection |
| 2026-06-01 | 4.6 | — | пропуск: явный disabled не нужен; кнопки без StressNew-обработчиков; removeRow — единственный bind в render |
| 2026-06-01 | 5.1 | — | `_initInputHistoricalRange`, `prepareHistoricalRangeForPicker`; дефолты/конвертация дат в service; destroy при re-render; onSelect — заглушка до 5.2 |
| 2026-06-01 | 5.2 | — | `buildHistoricalRangePatchFromPickers`, `onHistoricalRangePickerSelect`; onSelect → patch модели + view label; без checkRangeDate |
| 2026-06-01 | 5.3 | — | `fillHistoricalRange` во view/controller; `recalculate()` — цикл по строкам; вызов из `setParams` |
| 2026-06-01 | 5.4 | — | `buildCheckDataRequestPayload`, `fetchValidDateRange` → `StressApi.checkData`; без DOM и без `handleCheckDataResponse` (п. 5.5) |
| 2026-06-01 | 5.5 | — | `parseCheckDataValidRangeResponse`; `updateInputValidDateRange` / `applyCheckDataValidRangeResponse`; `updateAcceptableRange` во view; вызовы при render / select indicator / distribution (без Excel); без checkRangeDate (п. 5.6) |
| 2026-06-01 | 5.6 | — | `parseStressMonthDate`, `resolveRangeDateValidation`; `checkRangeDate` / `applyRangeDateValidation`; после picker, CheckData, render (если даты в модели), `recalculate`; без showDialog |
| 2026-06-01 | 6.1 | — | `onEditRow` / `setRowEditMode`; bind `[data-rowBtn="editeRow"]`; `_renderRowViewMode` → editor |
| 2026-06-01 | 6.2 | — | `onSaveRow` → `setRowEditMode(false)`; bind `[data-rowBtn="save"]`; без `chackValidInputOptions` / showDialog |
| 2026-06-01 | 6.4 | — | `buildExcelClearPatch`, `removeExcelFromRow`, bind `fileRemove`; re-render; без API / confirm (§ Confirm диалоги) |
| 2026-06-01 | 6.5 | — | пропуск: без no-op/disabled; клик без handler → отладка в консоли; попапы — п. 16–19 |
| 2026-06-01 | 7.1 | — | `recalculate` async: `_recalculateRow` — fillHistoricalRange; has valid dates → checkRangeDate; иначе при indicatorId → updateInputValidDateRange; Excel — пропуск |
| 2026-06-01 | 7.2 | — | отложено: колбек есть, тело `onInputChanged` пустое; без validate на каждый patch (§ П. 7.2) |
| 2026-06-01 | 7.3 | — | `setMessages`: `[data-input-messages]` / `.block-input__messages`; fallback `.block-input` или перед `#input_block_list`; цепочка `StressController.setMessages` → `inputController.setMessages` |
| 2026-06-01 | 6.3 | — | `onRemoveRow` + confirm; тексты в `InputValidator` (п.15 §6.1) |
| 2026-06-01 | 6.2+ | — | `onSaveRow` + `validateRowOptions` / `VALUES_PROBABILITIES_MISMATCH` |
| 2026-06-08 | п.18 | — | `AnalyticsPopUp` / `AnalysisPopUp` в `InputController`; `applyAnalytics`, `openAnalyticsForRow`, `openIndicatorsAnalysis` |
| 2026-06-08 | 8.1 | — | Сверка чеклиста 0–7 по коду; `[—]` — 4.6, 6.5, 7.2 |
| 2026-06-08 | doc | — | Обновлён «Текущий статус», границы, §6.5, §п.18, BI-чеклист |
| 2026-06-11 | п.17 | — | `AddListIndicators` в `InputController`; §п.17; план `add-list-indicators.md` закрыт |
| 2026-06-24 | C.3 | — | Фильтры `filtering*` → `FilterPopUp`; §6.5 и BI-чеклист обновлены (`filter-popup.md`) |
| 2026-06-25 | docs | — | C.1: `recheckAllIndicators` при смене версии — статус «реализовано»; §«После Input/Output» переписан |
| 2026-06-24 | docs | — | §7.5: validation save/run — не «п.15 отложено»; `checkIndicator` после analytics — актуализировано (п.18) |
| 2026-06-22 | 8.4 | — | Smoke BI: Input + связанные попапы — OK; фильтры C.3 — **✓** 2026-06-24 |

---

## Следующий шаг

**8.2** — сверка `getData().input[]` с `StressService._mapInputRowToModule` (завершающая фаза, `REFACTORING_REMAINING.md` §2.2).
