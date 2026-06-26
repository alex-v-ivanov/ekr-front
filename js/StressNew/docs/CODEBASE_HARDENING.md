# StressNew — план приведения кода к целевому состоянию

**Назначение:** пошаговый аудит и исправление накопившихся артефактов переноса — мёртвый код, расхождения с архитектурой, разный стиль между компонентами, комментарии с отсылками к легаси и номерам планов.

**Область:** только `js/StressNew/`. Папка `js/Stress/` — read-only, не трогаем.

**Эталоны «как должно быть» (читать перед правками):**

| Документ | Зачем |
|----------|--------|
| [ARCHITECTURE_LAYERS.md](./ARCHITECTURE_LAYERS.md) | Слои блоков и ScenarioNodes |
| [16-stress-controller-contracts.md](./16-stress-controller-contracts.md) | Контракты координатора |
| [.cursor/rules/stressnew.mdc](../../.cursor/rules/stressnew.mdc) | Правила агента и разработчиков |
| `ParamsComponent/ParamsController.js` | Образец «чистых» комментариев без планов |

**Планы переноса** (`input.md`, `upload-array-data-popups.md`, …) — **история работ**, не часть runtime-документации. Их номера пунктов **не должны** оставаться в `.js` после завершения фичи.

---

## Принцип работы

1. **Один подпункт за итерацию** — как при переносе; после каждого шага — быстрая проверка на странице отчёта (где применимо).
2. **Поведение и UI не меняем** — только структура, имена, комментарии, удаление мёртвого кода.
3. **Не плодить «защиту на всё»** — см. `stressnew.mdc`; устойчивость к пустой странице — отдельная задача, если заказчик попросит.
4. Отмечать прогресс в таблицах: `[x]` / `[ ]` / `[—]` (вне scope).

---

## Зафиксированные решения заказчика

| Дата | Вопрос | Решение |
|------|--------|---------|
| 2026-06-25 | `OutputController.recalculate()` | **Мёртвый код** — как `open*Popup` и `FilterPopUpValidator`. No-op «для симметрии с Input» не несёт поведения: в легаси для Output пересчёта дат не было, в модели Output нет historical/valid range. **Удалить** метод и вызов `await this.recalculate()` из `OutputController.setParams`. При смене `versionId` **оставить** только `recheckAllIndicators()` (реальная логика). |
| 2026-06-25 | `checkIndicator` после `applyDistribution` | **Не делать** — в легасi после подбора распределения вызова не было; паритет сохраняем. |
| 2026-06-25 | `checkIndicator` при `addNewIndicator` | **Не вызывать** API на пустой строке. Локально `status: -1` → красный сразу; первый `CheckSingleStructure` — в `onIndicatorSelect` (Input/Output). **✓** в коде |
| 2026-06-25 | Синхронизация `StressConf.html` | Эталон — `js/StressNew/StressConf.html`; корневой файл — копия эталона. **✓** выполнено. |

**Принцип:** симметрия сигнатур Input/Output **не оправдывает** пустые методы и no-op. Если у блока нет соответствующей доменной логики — метода в API контроллера быть не должно.

---

## Целевое состояние (кратко)

### Слои

```text
StressApp → StressController → Params / Input / Output (Controller → Service → View)
                                    ↓
                              ScenarioNodes (только из Input/Output Controller)
```

| Слой | Может | Не может |
|------|-------|----------|
| **View** | DOM, jQuery/Select2/ECharts, события → controller | `StressApi`, Fore, guards, сборка payload save/run |
| **Controller** | Состояние UI-сессии, оркестрация, колбеки | Прямые `$()` (кроме редких исключений — сверять с эталоном блока) |
| **Service** | `StressApi`, fetch PutBin, парсинг ответов | DOM |
| **Validator** | Правила + тексты ошибок/guard | API, DOM |

### Конструкторы

- Явные позиционные аргументы, **не** `constructor(options)`.
- `*Service` создаётся **inline** в родительском controller: `new XxxService(apiClient)`.
- **`StressController` не импортирует `ScenarioNodes/*`.**

### Комментарии и JSDoc

**Пишем для разработчика, который не участвовал в переносе.**

| Плохо | Хорошо |
|-------|--------|
| `// п.19 §8.2; легасi handleDeleteExcelDataSetResponse` | `// Ответ DeleteExcelDataSet: при успехе сбрасываем Excel на строке, иначе — dialog` |
| `/** Legacy: UploadFilePopUp in stress-popups.js */` | `/** Модалка загрузки Excel для строки Input */` |
| `/** Легаси StressValidationMessages.COULD_NOT_DELETE_FILE */` | `/** Сообщение при ошибке удаления файла на сервере */` |
| `@param row — п.13 §3.7` | `@param row — строка Input с полями ExcelGUID, ExcelType, …` |

**Допустимо оставить:**

- ссылку на **имя метода API** (`SaveExcelDataSet`, `DeleteExcelDataSet`);
- `@typedef` с перечислением полей контракта;
- `/* global $ */` где нужен jQuery.

**Убрать из production-кода:**

- номера планов (`п.16`, `§8.2`, `T4`, `п.19`);
- пути к легаси-файлам (`stress-popups.js ~190`, `index.js removeFile`);
- «легасi / Legacy / как в легаси» в каждом методе;
- журналы выполнения внутри `.js`.

---

## Фаза 0. Инвентаризация (без правок кода)

| # | Шаг | Как проверить | Статус |
|---|-----|---------------|--------|
| 0.1 | Список всех `.js` в `StressNew/` | 49 файлов | [x] |
| 0.2 | Поиск отсылок к планам в коде | ~224 совпадения | [x] |
| 0.3 | Поиск отсылок к легаси в комментариях | ~350+ совпадений | [x] |
| 0.4 | Поиск пустых методов / заглушек | 5× `open*Popup` + `OutputController.recalculate` (no-op) | [x] |
| 0.5 | Поиск `constructor(options)` | 0 | [x] |
| 0.6 | View импортирует API/controller? | 0 | [x] |
| 0.7 | Legacy onclick в HTML | Оба `StressConf.html`: 0 активных `onclick="Reports.Stress.*"` (корень синхронизирован с StressNew, 2026-06-25) | [x] |

Зафиксировать baseline (количество совпадений) в журнале в конце этого файла.

---

## Фаза 1. Мёртвый код и заглушки

### 1.1 Известный мёртвый код (проверить и удалить, если нет вызовов)

| Место | Что | Замена / примечание |
|-------|-----|---------------------|
| `InputController` | `openEditPopup`, `openDistributionPopup`, `openUploadPopup` — пустые тела | Реальные entry points: `openSelectDistributionForRow`, `openUploadFileForRow`, `openArrayDataForRow`, … |
| `OutputController` | `openEditPopup`, `openUploadPopup` — пустые | Output не имеет Excel; analytics — `openAnalyticsForRow` |
| `OutputController.recalculate()` | no-op «для симметрии с Input» | **Удалить** метод + `await this.recalculate()` в `setParams` — см. §«Зафиксированные решения» |
| `FilterPopUpValidator` | `validatePopupItems` всегда `{ isValid: true }`; в `FilterPopUpController` вызывается с `void validation` | Удалить класс, поле `this.validator` и вызовы — **filter-popup.md** §6.4 |
| `InputController.openUploadPopup` | дублирует смысл `openUploadFileForRow` | Удалить заглушку |

**Проверка перед удалением:**

```text
rg "openUploadPopup|openEditPopup|openDistributionPopup" js/StressNew --glob '*.js'
rg "outputController\.recalculate|OutputController.*recalculate" js/StressNew --glob '*.js'
```

Вызовов снаружи `OutputController` быть не должно (кроме docs).

**Целевой `OutputController.setParams` после §1.2:**

```text
setParams(params)
  → this.params = params
  → если сменился versionId → recheckAllIndicators()
  (без recalculate)
```

| # | Шаг | Файлы | Статус |
|---|-----|-------|--------|
| 1.1 | Удалить неиспользуемые заглушки Input (`openEditPopup`, `openDistributionPopup`, `openUploadPopup`) | `InputController.js` | [x] |
| 1.1b | Удалить `FilterPopUpValidator` + вызовы в `FilterPopUpController` | `FilterPopUpValidator.js`, `FilterPopUpController.js` | [x] |
| 1.2 | Удалить заглушки Output: `openEditPopup`, `openUploadPopup`, **`recalculate()`** и вызов из `setParams` | `OutputController.js` | [x] |
| 1.3 | Обновить контракты и block-планы: убрать заглушки, no-op `recalculate` | `16-stress-controller-contracts.md`, `output.md`, `validation.md` §2.5 | [x] |

### 1.2 Поиск прочего мёртвого кода

| # | Шаг | Что искать | Статус |
|---|-----|------------|--------|
| 1.5 | Методы без ссылок | `rg "^\s+\w+\(" …` + ручной grep вызовов для подозрительных public-методов | [ ] |
| 1.6 | Неиспользуемые поля controller | `_getXxx` колбеки, которые никогда не вызываются | [ ] |
| 1.7 | Дублирующие entry points | два метода делают одно (upload popup) | [ ] |
| 1.8 | `_stripLegacyOnclick` | Оставить только пока в HTML возможны старые onclick; когда HTML чист — упростить до no-op или удалить с комментарием «HTML без onclick» | [ ] |

---

## Фаза 2. Архитектура — расхождения с целевой моделью

### 2.1 Координатор и корень

| # | Проверка | Ожидание | Файлы | Статус |
|---|----------|----------|-------|--------|
| 2.1.1 | `StressController` imports | Нет `ScenarioNodes/*` | `StressController.js` | [ ] |
| 2.1.2 | Проброс UI | `setShowDialog`, `setShowConfirmDialog`, `setWaiter`, `setPutBinConfig` → Input (не дублировать в StressController логику попапов) | `StressController.js`, `InputController.js` | [ ] |
| 2.1.3 | `getData()` / `validate()` | Собирает три блока + `StressValidator` | `StressController.js` | [ ] |
| 2.1.4 | Устаревшие ссылки в docs | `ARCHITECTURE_LAYERS.md` упоминает `Chart/` как отдельную папку — **график в `SelectDistributionView`** | `ARCHITECTURE_LAYERS.md` | [ ] |
| 2.1.5 | `PLAN_CHECKLIST.md` | Упоминается в contracts, файла нет — создать или убрать ссылку | `docs/` | [ ] |
| 2.1.6 | `DEVELOPMENT_RULES.md` | Упоминается в `stressnew.mdc`, файла нет — создать краткий или перенести правила в этот документ | `docs/` | [ ] |

### 2.2 Блоки Params / Input / Output

| # | Проверка | Эталон | Статус |
|---|----------|--------|--------|
| 2.2.1 | Controller не хранит `apiClient` напрямую | API только в `*Service` | [ ] |
| 2.2.2 | `bindView(root)` → `view.bind(scope)` | Все три блока | [ ] |
| 2.2.3 | `setParams` → `recalculate` только где есть доменная логика | Input — `recalculate()` (даты, valid range); Output — **без** `recalculate`, только `recheckAllIndicators` при смене `versionId` (§1.2) | [x] |
| 2.2.4 | `setMessages` → View | Без бизнес-логики в View | [ ] |
| 2.2.5 | Размер InputController | >1500 строк — кандидат на **внутренние** private-группы или вынос orchestration Excel/CheckData в отдельные модули **без** смены публичного API | [ ] |

### 2.3 ScenarioNodes (единый чеклист на папку)

Для **каждой** папки в `ScenarioNodes/`:

`AnalyticsPopUp`, `AnalysisPopUp`, `AddListIndicators`, `SelectDistribution`, `UploadFilePopUp`, `ArrayDataPopUp`, `FilterPopUp`

| # | Проверка | Статус |
|---|----------|--------|
| 2.3.1 | `*View.js` — без import `StressApi`, `InputController`, `StressController` | [ ] |
| 2.3.2 | `*Service.js` — только API/fetch; без `$` | [ ] |
| 2.3.3 | `*Controller.js` — без `$`, без `echarts` (график — в SelectDistribution **View**) | [ ] |
| 2.3.4 | Экземпляр создаётся только в `InputController` или `OutputController` | [ ] |
| 2.3.5 | Конструктор — явные аргументы, service inline у родителя | [ ] |
| 2.3.6 | `view.bind` — в `_bindPopUpViewsOnce` (Input) или аналог (Output) | [ ] |
| 2.3.7 | `setShowDialog` / `setWaiter` — через setter родителя, не глобалы | [ ] |

### 2.4 HTML

| # | Проверка | Статус |
|---|----------|--------|
| 2.4.1 | Оба `StressConf.html` синхронны (копия StressNew → корень) | [x] 2026-06-25 |
| 2.4.2 | Перенесённые блоки без `onclick="Reports.Stress.*"` | [x] оба файла |
| 2.4.3 | Список **ещё не перенесённых** onclick — **✓** stressIdPopUp (C.2); остаток — комментарии legacy в HTML | [x] stressIdPopUp |

---

## Фаза 3. Единый стиль кода

### 3.1 Именование

| Область | Соглашение | Проверить |
|---------|------------|-----------|
| Открытие модалки из строки | `openXxxForRow(number)` | Input/Output |
| Применение данных попапа | `applyXxxToRow` / `_onXxxApply` | Input |
| Приватные хелперы | `_buildSessionContext`, `_handleApiError` | ScenarioNodes |
| Bind один раз | `_bindPopUpViewsOnce` + флаг `_popUpViewsBound` | Input |
| Waiter token | строковый идентификатор операции (`'sendSaveExcel'`, `'GetExcelDataSets'`) | Controllers |

| # | Шаг | Статус |
|---|-----|--------|
| 3.1.1 | Сверить имена open/apply/handle между Upload и ArrayData | [ ] |
| 3.1.2 | Сверить Analytics vs Analysis (Input vs Output) | [ ] |
| 3.1.3 | SelectDistribution: `openSelectDistributionForRow` vs `selectDistributionController.open` | [ ] |

### 3.2 Паттерны обработки ошибок API

**Целевой паттерн (унифицировать):**

```text
Service: parse response → { ok, fault?, moduleError?, message? }
Controller: _handleXxxResponse(result) → success path | _showErrorDialog(constant)
Fallback без setShowDialog: setMessages([{ type: 'error', text }])
```

| # | Компонент | Сейчас | Привести к паттерну | Статус |
|---|-----------|--------|---------------------|--------|
| 3.2.1 | UploadFilePopUpController | есть `_showErrorDialog` | эталон | [ ] |
| 3.2.2 | ArrayDataPopUpController | `_handleGetExcelDataSetsError` | как Upload | [ ] |
| 3.2.3 | InputController (DeleteExcel) | `_showDeleteExcelDataSetError` | общий private `_showDialogOrMessages`? — **только если не раздувает diff** | [ ] |
| 3.2.4 | SelectDistributionController | сверить | [ ] |
| 3.2.5 | AddListIndicatorsController | сверить | [ ] |

### 3.3 Validator — тексты ошибок

| # | Шаг | Статус |
|---|-----|--------|
| 3.3.1 | Убрать «Легаси `StressValidationMessages.X`» из JSDoc — оставить смысл сообщения | все `*Validator.js` | [ ] |
| 3.3.2 | Дубли одного текста в нескольких validator — допустимо; вынос в общий файл **не делаем** (решение заказчика в `validation.md`) | [ ] |
| 3.3.3 | Static constants: `SCREAMING_SNAKE` без префикса «легаси» | [ ] |

### 3.4 View — bind и namespace событий

| # | Шаг | Статус |
|---|-----|--------|
| 3.4.1 | jQuery events с namespace: `.uploadFilePopUpSend`, `.arrayDataPopUpClose` | [ ] |
| 3.4.2 | ` .off` перед `.on` при re-bind | [ ] |
| 3.4.3 | Select2: `_bindSelect2DropdownUi` / `dropdownParent` — один стиль с ParamsView | [ ] |

---

## Фаза 4. Комментарии — по компонентам

**Порядок:** от «эталона» к «шумным» — Params → Output → ScenarioNodes по одному → Input (самый большой).

### 4.1 ParamsComponent

| # | Файл | Действие | Статус |
|---|------|----------|--------|
| 4.1.1 | `ParamsController.js` | Образец; только точечные правки | [ ] |
| 4.1.2 | `ParamsView.js` | Убрать отсылки к `stress-ui.js` | [ ] |
| 4.1.3 | `ParamsService.js` | JSDoc на методы API | [ ] |
| 4.1.4 | `ParamsValidator.js` | Тексты без «легаси» | [ ] |

### 4.2 OutputComponent

| # | Файл | Статус |
|---|------|--------|
| 4.2.1 | `OutputController.js` | [ ] |
| 4.2.2 | `OutputView.js` | [ ] |
| 4.2.3 | `OutputService.js` | [ ] |
| 4.2.4 | `OutputValidator.js` | [ ] |

### 4.3 ScenarioNodes (каждый — отдельная итерация)

| Папка | Controller | View | Service | Validator | Статус |
|-------|------------|------|---------|-----------|--------|
| UploadFilePopUp | [ ] | [ ] | [ ] | [ ] | |
| ArrayDataPopUp | [ ] | [ ] | [ ] | [ ] | |
| SelectDistribution | [ ] | [ ] | [ ] | [ ] | |
| AnalyticsPopUp | [ ] | [ ] | [ ] | [ ] | |
| AnalysisPopUp | [ ] | [ ] | [ ] | [ ] | |
| AddListIndicators | [ ] | [ ] | [ ] | [ ] | |

**Чеклист на файл:**

1. File-level comment: **что делает модуль**, не «перенос из stress-popups.js».
2. Public methods: **зачем** и **контракт** (вход/выход).
3. Private methods: только если логика неочевидна.
4. Удалить «п.18 §2.1», «легасi ~352–364».

### 4.4 InputComponent

| # | Файл | Примечание | Статус |
|---|------|------------|--------|
| 4.4.1 | `InputValidator.js` | ~17 отсылок к легаси | [ ] |
| 4.4.2 | `InputService.js` | ~40 отсылок | [ ] |
| 4.4.3 | `InputView.js` | [ ] |
| 4.4.4 | `InputController.js` | ~116 отсылок; делить на **логические секции** (Excel, CheckData, rows CRUD, popups) | [ ] |

**Рекомендуемые секции в `InputController.js` (без смены API):**

```text
// --- Popups wiring (create, bind, setShowDialog) ---
// --- Row actions (edit, save, remove, fileRemove) ---
// --- Excel (upload, array data, delete) ---
// --- Distribution & historical range ---
// --- Analytics / checkIndicator ---
// --- Data sync (setIndicators, getData, patchIndicator) ---
```

Секции — обычные комментарии-разделители, **не** номера планов.

### 4.5 Корневые модули

| # | Файл | Статус |
|---|------|--------|
| 4.5.1 | `StressController.js` | [ ] |
| 4.5.2 | `StressService.js` | [ ] |
| 4.5.3 | `StressApi.js` | [ ] |
| 4.5.4 | `StressValidator.js` | [ ] |
| 4.5.5 | `StressView.js` | [ ] |
| 4.5.6 | `StressApp.js` | [ ] |

---

## Фаза 5. Документация (синхронизация с кодом)

| # | Шаг | Статус |
|---|-----|--------|
| 5.1 | `ARCHITECTURE_LAYERS.md` — убрать `Chart/` как отдельную папку; актуализировать ScenarioNodes | [ ] |
| 5.2 | `16-stress-controller-contracts.md` — актуальный список ScenarioNodes, Output без заглушек | [x] §1.3 |
| 5.3 | `stressnew.mdc` — добавить ссылку на этот документ; правило про комментарии без планов | [ ] |
| 5.4 | `input.md` / `upload-array-data-popups.md` — **не править** под чистку кода; в шапке пометка «архив плана» | [ ] |
| 5.5 | **7.7** из upload plan: `checkIndicator` после analytics — синхронизировать `analytics-analysis-popups.md`, `input.md` | [ ] |
| 5.6 | Создать `DEVELOPMENT_RULES.md` (имена `setParams`, `bindView`, …) **или** слить в §3 этого файла | [ ] |

---

## Фаза 6. Финальная верификация

| # | Проверка | Команда / действие | Статус |
|---|----------|-------------------|--------|
| 6.1 | Нет `п.N` / `§` в `.js` | `rg "п\.\d+\|§" js/StressNew --glob '*.js'` → 0 | [ ] |
| 6.2 | Нет import StressApi во View | см. фаза 0.6 | [ ] |
| 6.3 | Нет пустых public-методов | ручной обзор | [ ] |
| 6.4 | Smoke на BI | Input: loadingFile, data, fileRemove; Params; save/run | [ ] |
| 6.5 | Diff StressConf.html | корень vs StressNew идентичны | [x] 2026-06-25 |

---

## Рекомендуемый порядок выполнения

```text
0 (инвентаризация)                    ✓
  → 2.4.1 StressConf синхронизация    ✓ 2026-06-25
  → 1.1–1.3 (мёртвый код: open*Popup, FilterPopUpValidator, Output.recalculate)
  → 2.4.3 (комментарии legacy в HTML)
  → 2.3 (ScenarioNodes architecture pass)
  → 4.3 по одной папке (комментарии + мелкий стиль)
  → 4.1, 4.2, 4.5
  → 4.4 Input (последним — самый объёмный)
  → 3.2–3.4 (унификация паттернов по ходу или после 4)
  → 5 (docs)
  → 6 (финал)
```

**Оценка объёма (ориентир):** ~15–25 итераций по одному подпункту; Input и SelectDistribution — самые длинные.

---

## Out of scope (не смешивать с этим планом)

- Рефакторинг `js/Stress/` (легаси).
- Новые фичи (CustomePopUp, filtering*, stressIdPopUp, RunTest confirm).
- Массовые null-checks на каждый DOM-узел.
- Вынос `StressValidationMessages` в общий файл.
- Полное удаление `_stripLegacyOnclick` до гарантии чистого HTML на BI.
- `checkIndicator` после `applyDistribution` — не в легасi, не делаем (решение 2026-06-25).
- Автоматические тесты (если заказчик не закажет отдельно).

---

## Журнал выполнения

| Дата | Шаг | Результат |
|------|-----|-----------|
| 2026-06-19 | — | Документ создан; baseline снят (см. ниже) |
| 2026-06-25 | Аудит vs `REFACTORING_REMAINING.md`: перенос функциональности ~98%; метрики разделены |
| 2026-06-25 | `StressConf.html`: корень = копия `js/StressNew/StressConf.html` (§2.4.1, §6.5) |
| 2026-06-25 | Решение: `OutputController.recalculate()` — мёртвый код, удалить в §1.2; `checkIndicator` после подбора — out of scope |
| 2026-06-25 | **§1.3** | Docs: `16-stress-controller-contracts.md`, `output.md`, `validation.md` §2.5 — без заглушек `open*Popup`, без Output `recalculate` |

### Baseline (2026-06-19)

| Метрика | Значение |
|---------|----------|
| `.js` файлов в StressNew | 49 |
| Совпадений `п.N` / `§` / `T*` в `.js` | ~224 (лидеры: `InputController` 35, `SelectDistributionView` 22, `SelectDistributionController` 22) |
| Совпадений `легас\|legacy\|stress-popups\|stress-input` в `.js` | ~350+ (лидеры: `InputController` 46, `SelectDistributionView` 38, `InputService` 36) |
| Пустых заглушек (`open*Popup`) | 5 методов (Input ×3, Output ×2) |
| `Reports.Stress.*` onclick | **0** активных в обоих `StressConf.html` (синхронизация 2026-06-25) |
| View с import `StressApi` / `*Controller` | 0 |
