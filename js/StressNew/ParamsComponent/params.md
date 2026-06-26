# Блок Params — план UI-паритета и переноса из легаси

Путь кода: `Reports/js/StressNew/ParamsComponent/`  
Легаси (только чтение): **`Reports/js/Stress/stress-ui.js`**, **`Reports/js/Stress/index.js`**. Справочно при переносе UI: **`utils.js`** (`formatState`, `formatSelected`, `formatState3`, `initSelect2Event` и т.д.) — **не импортировать**; копировать в `ParamsView` приватными методами.

**Родительская задача плана:** п.12 — «Блок Params: даты, комбо, реакция на смену, связь с координатором» + **UI-паритет** с легаси (jQuery, Select2, AirDatepicker).

---

## Принцип рефакторинга (обязательный)

**Меняем код и архитектуру, не поведение и не внешний вид страницы.**

| Меняем | Не меняем |
|--------|-----------|
| Слои `ParamsController` / `ParamsService` / `ParamsView`, связь с `StressController` | Разметка HTML отчёта, CSS-классы, селекторы `#DateParamFrom`, `#PrognozVersionCombo` и т.д. |
| Вызовы API через `StressApi` / `ParamsService` вместо `stress.bi` в контроллере | Виджеты: **AirDatepicker** на датах, **Select2** на комбо версии / итераций / симуляций |
| Явное состояние `params` в контроллере | Формат `text: "key#;name"` для Select2, где так в легаси |
| Без глобального объекта `stress` | События `select2:select`, перезагрузка списков, `dropdownParent`, язык `noResults` |

**`ParamsView`** — без прямых вызовов Fore/API; инициализация виджетов и подписки на события → в колбеки контроллера (`onChangeParam` и узкие методы вида «выставить даты извне»). **jQuery / Select2 / AirDatepicker** — как в `stress-ui.js`, не заменять на нативный `<select>` ради упрощения. UI-хелперы из легаси — **только копия в view**, без `import` из `Stress/`.

Критерий готовности подпункта: на той же HTML-странице блок параметров **выглядит и ведёт себя** как в легаси.

### Читаемость кода (решение заказчика)

На этапе переноса **не засорять** `*View` и контроллеры «защитными» проверками на каждый узел DOM (`if (!el) return` в каждом методе, флаги `_bound` и т.п.). Считаем, что **разметка отчёта задана** (как в легаси). Глубокая устойчивость к отсутствию блоков — **отдельная задача**, если заказчик попросит явно.

Подробный общий принцип: **`StressNew/InputComponent/input.md`** (раздел «Принцип рефакторинга»).

---

## Как работать по плану

1. Берём **строго один** подпункт за итерацию (например, только **1.1**, без 1.2–1.5 в том же шаге), реализуем, проверяем на странице отчёта (или сравнение с легаси).
2. В таблице: `[x]` — сделано, `[ ]` — нет.
3. **`ParamsValidator`** — локальные правила и тексты реализованы в **`../validation.md`** §1; расширение — только по новым подпунктам.
4. Тяжёлая загрузка при старте в легаси (`initVersion` в `stress-ui.js`: dims, Input/Output списки) — **не весь объём Params**; см. раздел «Границы» и отдельные пункты координатора.

---

## Текущее состояние StressNew Params (кратко)

| Область | Статус |
|---------|--------|
| `ParamsController` / `ParamsService` | Логика версий, структуры, `patchParams`, колбек — **готово** |
| `ParamsView` | AirDatepicker + Select2 (версия, итерации, симуляции), `setMessages` — **готово** |
| `ParamsValidator` | Локальные правила + тексты; run/save через snapshot виджетов — **`../validation.md`** §1 |
| Закрытие фазы п.12 | §0–§6 **✓** (в т.ч. §6.2 `recheckAllIndicators`), §7.1 **✓**; §6.3 (сверка payload) — **B.1** |
| BI smoke | **✓** 2026-06-22; validation params run/save — **✓** 2026-06-24 |

---

## Границы (что входит / не входит)

| Входит в план Params | Не входит (другие блоки / пункты плана) |
|----------------------|----------------------------------------|
| `#DateParamFrom`, `#DateParamTo`, AirDatepicker, связь с `onChangeParam('startDate'/'endDate')` | Полная копия `initVersion` со всеми `loadingDataFromList` для Input/Output/аналитики — координатор или п.8–11 |
| `#PrognozVersionCombo` Select2, формат `key#;name`, `dropdownParent`, предупреждение «Нет данных» | `recheckAllIndicators` при смене версии — **реализовано** в Input/Output (п. **6.2**), не в Params |
| `#IterationCountCombo` Select2 + Dim | Попапы, сценарные узлы |
| `#SimulationCount` Select2 (1–10, `createTag`, язык) | Полная локальная валидация — **`../validation.md`** §1 |
| Синхронизация выбранных значений ↔ `params` в контроллере | Дублирование всего `Stress` класса из `index.js` |

---

## Карта легаси → StressNew

| Легаси | Назначение | Куда в StressNew |
|--------|------------|------------------|
| `StressUI.initDateParam` | AirDatepicker, view months, связка from→to | `ParamsView` + вызовы `ParamsController` |
| `StressUI.initPrognozVersionCombo` | Select2 на `#PrognozVersionCombo`, `select2:select` | `ParamsView` → `onChangeParam('versionId', …)` (парсинг `key` из `text.split('#;')[0]`) |
| `StressUI.initIterationCountCombo` + `loadingIterationCountData` | Dim + Select2 `formatState3` | `ParamsService` (данные) + `ParamsView` (Select2) |
| `StressUI.initSimulationCount` | Select2, 1–10, tags, язык | `ParamsView` |
| `StressUI.initVersion` / `getVersionsCombo` (фрагменты) | Подстановка дат и комбо после загрузки структуры | Уже близко к `applyParamsFromStructureRaw` + доработать вызовы виджетов |
| `initSelect2Event` | `utils.js` (справочно) | `ParamsView._bindSelect2DropdownUi` — копия, не импорт |
| `formatState`, `formatSelected` (версия прогноза) | `utils.js` (справочно) | `ParamsView._formatForecastVersionState` / `_formatForecastVersionSelected` |
| `formatState3` | `utils.js` (справочно) | итерации/симуляции — методы в `ParamsView` |

---

## План по шагам

### 0. Техническая база

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 0.1 | ES-модули: `export` для `ParamsView`, `ParamsValidator`, `ParamsController`, `ParamsService`; `import` в `ParamsController` (view, validator, service) и в `StressController` при необходимости | `Params*.js`, `StressController.js` | — | [x] |
| 0.2 | Зафиксировать глобали страницы: `$`, `AirDatepicker`, `$.fn.select2` — только во view; контроллер без jQuery | `ParamsView.js` | `stress-ui.js` | [x] |
| 0.3 | ~~Массовые проверки DOM в `bind` / каждом методе view~~ **не делаем** (заказчик: не захламлять код; разметка отчёта как в легаси). Зафиксировано в `stressnew.mdc` и здесь. | `params.md`, `.cursor/rules/stressnew.mdc` | — | [x] |

---

### 1. Даты периода (AirDatepicker)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 1.1 | Создать/хранить экземпляры `AirDatepicker` на `#DateParamFrom` / `#DateParamTo` с опциями как в `initDateParam` (view: months, minView: months, dateFormat) | `ParamsView.js` | `initDateParam` | [x] |
| 1.2 | `onSelect` from: обновить `minDate` у «до», при необходимости clear; вызвать контроллер (аналог `CheckDateParam` + `getVersionsCombo`) | `ParamsView.js`, `ParamsController.js` | ~147–172 | [x] |
| 1.3 | `onSelect` to: вызов контроллера для перезагрузки версий | `ParamsView.js`, `ParamsController.js` | ~164–172 | [x] |
| 1.4 | Метод контроллера/view: выставить даты из `params` / структуры (`selectDate`, `setViewDate`, silent) без ломания виджета | `ParamsController.js`, `ParamsView.js` | `initVersion` ~529–540 | [x] |
| 1.5 | Убрать зависимость от «сырых» `input.value` для логики периода (источник истины — виджет или `params` после события) | `ParamsView.js`, `ParamsController.js` | — | [x] |

---

### 2. Версия прогноза (`#PrognozVersionCombo`)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 2.1 | Инициализация Select2: `multiple`, `maximumSelectionLength: 1`, `initSelect2Event`, ширина, `dropdownParent` | `ParamsView.js` | `initPrognozVersionCombo` ~188–235 | [x] |
| 2.2 | Подписка `select2:select`: извлечь `prognozVersion` из `data[0].text`, вызвать `onChangeParam('versionId', id)` | `ParamsView.js` | ~202–208 | [x] |
| 2.3 | `setForecastVersionOptions`: не `<option>`, а `data` для Select2 + `templateResult` / `templateSelection` (логика как в легаси, методы в `ParamsView`) | `ParamsView.js`, `ParamsController.js` | `initVersion` ~586–618 | [x] |
| 2.4 | Пустой список версий: `warning__block` + текст «Нет данных» как в легаси | `ParamsView.js` | ~642–647 | [x] |
| 2.5 | Программный выбор версии (после загрузки структуры): `val` + `trigger` + синтетический `select2:select` при необходимости | `ParamsView.js` | ~620–634 | [x] |

---

### 3. Итерации (`#IterationCountCombo`)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 3.1 | Загрузка элементов Dim `DK_ITERATION_COUNT` через API (аналог `openDimCombo` + `getAllElements`) в `ParamsService` | `ParamsService.js`, `StressApi.js` | `loadingIterationCountData` | [x] |
| 3.2 | Select2 с `data`, `formatState3`, те же опции multiple/max 1 | `ParamsView.js` | ~238–270 | [x] |
| 3.3 | `select2:select` / change → `onChangeParam('iterations', …)` (значение как в легаси для save) | `ParamsView.js` | `index.js` save path | [x] |

---

### 4. Симуляции (`#SimulationCount`)

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 4.1 | Select2 со статическими 1–10, `tags: true`, `createTag`, валидация 1–10, язык `noResults` / `maximumSelected` | `ParamsView.js` | `initSimulationCount` ~403–479 | [x] |
| 4.2 | Начальное значение и программная установка из структуры (`val`, `trigger('change')`; дефолт «1» через `patchParams`) | `ParamsView.js`, `ParamsController.js` | ~471–478, ~545–564 | [x] |
| 4.3 | Событие → `onChangeParam('simulations', …)` | `ParamsView.js` | — | [x] |

---

### 5. Имя сценария и сообщения

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 5.1 | `#stress_test_name`: если в легаси есть аналог — то же поведение; если только в новой разметке — `change` → `onChangeParam` | `ParamsView.js` | `getStressName`, `RunTest` | [x] |
| 5.2 | Реализовать `setMessages` для зоны params (разметка по договорённости с отчётом) | `ParamsView.js` | — | [x] |

---

### 6. Согласование с координатором и легаси-побочные эффекты

| # | Шаг | Файлы | Легаси | Статус |
|---|-----|-------|--------|--------|
| 6.1 | После смены версии прогноза: вызвать цепочку `reloadStressTestVersions` без дублирования логики в view (view только шлёт id) | `ParamsController.js` | `loadingSaveStressIdByPrognozVersionid` | [x] |
| 6.2 | `checkIndicator` по всем строкам Input/Output при смене версии прогноза | `InputController.js`, `OutputController.js`, `StressController.js` | `initPrognozVersionCombo` ~210–232 | [x] |
| 6.3 | Сверка полей `getData().params` с форматом save/run и с `index.js` (prognozVersion, IterationCount, SimulationCount, даты) | `ParamsController.js` | — | [ ] |

---

### 6.2 — реализовано

**Суть легаси:** после `select2:select` на версии прогноза для **каждой** строки Input и Output вызывается `checkIndicator` → Fore `CheckSingleStructure` → класс `ListRow__error` на строке. Нужны общие **params** (даты, версия, итерации, симуляции) + данные строки.

**Реализация в StressNew:**

1. **InputController** / **OutputController** реализуют `recheckAllIndicators()`: цикл по своим `indicators`, API, обновление `status` и view.
2. **StressController** по `onParamsChanged(params)` пробрасывает новые params в блоки, без логики строк в Params.
3. В `setParams(params)` блоков при смене `versionId` вызывается `recheckAllIndicators()`.

**Статус:** подпункт закрыт по коду; 2026-06-25 синхронизирована документация.

---

### 7. Завершение фазы Params (п.12 + UI-паритет)

| # | Шаг | Статус |
|---|-----|--------|
| 7.1 | Пройти чеклист 0–6 для блока параметров на странице | [x] |
| 7.2 | Ручная проверка на BI (см. ниже) | [x] smoke 2026-06-22; validation run/save ✓ 2026-06-24 |

---

## Вне этого файла

- **`ParamsValidator`** — реализовано в **`../validation.md`** §1 (`getValidationSnapshot` + run/save).
- Загрузка справочников Input/Output при старте из `initVersion` — связка с **Input/Output** и `StressApi` (п.8–11).
- Документы `StressNew/docs/*` — по правилам репозитория, если папка есть в рабочей копии.

---

## Проверка на BI / сервере

**Smoke 2026-06-22:** критических регрессий не выявлено (заказчик).

- [x] Даты: только месяцы, «до» не раньше «от», после смены — перезагрузка списка версий.
- [x] Версия прогноза: Select2, поиск/отображение, цепочка смены версии.
- [x] Итерации: список из Dim, выбор одного.
- [x] Симуляции: 1–10 и кастомный tag в допустимых пределах.
- [x] Смена версии → стресс-тесты → структура → Input/Output.

---

## Журнал выполнения

| Дата | Подпункт | Кто | Комментарий |
|------|----------|-----|-------------|
| 2026-05-18 | — | — | Создан файл плана `params.md` |
| 2026-05-18 | 0.1 | — | `export`/`import` в ParamsController, ParamsView, ParamsValidator, ParamsService; StressController уже импортировал Controller и Service |
| 2026-05-18 | 0.2 | — | Зафиксировано в JSDoc: `$`/Select2/AirDatepicker только в `ParamsView`; `ParamsController`/`ParamsService` без виджетов |
| 2026-05-18 | 0.3 | — | Отклонено заказчиком: без массовых defensive-проверок DOM в view; принцип внесён в `params.md` и `stressnew.mdc` |
| 2026-05-18 | 1.1 | — | `ParamsView`: `dateParamFromDp` / `dateParamToDp`, опции как в `initDateParam`; начальные даты как в легаси; без `onSelect` (след. 1.2–1.5); без optional-guard на `AirDatepicker` |
| 2026-05-18 | 1.2 | — | `ParamsView`: `onSelect` «от» → `minDate` + `clear` «до»; без `change` по датам. `ParamsController`: `onDateParamFromSelected`, `checkDateParam`, строка месяца для API; перезагрузка версий только если период валиден |
| 2026-05-18 | 1.3 | — | `ParamsView`: `onSelect` «до» → `onChangeParam('endDate')`. Контроллер: `patchParams({ endDate })`, при `checkDateParam()` — `refreshPrognozVersionsCombo` |
| 2026-05-18 | 1.4 | — | `ParamsView.setPeriodDates` (`selectDate`/`setViewDate`/`minDate`, silent); `ParamsController.syncPeriodDatesToView` + `_toPickerDateString`; из `applyParamsFromStructureRaw`; даты убраны из `renderParams` (`input.value`) |
| 2026-05-18 | 1.5 | — | `_bind` без дат из `input`; `getSelectedPeriodDates` → `params` в контроллере; Dim/API только из `params` после `onSelect` / bind / структуры |
| 2026-05-18 | 2.1 | — | `ParamsView._initPrognozVersionCombo`: Select2 + `initSelect2Event`, `dropdownParent: parent()`; `_bind` читает val Select2 |
| 2026-05-18 | 2.1+ | — | `initSelect2Event` → `ParamsView._bindSelect2DropdownUi` (UI в view, без `select2-ui.js`) |
| 2026-05-18 | 2.2 | — | `select2:select` на `#PrognozVersionCombo` → `onChangeParam('versionId', text.split('#;')[0])` → `reloadStressTestVersions` в контроллере |
| 2026-05-18 | 2.3 | — | `setForecastVersionOptions`: `.empty().select2({ data })`, `text: "id#;name"`, шаблоны и language как в `initVersion`; `renderParams` — `val` Select2 |
| 2026-05-18 | 2.4 | — | Пустой список версий: `warning__block` на `.dropdown`, `<p class="warning__text">Нет данных</p>` в `.block-parameters__item` |
| 2026-05-18 | 2.5 | — | `_selectPrognozVersionInCombo`: val + change (+ опционально `select2:select`); `renderParams` и `setForecastVersionOptions`; после структуры без лишнего select2:select |
| 2026-05-18 | 3.1 | — | `StressApi.getIterationCountDimElements` → `_fetchDimElements(DK_ITERATION_COUNT)`; `ParamsService.loadIterationCounts` → `{ id, name }` из `item.n` |
| 2026-05-18 | 3.2 | — | `ParamsView`: Select2 итераций (`formatState3`, tags/createTag, multiple/max 1), `setIterationCountOptions`, `_selectIterationInCombo`; загрузка Dim — `refreshIterationCountCombo` из `_bind` (как цепочка версии прогноза, не из `bindView`) |
| 2026-05-18 | 3.3 | — | `select2:select` → `onChangeParam('iterations', text)`; `select2:unselect` → `null` (как `IterationCount` в `getStressParams`) |
| 2026-05-18 | 4.1 | — | Select2 симуляций; выровнено с итерациями: `setSimulationCountOptions`, `loadSimulationCounts` / `refreshSimulationCountCombo` из `_bind`, `formatState3` |
| 2026-05-18 | 4.2 | — | Старт/структура: `refreshSimulationCountCombo` + `renderParams`; дефолт «1» через `patchParams` (как итерации); из структуры — `SimulationCount`, пустое не затирает |
| 2026-05-18 | 4.3 | — | `select2:select` / `unselect` → `onChangeParam('simulations', text \| null)` |
| 2026-05-18 | 5.1 | — | `#stress_test_name`: `_initStressTestName`, `change` → `params`; из структуры `Name` → `renderParams`; save: `StressService` → `rez.Name` |
| 2026-05-18 | 5.2 | — | `setMessages`: контейнер `[data-params-messages]`, `warning__text` / `success__text`; цепочка `StressController.setMessages` → `paramsController.setMessages` |
| 2026-05-18 | 6.1 | — | `onPrognozVersionChanged`: единая цепочка `patchParams` + `reloadStressTestVersions`; view только `versionId`; пустой список прогнозов → сброс структуры |
| 2026-05-18 | 6.2 | — | **Отложено:** `checkIndicator` по строкам — после полной реализации Input/Output |
| 2026-06-25 | 6.2 | — | **Закрыто:** `recheckAllIndicators` в `InputController` / `OutputController.setParams`; docs синхронизированы (C.1) |
| 2026-06-24 | 7.1 | — | Чеклист §0–6 закрыт; validation params на BI ✓ (`validation.md` §7.2/§7.6) |
| 2026-06-24 | docs | — | §7.5: актуализирован «Текущий статус»; сняты отсылки «п.15 отложено» для ParamsValidator |

---

## Следующий шаг

**6.3** — сверка `getData().params` с форматом save/run и `index.js` (**B.1**, `REFACTORING_REMAINING.md` §2.1).
