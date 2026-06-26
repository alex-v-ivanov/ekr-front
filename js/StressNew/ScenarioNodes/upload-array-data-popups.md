# UploadFilePopUp + ArrayDataPopUp — план переноса, колбеки Input

Путь кода: `**Reports/js/StressNew/ScenarioNodes/UploadFilePopUp/**`, `**ScenarioNodes/ArrayDataPopUp/**`  
Легаси (только чтение): `**Reports/js/Stress/stress-popups.js**` (`UploadFilePopUp` ~190 строк, `ArrayDataPopUp` ~130 строк), `**Reports/js/Stress/stress-input-rows.js**` (клик `[data-rowBtn="loadingFile"]`, `[data-rowBtn="data"]`), `**Reports/js/Stress/stress-ui.js**` (`uploadFilePopUp.init`, `arrayDataPopUp.init`), `**Reports/js/Stress/index.js**` (`removeFile` → `DeleteExcelDataSet`, `handleDeleteExcelDataSetResponse`), `**Reports/js/Stress/constants.js**` (тексты Excel-ошибок).  
Справочно при переносе UI: `**utils.js**` (`formatState`, `formatSelected`, `initSelect2Event`) — **не импортировать**; копировать в `*View` приватными методами. PutBin: `**StressApi.putBin`** (`Dims.FOLDER_UPDATE` внутри `StressApi`); `ClientServiceUrl` / `Moniker` — `**getPutBinConfig**` из `StressApp` / `StressController`.  
Эталон архитектуры и стиль плана: `**ParamsComponent/params.md**`, `**InputComponent/input.md**`, `**ScenarioNodes/analytics-analysis-popups.md**`, `**ScenarioNodes/add-list-indicators.md**`.  
Контракты координатора: `**docs/16-stress-controller-contracts.md**` §4 (узлы создаются в `**InputController**`, не в `StressController`). API Excel: `**docs/STRESS_API.md**`, `**StressApi.saveExcelDataSet` / `getExcelDataSets` / `deleteExcelDataSet**`.

**Родительская задача плана:** п.19 — «UploadFilePopUp + ArrayDataPopUp: перенос, колбеки».

---

## Архитектура (решение заказчика, п.19)

**Два ScenarioNode — две модалки, один блок Input.**

```text
InputController
  ├─ uploadFilePopUpController
  │    ├─ UploadFilePopUpService   → PutBin (fetch) + StressApi.saveExcelDataSet
  │    ├─ UploadFilePopUpValidator
  │    └─ UploadFilePopUpView      → DOM #select_UploadFile_block
  └─ arrayDataPopUpController
       ├─ ArrayDataPopUpService   → StressApi.getExcelDataSets
       ├─ ArrayDataPopUpValidator
       └─ ArrayDataPopUpView       → DOM #select_ArrayData_block
```


| Было в легаси                                                                                 | Стало                                                                                  |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Stress.uploadFilePopUp` / `arrayDataPopUp` глобально                                         | Экземпляры только в `**InputController**`                                              |
| `constructor(stress)` — доступ к params, rows, config через `this.stress`                     | Явные аргументы: `service`, `getParams`, `getIndicators`, `getPutBinConfig`, `onApply` |
| Прямое изменение `inputDataRows` и DOM строки в `handleSaveExcelDataSetResponse` / `selected` | `**onApply**` → `**InputController.applyExcelToRow**` → `patchIndicator` + re-render   |
| `InputSelectDistribution.request(..., "SaveExcelDataSet")`                                    | `**UploadFilePopUpService.saveExcelDataSet**` → `StressApi`                            |
| HistoricalRange из `$historicalRangeFrom.selectedDates`                                       | Границы из **модели строки** (`historicalRangeFrom` / `historicalRangeTo`) + `params`  |


**Зона ответственности:** только **Input** (в легасi кнопки `loadingFile` / `data` только в `stress-input-rows.js`; Output — без Excel-попапов).

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**


| Меняем                                                                                | Не меняем                                                                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Слои `*Controller` / `*Service` / `*View` / `*Validator`                              | Разметка `#select_UploadFile_block`, `#select_ArrayData_block`, drag-zone, radio `parameterTypeFile` / `parameterTypeFileData` |
| Состояние сессии — в **controller** (`sessionContext`: `rowNumber`, `indicatorId`, …) | Классы строки `ListRow__green` / `ListRow__yellow`, скрытие Distribution / HistoricalRange при Excel                           |
| API и PutBin → `*Service`; DOM → `*View`                                              | Цепочка upload: файл → PutBin → `ExcelID` → SaveExcelDataSet                                                                   |
| События модалок — view → controller, не `onclick="Reports.Stress.*"`                  | jQuery drag-and-drop, Select2 на `#ArrayDataSelect`                                                                            |
| Колбек `**onApply`** в Input                                                          | Поля строки после Excel: `ExcelGUID`, `ExcelType`, `ExcelName`; сброс `distributionId` / `distributionParams`                  |


`***View**` — без Fore/API; UI-хелперы из легасi — **копия** приватными методами, без `import` из `Stress/`.

### Читаемость кода (заказчик)

Не размножать проверки «на всякий случай» на каждый DOM-узел. Разметка — как в `StressConf.html`. См. `**input.md`** п.0.3, `**stressnew.mdc**`.

### Явные аргументы (заказчик, п.19+)

**Запрещён** паттерн `constructor(options)`.


| Плохо                                                                     | Хорошо                                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `new UploadFilePopUpController({ apiClient, getInputRows, onAfterSave })` | `new UploadFilePopUpController(service, getParams, getIndicators, getPutBinConfig, buildExcelRequestPayload, onApply)` |
| `new ArrayDataPopUpController({ getParamsFromForm, onAfterSelect })`      | `new ArrayDataPopUpController(service, getParams, getIndicators, onApply)`                                             |


- Экземпляры — только в `**InputController`**.
- `*Service` — **inline** при создании: `new UploadFilePopUpService(apiClient)`.

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию, проверяем на странице отчёта (или сверка с легасi).
2. В таблице: `[x]` — сделано, `[ ]` — нет, `[—]` — вне scope.
3. `**UploadFilePopUpValidator` / `ArrayDataPopUpValidator`** — минимально; тексты guard/ошибок — с подпунктом или `**../validation.md**` (п.15).
4. `**DeleteExcelDataSet` для `fileRemove**` — §8 (связано с п.19, но отдельный подпункт от модалок).

---

## Текущее состояние StressNew (кратко)


| Область                               | Сейчас                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ScenarioNodes/UploadFilePopUp/*`     | Полный перенос: View bind, Controller send, Service PutBin + SaveExcelDataSet                    |
| `ScenarioNodes/ArrayDataPopUp/*`      | Полный перенос: Select2, GetExcelDataSets, handleSelect → onApply                               |
| `InputView`                           | Bind `loadingFile` / `data` → `openUploadFileForRow` / `openArrayDataForRow`                    |
| `InputController`                     | `_create*PopUpController`, `applyExcelToRow`, `_onUploadFileApply` / `_onArrayDataApply`, §8   |
| `InputService`                        | `buildExcelRequestPayload`, `deleteExcelDataSet`, Excel UI helpers (п.13 §3.7–3.8)              |
| `fileRemove`                          | Confirm → `DeleteExcelDataSet` → сброс строки или dialog (§8)                                   |
| `StressConf.html`                     | Модалки без legacy `onclick` upload/arrayData; события через `*View.bind`                      |
| `InputController._bindPopUpViewsOnce` | upload + arrayData вместе с analytics / analysis / addList / selectDistribution                  |


*Заглушка `openUploadPopup()` в `InputController` — вне scope п.19 (старый контракт координатора); открытие Excel — только из строки через `openUploadFileForRow`.*

---

## Границы (что входит / не входит)


| Входит в п.19                                                                               | Не входит                         |
| ------------------------------------------------------------------------------------------- | --------------------------------- |
| Модалка **«Загрузить из Excel»**: drag-drop, file input, radio тип, имя набора, «Отправить» | Output-блок (нет кнопок в легасi) |
| Модалка **«Выбрать массив данных»**: Select2, radio тип, «Выбрать»                          | `SelectDistribution` — п.16       |
| Открытие из `[data-rowBtn="loadingFile"]` / `[data-rowBtn="data"]`                          | CustomePopUp / filtering*         |
| PutBin + `SaveExcelDataSet` / `GetExcelDataSets`                                            | AddListIndicators — п.17          |
| Колбек → patch строки Input + re-render (Excel UI уже в InputView)                          | Analytics / Analysis — п.18       |
| §8: `DeleteExcelDataSet` при `fileRemove` (если заказчик подтверждает API в этой фазе)      | Новые бизнес-правила Excel        |
| Проброс `setShowDialog` / `setWaiter` в попапы                                              | Прогон BI (конец файла)           |


---

## Карта легасi → StressNew


| Легасi                                        | Куда в StressNew                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `UploadFilePopUp`                             | `UploadFilePopUpController` + `Service` + `View`                                                |
| `init()` drag-drop, file change, `removeFile` | `UploadFilePopUpView.bind`                                                                      |
| `openModal(inputId)`                          | `UploadFilePopUpController.open(sessionContext)`                                                |
| `send()` → PutBin → SaveExcelDataSet          | `UploadFilePopUpController.handleSend` → `service.uploadFileToBin` + `service.saveExcelDataSet` |
| `handleSaveExcelDataSetResponse`              | `onApply` → `InputController.applyExcelToRow`                                                   |
| `ArrayDataPopUp`                              | `ArrayDataPopUpController` + `Service` + `View`                                                 |
| `init()` Select2 + radio change               | `ArrayDataPopUpView.bind`                                                                       |
| `loadingArrayDataByType`                      | `ArrayDataPopUpController.loadDatasetsForType` → `service.fetchExcelDataSets`                   |
| `handleGetExcelDataSetsResponse`              | Controller хранит `excelDatasets`; view обновляет Select2                                       |
| `selected()`                                  | `handleSelect` → `onApply`                                                                      |
| `stress-input-rows` → `loadingFile` / `data`  | `InputView` → `InputController.openUploadFileForRow` / `openArrayDataForRow`                    |
| `index.removeFile` → DeleteExcelDataSet       | §8 → `InputController.removeExcelFromRow` + API                                                 |
| `StressValidationMessages.COULD_NOT_*_EXCEL`* | `*Validator` или константы рядом с validator                                                    |


---

## Контракт sessionContext (открытие из строки)

Controller **не** ищет строку по DOM; `InputController` передаёт контекст при open.

```text
{
  rowNumber,
  indicatorId,
  analytics,
  historicalRangeFrom,
  historicalRangeTo,
  excelType,          // для pre-select radio (1 | 2), default 1
}
```

Строка берётся из `getIndicators()` по `rowNumber` только если нужно merge при apply (в InputController).

---

## Контракт buildExcelRequestPayload

**Service** — единое место сборки JSON для `SaveExcelDataSet` / `GetExcelDataSets` (легасi `prop` в `send` / `loadingArrayDataByType`).

```text
{
  prognozVersion: Number(params.versionId),
  indicatorId,
  forecastData: { dateFrom, dateTo },   // из params.startDate / endDate (MM.YYYY)
  dateFrom, dateTo,                     // исторический диапазон строки (MM.YYYY)
  analytics: { product: '-1', … },      // merge с row.analytics
  ExcelType?,                           // 1 | 2 — для GetExcelDataSets / SaveExcelDataSet
  ExcelID?, ExcelName?, ExcelGUID?      // только для Save (после PutBin / из ответа)
}
```

Нормализация дат — `**InputService._normalizeMonthForModulePayload**`; analytics — `**InputService._mapAnalyticsToModule**`. Для Save (Upload) в `extras` передать `**includeIterationCounts: true**` (легасi `IterationCount` / `SimulationCount` только в `send`, не в `GetExcelDataSets`).

### PutBin (только Upload)

```text
POST {ClientServiceUrl}/PutBin?createNewDoc=1&format={ext}&fileName={name}&mon={Moniker}!{Dims.FOLDER_UPDATE}
body: FormData (file)
→ XML PutBinResult → ExcelID = "OBJ" + suffix
```

`getPutBinConfig()` → `{ clientServiceUrl, moniker }` — проброс из `**StressController` / `StressApp**` (легасi `stress.config`); `**Dims.FOLDER_UPDATE**` — только в `**StressApi.putBin**`, не в `*Service` попапа.

---

## Контракт onApply (колбек Input)

После успешного Save / Select попап вызывает `**onApply(payload)**`; DOM строки **не** трогает.

```text
{
  number: rowNumber,
  ExcelGUID: string,
  ExcelType: 1 | 2,
  ExcelName: string,
  distributionId: -1,
  distributionName: '',
  distributionParams: [],
}
```

`**InputController.applyExcelToRow(data)**` (или расширение `applyIndicator`):

1. `patchIndicator(number, partial, { rerender: true })`.
2. Excel UI — через существующие `resolveExcelRowState` / `_renderExcelRowState` (п.13 §3.7).
3. **ArrayData:** после apply — `checkIndicator(number)` как в легасi `selected()` (§7.2; можно отложить по аналогии с analytics — см. §«checkIndicator»).

---

## Сборка в InputController

```text
InputController (конструктор)
  ├─ this.uploadFilePopUpController = new UploadFilePopUpController(
  │     new UploadFilePopUpService(inputService.apiClient),
  │     () => this.params,
  │     () => this.indicators,
  │     () => this._getPutBinConfig(),
  │     (sessionContext, params, extras) => this.service.buildExcelRequestPayload(...),
  │     (data) => this._onUploadFileApply(data)
  │   )
  └─ this.arrayDataPopUpController = new ArrayDataPopUpController(
        new ArrayDataPopUpService(inputService.apiClient),
        () => this.params,
        () => this.indicators,
        (data) => this._onArrayDataApply(data)
      )

_onUploadFileApply / _onArrayDataApply → applyExcelToRow(data)
```

`view.bind(scope)` — в `InputController._bindPopUpViewsOnce` (вместе с остальными ScenarioNodes).

Проброс UI:

- `setShowDialog` → оба controller (ошибки API / PutBin).
- `setWaiter` → upload (`'sendSaveExcel'`), arrayData при загрузке списка.

---

## План по шагам

### 0. Техническая база


| #   | Шаг                                                                                                   | Файлы                                                       | Легасi                                 | Статус |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------- | ------ |
| 0.1 | ES-модули `export` в `UploadFilePopUp/*`, `ArrayDataPopUp/*`; `import` в `InputController`            | `*/*.js`, `InputController.js`                              | каркас                                 | [x]    |
| 0.2 | Конструкторы: явные аргументы (§«Явные аргументы»); service inline; **убрать** `constructor(options)` | `*Controller.js`, `InputController.js`                      | —                                      | [x]    |
| 0.3 | ~~Массовые проверки DOM~~ **не делаем**                                                               | —                                                           | —                                      | [—]    |
| 0.4 | `InputService.buildExcelRequestPayload(sessionContext, params, extras)`                               | `InputService.js` или `*Service.js`                         | `send` / `loadingArrayDataByType` prop | [x]    |
| 0.5 | Проброс `getPutBinConfig` из `StressController` / `StressApp` (ClientServiceUrl, Moniker)             | `StressController.js`, `StressApp.js`, `InputController.js` | `stress.config`                        | [x]    |
| 0.6 | Зафиксировать п.19 в `**.cursor/rules/stressnew.mdc`**                                                | `stressnew.mdc`                                             | —                                      | [x]    |


---

### 1. UploadFilePopUpView — bind и UI файла


| #   | Шаг                                                                                                                                                                          | Файлы                                       | Легасi                    | Статус |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------- | ------ |
| 1.1 | `bind`: `.modal-custom__UploadFile`, `#uploadForm`, `.upload-zone_dragover`, `#uploadForm_File`, `#ExcelName`, `[name="parameterTypeFile"]`, `[data-btn="copy"]` (Отправить) | `UploadFilePopUpView.js`                    | `init`                    | [x]    |
| 1.2 | Drag-drop / click zone / `change` на file input; `removeFile` UI                                                                                                             | `UploadFilePopUpView.js`                    | `init`, `removeFile`      | [x]    |
| 1.3 | `openModal` / `closeModal`: toggle `Hidden`, scroll top, сброс формы при close                                                                                               | `UploadFilePopUpView.js`                    | `openModal`, `closeModal` | [x]    |
| 1.4 | Pre-select radio по `excelType` из sessionContext                                                                                                                            | `UploadFilePopUpView.js`                    | `openModal`               | [x]    |
| 1.5 | Inline-ошибки: пустое имя → `.error` на `#ExcelName`; нет файла → `upload-zone_dragover__error`                                                                              | `UploadFilePopUpView.js`                    | `send` else-branch        | [x]    |
| 1.6 | Убрать legacy `onclick` на модалке Upload                                                                                                                                    | `UploadFilePopUpView.js`, `StressConf.html` | onclick                   | [x]    |
| 1.7 | `uploadFilePopUpController.view.bind` в `_bindPopUpViewsOnce`                                                                                                                | `InputController.js`                        | stress-ui init            | [x]    |


---

### 2. UploadFilePopUpController + Service — send


| #   | Шаг                                                                                      | Файлы                          | Легасi                           | Статус |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------- | ------ |
| 2.1 | `open(sessionContext)`: сохранить контекст, передать тип в view                          | `UploadFilePopUpController.js` | `openModal`                      | [x]    |
| 2.2 | `handleSend`: validator → disable кнопки → waiter `'sendSaveExcel'`                      | `UploadFilePopUpController.js` | `send`                           | [x]    |
| 2.3 | `UploadFilePopUpService.uploadFileToBin(formData, config)` — fetch PutBin, parse ExcelID | `UploadFilePopUpService.js`    | fetch PutBin                     | [x]    |
| 2.4 | `saveExcelDataSet(payload)` → `StressApi`; parse `ExcelGUID` из message                  | `UploadFilePopUpService.js`    | SaveExcelDataSet                 | [x]    |
| 2.5 | Успех → `onApply({ number, ExcelGUID, ExcelType, ExcelName, … })` → `closeModal`         | `UploadFilePopUpController.js` | `handleSaveExcelDataSetResponse` | [x]    |
| 2.6 | Ошибки: fault / network → `setShowDialog` (COULD_NOT_SAVE_EXCEL_DATA)                    | Controller, Validator          | constants.js                     | [x]    |


---

### 3. Открытие Upload из строки Input


| #   | Шаг                                                                                                                    | Файлы                           | Легасi                     | Статус |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------- | ------ |
| 3.1 | `InputView`: bind `[data-rowBtn="loadingFile"]`                                                                        | `InputView.js`                  | `$loadingFile.on('click')` | [x]    |
| 3.2 | `InputController.openUploadFileForRow(number)`: найти row, собрать sessionContext                                      | `InputController.js`            | `openModal(id)`            | [x]    |
| 3.3 | Guard (минимально): строка существует; при необходимости — `indicatorId` (как selection — отдельный текст в validator) | `InputController.js`, Validator | —                          | [x]    |
| 3.4 | `uploadFilePopUpController.open(sessionContext)`                                                                       | `InputController.js`            | —                          | [x]    |


---

### 4. ArrayDataPopUpView — bind и Select2


| #   | Шаг                                                                                                              | Файлы                                      | Легасi                                   | Статус |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- | ------ |
| 4.1 | `bind`: `#select_ArrayData_block`, `#ArrayDataSelect`, `[name="parameterTypeFileData"]`, `[data-btn="selected"]` | `ArrayDataPopUpView.js`                    | `init`                                   | [x]    |
| 4.2 | Select2: multiple, `maximumSelectionLength: 1`, `formatState` / `formatSelected` / matcher — **копия** в view    | `ArrayDataPopUpView.js`                    | `init`, `handleGetExcelDataSetsResponse` | [x]    |
| 4.3 | Radio change → controller `onParameterTypeChange`                                                                | `ArrayDataPopUpView.js`                    | `loadingArrayDataByType`                 | [x]    |
| 4.4 | `openModal` / `closeModal`; сброс error на dropdown                                                              | `ArrayDataPopUpView.js`                    | `closeModal`                             | [x]    |
| 4.5 | Убрать legacy `onclick` на модалке ArrayData                                                                     | `ArrayDataPopUpView.js`, `StressConf.html` | onclick                                  | [x]    |
| 4.6 | `arrayDataPopUpController.view.bind` в `_bindPopUpViewsOnce`                                                     | `InputController.js`                       | stress-ui init                           | [x]    |


---

### 5. ArrayDataPopUpController + Service — загрузка и выбор


| #   | Шаг                                                                                     | Файлы                                  | Легасi                           | Статус |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------- | ------ |
| 5.1 | `open(sessionContext)`: pre-select radio, `loadDatasetsForType(type)`, show modal       | `ArrayDataPopUpController.js`          | `openModal`                      | [x]    |
| 5.2 | `fetchExcelDataSets` → `getExcelDataSets`; хранить `excelDatasets[]` в controller       | `ArrayDataPopUpService.js`, Controller | `loadingArrayDataByType`         | [x]    |
| 5.3 | `renderDatasetOptions(json)` во view — переinit Select2 data `index#;ExcelName`         | `ArrayDataPopUpView.js`                | `handleGetExcelDataSetsResponse` | [x]    |
| 5.4 | `handleSelect`: validator (выбор не пуст) → merge из `excelDatasets[index]` → `onApply` | `ArrayDataPopUpController.js`          | `selected`                       | [x]    |
| 5.5 | Inline error «Не заполнено поле!» на пустой select                                      | `ArrayDataPopUpView.js`                | `selected` else                  | [x]    |
| 5.6 | Ошибки API → `setShowDialog` (COULD_NOT_GET_EXCEL_DATA)                                 | Controller                             | constants.js                     | [x]    |


---

### 6. Открытие ArrayData из строки Input


| #   | Шаг                                                                             | Файлы                | Легасi              | Статус |
| --- | ------------------------------------------------------------------------------- | -------------------- | ------------------- | ------ |
| 6.1 | `InputView`: bind `[data-rowBtn="data"]`                                        | `InputView.js`       | `$data.on('click')` | [x]    |
| 6.2 | `InputController.openArrayDataForRow(number)` — тот же sessionContext, что §3.2 | `InputController.js` | `openModal(id)`     | [x]    |
| 6.3 | `arrayDataPopUpController.open(sessionContext)`                                 | `InputController.js` | —                   | [x]    |


---

### 7. Согласование с Input (колбеки)


| #   | Шаг                                                                                                    | Файлы                | Статус |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------- | ------ |
| 7.1 | `applyExcelToRow(data)`: patch полей Excel + сброс distribution; `rerender: true`                      | `InputController.js` | [x]    |
| 7.2 | ArrayData: после apply — `checkIndicator(number)` (легасi); **или** отложить — зафиксировать в журнале | `InputController.js` | [x]    |
| 7.3 | `setShowDialog` / `setWaiter` проброс в upload + arrayData controller                                  | `InputController.js` | [x]    |
| 7.4 | Сверка `getData().input[]` → `StressService.buildStressModulePayload` (ExcelGUID/Type/Name)            | `StressService.js`   | [x]    |
| 7.5 | `**StressController` не знает** о Upload/ArrayData                                                     | —                    | [x]    |
| 7.6 | Обновить `**input.md`**: снять «без handler» для `loadingFile` / `data`; границы п.19                  | `input.md`           | [x]    |
| 7.7 | Синхронизировать документацию: `checkIndicator` после save analytics **реализован** — `analytics-analysis-popups.md`, `input.md` §п.18 | `*.md` | [x]    |


---

### 8. fileRemove + DeleteExcelDataSet (связанная часть п.19)


| #   | Шаг                                                                      | Файлы                       | Легасi                             | Статус |
| --- | ------------------------------------------------------------------------ | --------------------------- | ---------------------------------- | ------ |
| 8.1 | После confirm в `onFileRemove`: `deleteExcelDataSet({ ExcelGUID })`      | `InputService` / controller | `index.removeFile`                 | [x]    |
| 8.2 | Успех → `buildExcelClearPatch` + re-render (как сейчас); ошибка → dialog | `InputController.js`        | `handleDeleteExcelDataSetResponse` | [x]    |
| 8.3 | Тексты COULD_NOT_DELETE_FILE / COULD_NOT_GET_DELETE_EXCEL_DATA           | Validator / constants       | constants.js                       | [x]    |


*Если заказчик решит оставить локальный сброс без API — §8 пометить `[—]` и оставить текущее поведение п.13 §6.4.*

---

### 9. Завершение п.19


| #   | Шаг                                                                                    | Статус |
| --- | -------------------------------------------------------------------------------------- | ------ |
| 9.1 | Чеклист §0–8 (кроме отложенных: 0.3, 7.7, 9.4)                                         | [x]    |
| 9.2 | Нет `onclick="Reports.Stress.uploadFilePopUp\|arrayDataPopUp.*"` в `StressConf.html` | [x]    |
| 9.3 | `UploadFilePopUpView` / `ArrayDataPopUpView` не импортируют `StressApi` / `InputController` | [x]    |
| 9.4 | Ручная проверка BI — smoke 2026-06-22 | [x] |


**9.1 — сверка (2026-06-19):** §0 `[x]` (кроме 0.3 `[—]`); §1–§6 — все `[x]`; §7 — `[x]` кроме **7.7** (синхронизация docs analytics, вне завершения кода п.19); §8 — все `[x]`.

**9.2 — сверка:** в `js/StressNew/StressConf.html` и корневом `StressConf.html` на `#select_UploadFile_block` / `#select_ArrayData_block` нет `onclick` с `uploadFilePopUp` / `arrayDataPopUp`; fallback `_stripLegacyOnclick` в `*View.bind`.

**9.3 — сверка:** `UploadFilePopUpView` / `ArrayDataPopUpView` — только JSDoc `@param` на controller; API и Fore — в `*Service` / `*Controller`.

---

## checkIndicator — частично в scope


| Сценарий                       | Легасi                         | StressNew (п.19)                             |
| ------------------------------ | ------------------------------ | -------------------------------------------- |
| После **ArrayData** `selected` | `checkIndicator(row, "Input")` | §7.2 — **да**, unless отложено как analytics |
| После **Upload** save          | нет явного check в handleSave  | не вызываем, unless заказчик попросит        |


---

## Вне этого файла

- `SelectDistribution` — п.16; AddListIndicators — п.17; Analytics/Analysis — п.18.
- CustomePopUp / filtering* — отдельно.
- `**validation.md*`* — confirm `fileRemove` уже в п.13; API-тексты Excel — §8.
- `**select-distribution-chart.md**` — ссылка на п.19 уже есть.

---

## Проверка на BI

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик).

- [x] Input: `loadingFile` → модалка, drag-drop, scalar/matrix, имя, upload → строка зелёная/жёлтая, fileInfo tooltip
- [x] Input: `data` → список наборов, выбор → те же поля Excel на строке
- [x] ExcelType=2: Distribution скрыт, HistoricalRange скрыт
- [x] ExcelType=1: Distribution виден, HistoricalRange скрыт
- [x] `fileRemove` + confirm → сброс Excel (и API при §8)
- [ ] Save/run payload содержит ExcelGUID/Type/Name — формальная сверка на сервере (`REFACTORING_REMAINING.md` §2.4)
- [ ] Ошибки PutBin / SaveExcelDataSet / GetExcelDataSets — dialog (негативные сценарии не прогонялись)

---

## Журнал выполнения


| Дата       | Подпункт | Комментарий                                                                                                                                                              |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-17 | —        | Создан план `upload-array-data-popups.md` (п.19)                                                                                                                         |
| 2026-06-17 | 0.1–0.2  | ES-модули Upload/ArrayData; явные конструкторы; wiring в `InputController` (`_create*`, `setPutBinConfig`, колбеки-заглушки)                                             |
| 2026-06-17 | 0.4      | `InputService.buildExcelRequestPayload`: prognozVersion, forecastData, historical dates, analytics; `extras` — ExcelType/ID/Name/GUID, `includeIterationCounts` для Save |
| 2026-06-17 | 0.5      | `StressController.setPutBinConfig(config)` + вызов из `StressApp.run`; проброс в `UploadFilePopUpController.getPutBinConfig`                                             |
| 2026-06-17 | 0.6      | Раздел «UploadFilePopUp + ArrayDataPopUp (п.19)» в `stressnew.mdc`; обновлён блок InputComponent                                                                         |
| 2026-06-18 | 1.1      | `UploadFilePopUpView.bind`: кэш DOM формы, `[data-btn="copy"]` → `handleSend`, снятие legacy onclick с кнопки                                                            |
| 2026-06-18 | 1.2      | Drag-drop / click zone / file change; `removeFile()` UI; `getSelectedFile()`                                                                                             |
| 2026-06-18 | 1.3      | `openModal` / `closeModal`: Hidden, scroll top, сброс формы; крестик → `controller.closeModal`; `sessionContext = null` в controller                                     |
| 2026-06-18 | 1.4      | Pre-select `[name="parameterTypeFile"]` по `sessionContext.excelType` (default 1); `_resolveExcelType` в controller                                                      |
| 2026-06-18 | 1.5      | `showSendValidationErrors` / `clearSendValidationErrors`; guard в `handleSend` (else-branch легасi `send`)                                                               |
| 2026-06-18 | 1.6      | Удалены `onclick` uploadFilePopUp в `StressConf.html`; `_stripLegacyOnclick` по всей модалке                                                                             |
| 2026-06-18 | 1.7      | `uploadFilePopUpController.view.bind` в `InputController._bindPopUpViewsOnce`                                                                                            |
| 2026-06-18 | 2.1      | `open(sessionContext)`: guard по `rowNumber`, нормализация `excelType` в контексте, `view.openModal(excelType)`                                                          |
| 2026-06-18 | 2.2      | `handleSend`: `validateBeforeSend` → inline errors / disable «Отправить» → waiter `sendSaveExcel` → `_performSendUpload` (§2.3+)                                         |
| 2026-06-18 | 2.3      | `uploadFileToBin`: fetch PutBin, parse `ExcelID`; wiring в `_performSendUpload`, `_buildPutBinFormData`                                                                  |
| 2026-06-18 | 2.3 fix  | PutBin перенесён в `StressApi.putBin`; `UploadFilePopUpService` — только `apiClient`, без import `Dims`                                                                  |
| 2026-06-18 | 2.4      | `saveExcelDataSet` → `StressApi`; parse `ExcelGUID`; wiring в `_performSendUpload`, `buildExcelRequestPayload` в constructor                                             |
| 2026-06-18 | 2.5      | `_applySuccessfulUpload`: payload по контракту §onApply → `onApply` → `closeModal` (легасi `handleSaveExcelDataSetResponse`)                                             |
| 2026-06-18 | 2.6      | `_runSendUpload` catch (PutBin/network) + `_handleSaveExcelError` (fault/moduleError); `COULD_NOT_SAVE_EXCEL_DATA` в Validator; `closeModal` как в легасi                |
| 2026-06-18 | 3.1      | `InputView`: bind `[data-rowBtn="loadingFile"]` → `openUploadFileForRow(number)`                                                                                        |
| 2026-06-18 | 3.2      | `openUploadFileForRow`, `_resolveUploadFileSessionContext`, `_buildUploadFileSessionContext` (rowNumber, indicatorId, analytics, historicalRange*, excelType)             |
| 2026-06-18 | 3.3      | `InputValidator.canOpenUploadFile` (SELECT_INDICATOR); guard в `openUploadFileForRow`                                                                                     |
| 2026-06-18 | 3.4      | `uploadFilePopUpController.open(sessionContext)` в `openUploadFileForRow` — §3 завершён                                                                                   |
| 2026-06-18 | 4.1      | `ArrayDataPopUpView.bind`: `#select_ArrayData_block`, `#ArrayDataSelect`, radio `parameterTypeFileData`, `[data-btn="selected"]`; базовый Select2 + `_bindSelect2DropdownUi` |
| 2026-06-18 | 4.2      | `_arrayDataSelect2Options`, `_formatDatasetState` / `_formatDatasetSelected`, `_matcherDataset`, `_buildDatasetSelect2Data`; language noResults/maximumSelected            |
| 2026-06-18 | 4.3      | `onParameterTypeChange` → `loadDatasetsForType` (store `type`); `_fetchAndRenderDatasets` — заглушка §5.2/5.3                                                               |
| 2026-06-18 | 4.4      | `openModal` / `closeModal`, `clearDropdownValidationErrors`; controller `_resolveExcelType`, сброс `sessionContext` при close                                              |
| 2026-06-18 | 4.5      | Удалены `onclick` arrayDataPopUp в обоих `StressConf.html`; `_bindCloseButton`, `_stripLegacyOnclick` по всей модалке                                                     |
| 2026-06-18 | 4.6      | `arrayDataPopUpController.view.bind` в `InputController._bindPopUpViewsOnce` — §4 завершён                                                                                |
| 2026-06-18 | 5.1      | `open`: `view.openModal(excelType)` + `loadDatasetsForType(excelType)` (легасi pre-select radio + `loadingArrayDataByType` + show)                                        |
| 2026-06-18 | 5.2      | `ArrayDataPopUpService.fetchExcelDataSets`; `_fetchAndRenderDatasets` → `excelDatasets[]`; `buildExcelRequestPayload` в constructor ArrayData + `InputController`         |
| 2026-06-18 | 5.3      | `renderDatasetOptions`: `empty().select2` + `_arrayDataSelect2Options`; вызов из `_fetchAndRenderDatasets`                                                                |
| 2026-06-18 | 5.4      | `handleSelect`: `getSelectedDatasetIndex` + validator → onApply payload → `closeModal` (легасi `selected`; inline error — §5.5)                                          |
| 2026-06-18 | 5.5      | `showEmptySelectionError` + `FIELD_REQUIRED` в Validator; вызов из `handleSelect` при пустом select                                                                       |
| 2026-06-19 | 5.6      | `_handleGetExcelDataSetsError` + `_showErrorDialog`; `COULD_NOT_GET_EXCEL_DATA` в Validator; catch сети в `_fetchAndRenderDatasets`; модалка при ошибке не закрывается (легасi) |
| 2026-06-19 | 6.1      | `InputView`: bind `[data-rowBtn="data"]` → `openArrayDataForRow(number)` (легасi `$data.on('click')`)                                                                      |
| 2026-06-19 | 6.2      | `openArrayDataForRow`, `_resolveArrayDataSessionContext`, `_buildArrayDataSessionContext` → `_buildUploadFileSessionContext`; open — §6.3                                    |
| 2026-06-19 | 6.3      | `arrayDataPopUpController.open(sessionContext)` в `openArrayDataForRow` — §6 завершён; без guard (паритет легасi)                                                          |
| 2026-06-19 | 7.1      | `applyExcelToRow`: patch ExcelGUID/Type/Name + сброс distributionId/Name/Params; `_onUploadFileApply` / `_onArrayDataApply` → re-render (п.13 §3.7)                          |
| 2026-06-19 | 7.2      | `_onArrayDataApply`: после `applyExcelToRow` → `checkIndicator(number)` (легасi `selected`); Upload — без check (как handleSave)                                              |
| 2026-06-19 | 7.3      | Проброс `setShowDialog` / `setWaiter` в upload + arrayData (уже в `InputController`); `ArrayDataPopUpController._withWaiter('GetExcelDataSets')` при загрузке списка          |
| 2026-06-19 | 7.4      | Сверка `getData().input[]` → `buildStressModulePayload`: `_appendExcelFieldsIfPresent` — паритет легасi `getStressParams` (~178–182); цепочка `applyExcelToRow` → save/run   |
| 2026-06-19 | 7.5      | Сверка архитектуры: `StressController` без import `ScenarioNodes/*`; Upload/ArrayData только в `InputController`; `setPutBinConfig` — проброс в Input; JSDoc в `StressController` |
| 2026-06-19 | 7.6      | `input.md`: §п.19, границы, §6.5, карта легасi, §4.6, BI — `loadingFile` / `data` с handler (не «без bind»)                                                                  |
| 2026-06-19 | 8.1      | `InputService.deleteExcelDataSet` + `_parseDeleteExcelDataSetResponse`; `onFileRemove` → `_requestDeleteExcelDataSet` после confirm (легасi `removeFile`)                    |
| 2026-06-19 | 8.2      | `_handleDeleteExcelDataSetResponse`: ok → `removeExcelFromRow`; fault / catch → `COULD_NOT_GET_DELETE_EXCEL_DATA`; moduleError → `COULD_NOT_DELETE_FILE`                     |
| 2026-06-19 | 8.3      | `InputValidator.COULD_NOT_GET_DELETE_EXCEL_DATA` / `COULD_NOT_DELETE_FILE` (легасi `constants.js`)                                                                          |
| 2026-06-19 | 9.1      | Чеклист §0–8: все `[x]`, кроме отложенного 0.3; 7.7 закрыт 2026-06-24 |
| 2026-06-19 | 9.2      | Сверка `StressConf.html` (StressNew + корень): нет `Reports.Stress.uploadFilePopUp\|arrayDataPopUp.*` onclick                                                               |
| 2026-06-19 | 9.3      | `UploadFilePopUpView` / `ArrayDataPopUpView`: без import `StressApi` / `InputController`                                                                                    |
| 2026-06-24 | 7.7      | Docs: `checkIndicator` после analytics — реализовано; обновлены `analytics-analysis-popups.md`, `input.md` |
| 2026-06-22 | 9.4      | Smoke BI: Upload/ArrayData — OK, критических багов нет; payload run/save и негативные API — не проверялись |


