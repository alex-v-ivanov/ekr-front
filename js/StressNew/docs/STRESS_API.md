# StressApi: структура и методы модуля (п.7 плана)

Класс **`StressApi`** (`StressApi.js`) — единая точка вызова `bi.getResultForeModule` для прикладного модуля с ключом `foreKeys.DK_STRESS_1144013`. Объект **`bi`** — клиентский API **Foresight Analytics Platform** (Fore), см. комментарии в `StressApi.js`.

## Внутренние помощники

| Имя | Назначение |
|-----|------------|
| `callModule(methodName, args)` | Прямой вызов с готовым массивом `args` (расширения и редкие методы). |
| `_argsJsonUserVersion(json, userId, versionId)` | Три аргумента: `json` (объект → `JSON.stringify`), `userName` (в контракте модуля часто Id), `version`. |
| `_argsUserVersion(userId, versionId)` | Два аргумента — как у **`getStructure`**. |

Константы строк **`methodName`** — объект **`StressApi.MODULE_METHOD`** в конце `StressApi.js`.

Контекст пользователя для аргументов модуля (не конструктор **`StressController`**): **`setGetUserId(fn)`** — `() => string`; **`resolveUserId()`** — что подставить в вызовы; **`setUserName`** — имя для `startModelRisk` и т.д. (см. замечание заказчика п.21 — идентификатор нужен слою API).

## Публичные методы (сигнатуры)

| Метод JS | Метод прикладного модуля (сервер) | Параметры |
|----------|-------------------|-----------|
| `checkFullStructure(json, prognozVersionId, userId)` | `CheckFullStructure` | Объект конфигурации, версия прогноза, user Id. |
| `getValidData(...)` | *то же* | Алиас на `checkFullStructure` (как `StressReport.getValidData`). |
| `startModelRisk(json, userName, version)` | `startModelRisk` | JSON-**строка**, имя пользователя, версия. |
| `saveUserStructure(json, userId, versionId)` | `SaveUserStructure` | JSON-строка, user Id, версия. |
| `getStructure(userId, version)` | `getStructure` | Без тела JSON (инициализация формы). |
| `getStressTestVersions(json, userId, versionId)` | `GetStressTestVersions` | Объект (напр. `{ prognozVersion }`), user Id, версия. |
| `getStressVersion(json, userId, versionId)` | `GetStressVersion` | Объект `{ StressVersion }` и т.д. |
| `checkSingleStructure(json, userId, versionId)` | `CheckSingleStructure` | Проверка одной строки показателя. |
| `checkData(json, userId, versionId)` | `CheckData` | Допустимый диапазон дат по показателю. |
| `callModuleJsonMethod(methodName, payload, userId, versionId)` | *любой* | Универсальная обёртка с тройкой аргументов. |
| `getDistributionData` / `choiceDistribution` / `deleteDistribution` | `GetDistributionData` / … | Обёртки над `callModuleJsonMethod`. |
| `saveExcelDataSet` / `getExcelDataSets` / `deleteExcelDataSet` | `SaveExcelDataSet` / … | То же для Excel. |

Перенос тел вызовов из legacy в эти методы — **п.8–10** плана; сами сигнатуры и имена зафиксированы в **п.7**.

## Сервис сценария (`StressService`)

Вызовы из legacy `StressClass` / `stressReport` для сценариев «запуск / сохранение / проверка строки» переносятся в **`StressService`**: сбор payload (`buildStressModulePayload`), `checkFullStructureForRun`, `startModelRisk`, `saveUserStructure`, `checkSingleStructure`. См. **[P8_LEGACY_INDEX_TO_STRESS_API.md](P8_LEGACY_INDEX_TO_STRESS_API.md)**.
