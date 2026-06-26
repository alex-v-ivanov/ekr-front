# Контракты StressController ↔ Params / Input / Output

**Дата фиксации черновика:** 2026-03-30  
**Область реализации:** папка **`StressNew`** (этот репозиторий).  
**Legacy только для справки:** `Reports/js/Stress` — не целевой код нового каркаса.

**Связанные материалы:** [../Стресс-тест JS.drawio](../Стресс-тест%20JS.drawio), при необходимости — `Reports/js/Stress/docs/14-target-architecture.md` (общая цель инкапсуляции).

**Состояние репозитория (документ ↔ код):** ниже зафиксированы **целевые** контракты. Инициализация координатора (п.2): только **`StressController(bi, foreKeys)`** — без пакета опций «на будущее»; идентификатор пользователя для модуля — **`StressApi.setGetUserId`** / проброс **`StressController.setGetUserId`**; имя — **`setUserName`**; сценарный UI для зоны **`scenario`** — **`setScenarioUi(ui)`**, когда появится вёрстка. Точка входа: **`createStressApplication(bi, foreKeys)`**. Актуальное дерево: [PLAN_CHECKLIST.md](PLAN_CHECKLIST.md) («Фактическое дерево»).

---

## 1. Назначение

Зафиксировать целевые интерфейсы между координатором **`StressController`** (`StressNew/StressController.js`) и блоками:

- **Params** — период, версия прогноза, итерации, симуляции, загрузка версий;
- **Input** — строки ввода показателей, распределения, история, аналитики, файлы;
- **Output** — строки выходных показателей.

---

## 2. Роль StressController

- Вход конструктора: только **`bi`** и **`foreKeys`**. Идентификатор пользователя нужен **вызовам модуля** — хранится и задаётся на **`StressApi`** (`setGetUserId`); координатор при необходимости только пробрасывает вызов (**`setGetUserId`**) и не дублирует состояние. Имя пользователя для API — **`setUserName`**. Объекта **`deps`**, поля **`common`** и «опций на будущее» в конструкторе нет; общий контекст страницы — снаружи (отдельные утилиты). Слой сценарных сообщений для общей зоны экрана — **`setScenarioUi({ setScenarioMessages })`**, подключается отдельно, когда компонент готов.
- Сборка и хранение ссылок на **StressApi** / **StressService** / **`StressValidator`** (как на диаграмме: сквозная валидация рядом с сервисом) и блоки Params, Input, Output.
- Подписка на изменения блоков (колбеки `onChange` от блоков → `onParamsChanged`, `onInputChanged`, `onOutputChanged`).
- Сборка агрегата данных для сервера (`getData()`), комплексная **validate()**.
- Привязка UI трёх блоков: **`bindParams` / `bindInput` / `bindOutput`** (фасад над `*Controller.bindView`, без экспорта View наружу — T2).
- Команды сценария: **`sendTest()`** (локальная валидация → CheckFullStructure → startModelRisk), **`saveTestState()`** (saveUserStructure) — через **StressService** → **StressApi** (п.8). Результат в форме **`{ ok, messages, step?, ... }`** (класс **`StressScenarioResult`**, п.21 T3): `messages` разбиты по зонам **`scenario`**, **`params`**, **`input`**, **`output`** (массивы элементов `type` / `text` / опционально **`meta`** для подсветки). После каждого сценария вызывается **`setMessages(messages)`** (п.21 **T4**): раскладка по **`paramsController` / `inputController` / `outputController`** (`setMessages` на каждом блоке → View) и при подключённом **`setScenarioUi`** — **`setScenarioMessages`** для зоны **`scenario`**.

Блоки **не** получают целиком «старый» объект `stress`; получают **узкий контракт** (API-клиент, колбеки, при необходимости срез параметров).

### Bootstrap страницы и кнопка «Запустить тест» (п.21 T5)

- **`StressIndex.js`**: **`createStressApplication(bi, foreKeys)`** → **`StressApp`** → **`StressController(bi, foreKeys)`**; далее по мере готовности страницы: **`setUserName`**, **`setGetUserId`**, **`setScenarioUi`**, привязки блоков.
- При старте: **`controller.bindView(root)`** — **`StressView`**: кнопки шапки (`saveConfiguration`, `goToInputForms`, `goToFinancialRisksReport`, `goToJournal`, `runTest`) через **`data-stress-action`**, без `onclick`.

---

## 3. Контракт Params (`ParamsComponent/`)

| Элемент | Описание |
|---------|----------|
| Владелец данных | Объект параметров (даты, versionId, счётчики и т.д. — по мере наполнения). Реализация: **`ParamsController`**. |
| Вход | `setParams(params)` — полная подмена с заполнением дефолтов; `patchParams(partial)` — частичное обновление. Загрузка версий и т.п. — **`ParamsService`** через `StressApi` (п.8+). |
| Представление | **`ParamsView`**: только ввод в контроллер, без прямого доступа к Input/Output. Со страницы — **`StressController.bindParams(root)`** → внутри **`ParamsController.bindView(root)`** → `ParamsView.bind(root)` (T2: View не отдаётся снаружи). |
| Уведомление координатора | После изменения: `onChangeCallback(params)` (колбек в конструкторе). |
| События vs колбеки | На каркасе — **один колбек** на смену параметров; при росте сложности тот же смысл можно вынести в шину событий без смены смысла контракта. |
| Выход | `getData()`, `validate()` → **`ParamsValidationResult`**: `{ isValid, errors: string[] }`. |
| Сообщения сценария (T4) | **`setMessages(items)`** — массив сообщений по зоне Params; делегирует в **`ParamsView.setMessages`** (подсветка полей — п.12+). |

Координатор при смене параметров вызывает у Input/Output **`setParams(params)`** (копия/срез, без прямого доступа к DOM legacy).

---

## 4. Контракт Input (`InputComponent/`)

| Элемент | Описание |
|---------|----------|
| Владелец данных | Массив строк ввода (индикаторы). Реализация: **`InputController`**. |
| Синхронизация с Params | `setParams(params)` — пересчёт / валидация, без чтения глобального `stress`. |
| Уведомление | `onChangeCallback(indicators)` при смене данных строк. |
| Сервис | **`InputService`**: сервер и данные сценариев только через **`StressApi`**. |
| Представление | **`InputView`**: DOM и попапы → вызовы в контроллер. Со страницы — **`StressController.bindInput(root)`** → **`InputController.bindView`** → `InputView.bind` (T2). |
| Сценарные узлы | **`ScenarioNodes/`** (п.6): `SelectDistribution*`, четыре `*PopUp` (Controller + Service + View), `FilterPopUp`, `AddListIndicators`. Создание из **`InputController`** / **`OutputController`**. Подтверждение RunTest — **`StressView`** + **`StressController.runTest`** (C.2). |
| Выход | `getData()`, `validate()` → **`KeyedValidationResult`**: `{ isValid, errors: Record<string, string> }`. |
| Сообщения сценария (T4) | **`setMessages(items)`** — зона Input; делегирует в **`InputView.setMessages`** (подсветка строк по `meta` — п.13). |

---

## 5. Контракт Output (`OutputComponent/`)

Симметрично Input: владение массивом выходных строк; **`OutputService`**, **`OutputView`**; привязка UI — **`StressController.bindOutput(root)`** → **`OutputController.bindView`** (T2). `setParams` (без `recalculate` — только `recheckAllIndicators` при смене `versionId`), `setIndicators`, `onEditRow` / `onCancelRow`, `openAnalyticsForRow`, `openIndicatorsAnalysis`; ScenarioNodes: `AnalyticsPopUp`, `AnalysisPopUp`, `AddListIndicators`, `FilterPopUp`. `onChangeCallback`, `getData()`, `validate()` → **`KeyedValidationResult`**; **`setMessages(items)`** → **`OutputView.setMessages`** (T4).

---

## 6. Сборка payload и сервер

- Метод координатора **`getData()`** объединяет `params`, `input`, `output`.
- Комплексная **`validate({ mode? })`** собирает локальные результаты блоков и передаёт их в **`StressValidator.validateScenario`** → **`ScenarioValidationResult`** `{ isValid, errors: { params, input, output, scenario? } }` (сквозные правила — п.15). Подробнее: **[validation.md](../validation.md)** §«Контракт ошибок», JSDoc в `*Validator.js`.
- **StressService** формирует вызовы к **StressApi** (JSON, userName, version) в духе legacy `StressReport` / `getStressParams`.
- Прямых вызовов `bi` из «представления» блоков в целевом коде быть не должно — только через **StressApi** (фазы T2+ плана рефакторинга).

---

## 7. Чек-лист согласования с заказчиком

- [ ] Три блока покрывают форму; четвёртый скрытый владелец полей не появляется.
- [ ] Согласован стиль: колбеки на каркасе, при необходимости — события для нескольких подписчиков.
- [ ] Запуск/сохранение идут через координатор + API-слой.
- [ ] Диаграмма `StressNew` согласована с именами классов в коде.

---

## 8. Контракт валидации (п.15, зафиксировано в коде)

| Слой | Метод | Возврат `errors` |
|------|--------|------------------|
| **ParamsValidator** | `validate(params)` | `string[]` → зона **params** |
| **InputValidator** / **OutputValidator** | `validate(rows, params, options?)` | `Record<string, string>` — ключ `"3"` (строка) или `"params"` → зоны **input** / **output** |
| **StressValidator** | `validateScenario(local, data, options?)` | `{ params: string[], input, output, scenario?: string[] }` → `StressScenarioResult.messagesFromValidation` |

- Валидатор создаётся в **Controller** блока, не в Service (см. **validation.md** §«Где лежат тексты»).
- **`ParamsValidator` / `InputValidator` / `OutputValidator`** — без конструктора и без `StressApi` / `apiClient`; в контроллере: `new ParamsValidator()` и т.д. (п.15 §0.4).
- **`StressValidator`** — сквозные правила (п.15 §4+): `new StressValidator(apiClient)`; без `StressService`. Маппинг строк для дублей — `StressController.validate()` → `buildStressModulePayload` → `options.rez` в `validateScenario`.
- Типы описаны JSDoc (`@typedef`) в `ParamsValidator.js`, `InputValidator.js`, `OutputValidator.js`, `StressValidator.js`.
- **`PROGNOSIS_VERSION_REQUIRED`:** `ParamsView.getValidationSnapshot` + `ParamsValidator._validateFromSnapshot` — см. **[validation.md](../validation.md)** §1.x.

После подтверждения обновить дату/статус в шапке этого файла.
