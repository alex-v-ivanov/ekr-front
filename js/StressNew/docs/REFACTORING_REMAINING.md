# StressNew — что осталось до полного рефакторинга

**Назначение:** единая карта незавершённой работы по модулю `js/StressNew/`.  
**Связанные документы:**

| Документ | Роль |
|----------|------|
| [CODEBASE_HARDENING.md](./CODEBASE_HARDENING.md) | Чистка кода, стиль, комментарии, мёртвые заглушки |
| Планы по блокам (`ParamsComponent/params.md`, `InputComponent/input.md`, …) | Детальные чеклисты переноса (история + BI-сценарии) |
| [ARCHITECTURE_LAYERS.md](./ARCHITECTURE_LAYERS.md) | Целевая архитектура |
| [16-stress-controller-contracts.md](./16-stress-controller-contracts.md) | Контракты координатора |

**Как читать статусы:**

| Статус | Смысл |
|--------|--------|
| **Код ✓ / BI ?** | Реализовано в репозитории, **не проверено** на рабочем сервере |
| **Код [ ]** | Подпункт плана не закрыт в коде или не сверен |
| **Отложено** | Осознанное решение заказчика; не блокирует «закрытие» текущей фазы |
| **Вне scope** | Отдельная будущая задача, в легаси есть, в StressNew не начинали |

---

## Сводка (2026-06-25, сверка с кодом)

**Перенос функциональности из `js/Stress/` в `js/StressNew/` — по сути закрыт (~98%).** Все пользовательские сценарии (Params, Input, Output, семь ScenarioNodes, run/save, validation, фильтры C.3, confirm RunTest C.2) реализованы в коде и прошли BI smoke. Этап **C** (C.1–C.3) завершён.

Оставшееся до «полного рефакторинга» — **не недостающие экраны**, а верификация, HTML-чистка и продуктовый hardening (см. метрики ниже).

**2026-06-22 — smoke на BI (заказчик):** Params, Input, Output, SelectDistribution, Upload/ArrayData, Analytics/Analysis, AddListIndicators — **критических регрессий не выявлено**. Фильтры списков (`filtering*`) — **✓** C.3 / `filter-popup.md` (BI 2026-06-24).

**2026-06-25 — C.1 docs:** `recheckAllIndicators` при смене `versionId` — код уже был в Input/Output; документация синхронизирована (`params.md` §6.2 и связанные планы).

**2026-06-25 — C.2:** `stressIdPopUp` — двухшаговый confirm перед RunTest в `StressView` / `StressController.runTest` (без двойного клика «Да»). В **корневом** `StressConf.html` ещё остаются 3 `onclick="Reports.Stress.stressIdPopUp.*"` — см. §6.

**2026-06-23 — RunTest на BI:** `sendTest` / `startModelRisk` — **✓** (подбор, Upload scalar/matrix, ArrayData; см. §1.3).

**2026-06-24 — Save на BI:** `saveTestState` — **✓** (distribution + Excel + analytics; reload / смена версии; §1.4). Смешанный run (matrix + scalar + подбор) — **✓** после фикса `indicatorType` (§1.3).

**Главный фокус завершающей фазы:**

1. **Сверка payload** — формальное закрытие `getData()` → `StressService.buildStressModulePayload` по блокам (§2, **B.1**).
2. ~~**Validation run/save** — §7.2, §7.6 (`validation.md`).~~ **✓** 2026-06-24 (BI + docs §7.5, §7.7, B.3).
3. ~~**Функциональные пробелы этапа C**~~ — **✓** C.1–C.3 (2026-06-24–25).
4. **Приведение к «продуктовому» виду** — [CODEBASE_HARDENING.md](./CODEBASE_HARDENING.md) (§7).

### Метрики (не смешивать «перенос» и «завершение рефакторинга»)

| Метрика | Оценка | Что входит |
|---------|--------|------------|
| **Перенос функциональности** | **~98%** | Легаси-фичи → StressNew: блоки, ScenarioNodes, run/save, validation, фильтры, analytics при select |
| **Верификация** | **~55%** | Формальный diff JSON payload (B.1); негативные сценарии API (§1.2) |
| **Проверка на BI** | **~95%** | Smoke run/save/validation ✓; формальная сверка payload и fault-пути — открыты |
| **Продуктовая готовность** | **~5%** | CODEBASE_HARDENING, docs, синхронизация корневого `StressConf.html` |

```text
Перенос функциональности   █████████████████████░  ~98%  этап C закрыт
Верификация (payload, API) ████████████░░░░░░░░░░  ~55%  B.1 [ ]
Проверка на BI             █████████████████████░  ~95%
Продуктовая готовность     █░░░░░░░░░░░░░░░░░░░░  ~5%   hardening не начат
```

**~2% переноса:** корневой `StressConf.html` (3 onclick stressId), мёртвые заглушки `open*Popup` (не фичи), намеренно отложенный auto-validate на `onInputChanged`.

---

## 1. Проверка на BI

### 1.0 Статус smoke-прогона (2026-06-22)

| # | Область | BI smoke | Примечание |
|---|---------|----------|------------|
| 1 | **Params** | **✓** | Даты, комбо, смена версии → структура — без критических багов |
| 2 | **Input (база)** | **✓** | CRUD, distribution, даты, recalculate — без критических багов |
| 3 | **Upload + ArrayData** | **✓** | loadingFile, data, Excel UI — без критических багов |
| 4 | **SelectDistribution** | **✓** | Подбор, график, choose — без критических багов |
| 5 | **Analytics / Analysis** | **✓** | Попапы по строке и шапке — без критических багов |
| 6 | **AddListIndicators** | **✓** | Copy списка Input/Output — без критических багов |
| 7 | **Output** | **✓** | CRUD, показатель — без критических багов |
| 8 | **RunTest (`sendTest`)** | **✓** | 2026-06-23: подбор распределения; Upload scalar/matrix; ArrayData |
| 9 | **Save (`saveTestState`)** | **✓** | 2026-06-24: distribution + Excel + analytics; reload / смена версии (§1.4) |
| — | **Фильтры `filtering*`** | **✓** | **C.3** FilterPopUp — BI smoke **✓** 2026-06-24 (`filter-popup.md` §6.5) |

Детальные чеклисты в планах блоков отмечены `[x]` где пройден smoke; сценарии ошибок API и формальная сверка payload — отдельно (§2).

### 1.1 Рекомендуемый порядок (остаток)

| # | Область | План | Что осталось |
|---|---------|------|--------------|
| 1 | **Run/Save (validation)** | `validation.md` §7.2, §7.6 | **✓** 2026-06-24 (BI + docs) |
| 2 | **Payload на сервере** | §2 ниже | Формальное сравнение JSON с легасi `getStressParams` |
| 3 | **Негативные сценарии** | планы блоков | Ошибки PutBin / Excel API / fault — по мере необходимости |

### 1.2 Upload / ArrayData — закрыто smoke (2026-06-22)

П. **9.4** в `upload-array-data-popups.md` — **✓ smoke** (критических багов нет). Открыто:

- [ ] Формальная сверка save/run payload Excel с легасi (§2.4) — run ✓ на BI, diff JSON [ ]
- [ ] Негативные сценарии: fault PutBin / SaveExcelDataSet / GetExcelDataSets / DeleteExcelDataSet → dialog

### 1.3 RunTest — закрыто на BI (2026-06-23)

| Сценарий | Статус |
|----------|--------|
| Input с подбором распределения (SelectDistribution → choose) | **✓** |
| UploadFilePopUp, скаляр (`ExcelType=1`) | **✓** |
| UploadFilePopUp, матрица (`ExcelType=2`) | **✓** |
| ArrayDataPopUp (выбор набора из справочника) | **✓** |
| Смешанный сценарий: matrix + scalar + подбор в одном run | **✓** |

**Исправления в коде** (коммиты `fix RunStressTest with scalar excel*`, `fix inputView`, `fix models modelRisk`):

| Проблема | Решение |
|----------|---------|
| Run падал с «тип не соответствует» для Excel scalar | `coerceInputDistributionForModule` — `distribution` в payload всегда **number**; паритет Excel-полей с легасi; один JSON для CheckFullStructure и startModelRisk |
| После Excel оставались имя / params / иконка старого распределения | `applyExcelToRow`: сброс `distributionName`, `distributionParams`, `distributionId: -1`; защита в view |
| Run падал «индекс [-1]» при matrix + scalar + модель (SeasonalGBM) | `indicatorType` из radio попапа подбора → строка Input и payload (`SelectDistributionController` choose) |

### 1.4 Save — закрыто на BI (2026-06-24)

| Сценарий | Статус |
|----------|--------|
| `saveTestState` — Input с distribution + Excel + analytics | **✓** |
| Reload страницы → структура подтягивается | **✓** |
| Смена версии прогноза → загрузка структуры | **✓** |
| Паритет с легасi: Excel, distribution, analytics в сохранённой структуре | **✓** |

---

## 2. Сверка данных и закрытие фаз (код / ревью, без BI)

| # | Задача | План | Файлы | Статус |
|---|--------|------|-------|--------|
| 2.1 | Сверка `getData().params` с save/run | `params.md` **6.3** | `ParamsController`, `StressService` | [ ] |
| 2.2 | Сверка `getData().input[]` с `_mapInputRowToModule` | `input.md` **8.2** | `InputController`, `StressService` | [ ] |
| 2.3 | Сверка `getData().output[]` с `_mapOutputRowToModule` | `output.md` **8.2** | `OutputController`, `StressService` | [ ] |
| 2.4 | Excel в payload (`_appendExcelFieldsIfPresent`, `coerceInputDistributionForModule`) | `upload-array-data-popups.md` **7.4** | `StressService.js` | run на BI **✓** 2026-06-23; формальная сверка с легасi [ ] |
| 2.5 | AddList после copy → payload | `add-list-indicators.md` **5.4** | код ✓ / run на BI [ ] |
| 2.6 | Analytics в payload (`-1` дефолты) | `analytics-analysis-popups.md` | `InputService`, `StressService` | код ✓ / run на BI [ ] |

**Как делать:** для каждого блока — один эталонный сценарий, `getData()` → `buildStressModulePayload`, сравнение с тем, что уходило в легаси `getStressParams` (read-only `js/Stress/index.js`).

---

## 3. Validation (п.15) — статус

План: `validation.md`. §0–§7 **закрыты** (BI ✓ 2026-06-24). Открытых подпунктов кода нет.

| # | Шаг | Суть | Статус |
|---|-----|------|--------|
| 3.1 | **7.2** | Приёмка run: пустой Output, пустой период, дубли Input → блокировка + диалог | **✓** 2026-06-24 |
| 3.2 | **7.4** | Save строки Input: неверные probabilities → не переход в view | **✓** 2026-06-24 |
| 3.3 | **7.5** | Обновить `input.md` / `output.md` / `params.md` — снять «п.15 отложено» | **✓** 2026-06-24 |
| 3.4 | **7.6** | Ручная проверка validation на BI | **✓** 2026-06-24 |
| 3.5 | **1.x** | `PROGNOSIS_VERSION_REQUIRED` (val в Select2, data пустой) | **✓** 2026-06-24 |

---

## 4. Завершение фаз по блокам (чеклисты «7.x / 8.x»)

| Блок | Родительский пункт | Код §0–N | Закрытие фазы | BI smoke |
|------|-------------------|----------|---------------|----------|
| **Params** | п.12 | §0–§6 в основном [x] | **7.1** **✓**, **6.3** [ ] | **7.2** **✓** 2026-06-22; validation **✓** 2026-06-24 |
| **Input** | п.13 | §0–§7 [x] | **8.1** [x], **8.2–8.3** [ ] | **8.4** **✓** 2026-06-22 |
| **Output** | п.14 | §0–§7 в scope [x] | **8.1** **✓**, **8.2–8.3** [ ] | **8.4** **✓** 2026-06-22; validation **✓** 2026-06-24 |
| **Validation** | п.15 | §0–§6 [x] | **7.2–7.6** **✓** 2026-06-24 | **7.6** **✓** run/save |
| **SelectDistribution** | п.16 | §0–§8.3 [x] | **8.1–8.3** [x] | **8.4** **✓** 2026-06-22 |
| **AddListIndicators** | п.17 | §0–§6.3 [x] | **6.1–6.3** [x] | **6.4** **✓** 2026-06-22 |
| **Analytics / Analysis** | п.18 | §0–§7.2 [x] | **7.3** **✓** 2026-06-22 | см. §1.0 |
| **Upload / ArrayData** | п.19 | §0–§9.3 [x] | **9.1–9.3** [x] | **9.4** **✓** 2026-06-22 |
| **FilterPopUp** | C.3 | §0–§6 [x] | **6.1–6.3**, **6.5** [x] | **6.5** **✓** 2026-06-24 |

---

## 5. Не перенос, а хвосты / отложенное (не блокируют ~98% функциональности)

### 5.1 Мёртвый код (удалён в §1.1–1.2)

| Символ | Было | Замена |
|--------|------|--------|
| `openEditPopup` / `openUploadPopup` / `openDistributionPopup` | Input/Output | `onEditRow`, `openUploadFileForRow`, `openSelectDistributionForRow`, … |
| `OutputController.recalculate()` | no-op | Удалён; `setParams` → `recheckAllIndicators` при смене versionId |
| `FilterPopUpValidator` | заглушка | Удалён (§1.1b) |

### 5.2 Осознанно отложено / паритет с легаси

| Функция | Статус |
|---------|--------|
| **`onInputChanged` / `onOutputChanged` → auto-validate** | **Отложено** по решению заказчика (`input.md` 7.2, `output.md` 7.2) |
| **`checkIndicator` после applyDistribution** | **Не вызывается** ни в легаси, ни в StressNew (`select-distribution-chart.md`); отдельный подпункт только при явном запросе |
| **Confirm перед заменой списка AddList** | Вне scope (`add-list-indicators.md`) |
| **Негативные сценарии API** (PutBin fault, Excel API fault → dialog) | Не систематизированы — §1.2 |

### 5.3 Реализовано в коде, но устарело в block-планах (синхронизировать)

| Функция | Код | Устаревшие docs |
|---------|-----|-----------------|
| **`loadingAnalysts` при select показателя** | `InputController.onIndicatorSelect` / `OutputController.onIndicatorSelect` → `resolveRowAnalytics` | `output.md` §4.3, `analytics-analysis-popups.md` §«loadingAnalysts» |
| **`PROGNOSIS_VERSION_REQUIRED`** (val без data) | `ParamsView.getValidationSnapshot` + `ParamsValidator._validateFromSnapshot` | `validation.md` §1.x «отложено», `16-stress-controller-contracts.md` |

### 5.4 Синхронизация docs — закрыто (2026-06-24–25)

| Было в docs | Обновлено |
|-------------|-----------|
| `applyAnalytics` → `checkIndicator` «отложено» | **`analytics-analysis-popups.md`**, **`input.md`** §п.18 — реализовано |
| `recheckAllIndicators` / `params.md` §6.2 «отложено» | **✓** 2026-06-25 — C.1 закрыт в коде; обновлены `params.md`, `input.md`, `output.md`, `validation.md`, `filter-popup.md`, `select-distribution-chart.md` |
| `upload-array-data-popups.md` §7.7 [ ] | **✓** 2026-06-24 |
| «п.15 отложено» в block-планах | **`params.md`**, **`input.md`**, **`output.md`** — §7.5 |

Задача **7.7** + **B.3** (params **7.1**, output **8.1**) — **✓**.

---

## 6. HTML и legacy onclick

| Место | `js/StressNew/StressConf.html` | Корневой `StressConf.html` (страница отчёта) |
|-------|--------------------------------|-----------------------------------------------|
| `#select_StressId` | **✓** без onclick — `StressView._bindStressIdModal` | **3×** `onclick="Reports.Stress.stressIdPopUp.*"` — мёртвый HTML (`Reports.Stress` не существует); JS C.2 работает через bind |
| Input/Output шапка | `data-stress-action`; комментарии legacy onclick | То же |
| Модалки ScenarioNodes | **✓** без `Reports.Stress.*` onclick | **✓** |

**Действие:** синхронизировать корневой `StressConf.html` с `js/StressNew/StressConf.html` (stressId modal) — задача hardening **§2.4** / отдельная итерация.

---

## 7. Приведение кода к целевому виду (параллельный трек)

Не блокирует BI, но нужно для «полноценного рефакторинга» как продукта для новых разработчиков:

→ **[CODEBASE_HARDENING.md](./CODEBASE_HARDENING.md)** — фазы 1–6:

- удалить `openUploadPopup` / `openEditPopup` и т.п.;
- убрать ~224 отсылок к «п.N / §» и ~350+ к «легасi» из `.js`;
- унифицировать обработку ошибок API;
- обновить `ARCHITECTURE_LAYERS.md` (убрать устаревший `Chart/`), `16-stress-controller-contracts.md`, создать `DEVELOPMENT_RULES.md`.

---

## 8. Документация инфраструктуры

| # | Задача | Статус |
|---|--------|--------|
| 8.1 | `PLAN_CHECKLIST.md` — упоминается в contracts, **файла нет** | [ ] |
| 8.2 | `DEVELOPMENT_RULES.md` — упоминается в `stressnew.mdc`, **файла нет** | [ ] |
| 8.3 | Пометить завершённые планы (`upload-array-data-popups.md`, …) как **«архив переноса»** | [ ] |
| 8.4 | Актуализировать «Текущий статус» в `input.md`, `output.md`, `params.md` | **✓** 2026-06-24 (§7.5) |
| 8.5 | Ссылка на этот файл + `CODEBASE_HARDENING.md` в `stressnew.mdc` | [ ] |

---

## 9. Рекомендуемая дорожная карта

```text
Этап A — BI
  A.1–A.4 UI / попапы / блоки          ✓ smoke 2026-06-22 (§1.0)
  A.5 RunTest на BI                     ✓ 2026-06-23 (§1.0, §1.3)
  A.5b Save на BI                       ✓ 2026-06-24 (§1.4)
  A.6 Багфиксы run/Excel/modelRisk      ✓ 2026-06-23–24 (журнал)

Этап B — закрытие фаз (ревью payload, параллельно A.5)
  B.2 validation 7.2, 7.4, 7.5, 7.6, 7.7, B.3     ✓ 2026-06-24
  B.1 params 6.3, input 8.2, output 8.2           ← следующий шаг

Этап C — функциональные пробелы (по приоритету заказчика)
  C.1 recheckAllIndicators при смене versionId      ✓ 2026-06-25 (docs sync; код уже был реализован)
  C.2 stressIdPopUp / RunTest confirm                 ✓ 2026-06-25 (StressView + StressController)
  C.3 CustomePopUp / filtering*                    ✓ 2026-06-24 (filter-popup.md)

Этап D — hardening + docs (мелкими итерациями)
  D.0 синхронизация корневого StressConf.html (stressId onclick)
  D.1 CODEBASE_HARDENING фазы 1–2 (мёртвые заглушки, FilterPopUpValidator)
  D.2 docs: output.md §4.3, analytics §loadingAnalysts, validation §1.x — **✓** 2026-06-25
  D.3 комментарии по компонентам (фаза 4)
```

**Следующая итерация по плану:** **B.1** (формальная сверка payload с легасi).

---

## 10. Быстрый указатель «где смотреть детали»

| Тема | Файл |
|------|------|
| Upload / ArrayData | `ScenarioNodes/upload-array-data-popups.md` |
| Input строки | `InputComponent/input.md` |
| Output | `OutputComponent/output.md` |
| Params UI | `ParamsComponent/params.md` |
| Run / save / сообщения | `validation.md` |
| Подбор распределения | `ScenarioNodes/select-distribution-chart.md` |
| Analytics | `ScenarioNodes/analytics-analysis-popups.md` |
| Copy списка | `ScenarioNodes/add-list-indicators.md` |
| Фильтры списка (C.3) | `ScenarioNodes/filter-popup.md` |
| Чистка кода | `docs/CODEBASE_HARDENING.md` |
| API методы | `docs/STRESS_API.md` |

---

## Журнал

| Дата | Событие |
|------|---------|
| 2026-06-19 | Первичный аудит: код ScenarioNodes ~85–90%, BI не пройден, hardening не начат |
| 2026-06-22 | Smoke BI: Params, Input, Output, SelectDistribution, Upload/ArrayData, Analytics/Analysis, AddList — OK; фильтры `filtering*` не работают (не реализованы); Run/Save не проверялись. Старт завершающей фазы по §9 |
| 2026-06-23 | RunTest на BI: подбор, Upload scalar/matrix, ArrayData — OK. Багфиксы: `distribution` number в payload; сброс UI распределения после Excel |
| 2026-06-24 | Save на BI: saveTestState + reload/смена версии — OK. Run смешанный (matrix+scalar+модель) — OK. Фикс `indicatorType` при choose в SelectDistribution |
| 2026-06-24 | Validation BI ✓ (§7.2/§7.4/§7.6): диалог как легасi; `PROGNOSIS_VERSION_REQUIRED`; перенумерация строк при load |
| 2026-06-24 | Docs: §7.5, §7.7, B.3 — `params.md`/`input.md`/`output.md`/`validation.md`/`analytics-analysis-popups.md` |
| 2026-06-24 | **C.3 FilterPopUp** — фильтры `filtering*` перенесены; BI smoke **✓** (заказчик); `filter-popup.md` §6 закрыт |
| 2026-06-25 | **C.1** — `recheckAllIndicators` при смене `versionId`: код уже был в Input/Output; docs синхронизированы (`params.md` §6.2, `input.md`, `output.md`, `validation.md`) |
| 2026-06-25 | **C.2** — `stressIdPopUp`: двухшаговый confirm перед RunTest в `StressView` / `StressController.runTest`; legacy onclick убраны в `js/StressNew/StressConf.html`; в корневом `StressConf.html` — 3 onclick остаются |
| 2026-06-25 | `addNewIndicator`: без API на пустой строке; `status: -1` локально; `checkIndicator` — в `onIndicatorSelect` |
