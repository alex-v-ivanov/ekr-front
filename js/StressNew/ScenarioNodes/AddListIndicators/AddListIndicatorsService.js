/**
 * AddListIndicatorsService — вызовы Fore для попапа «Добавить список».
 *
 * Слои (п.17 §0.2): только `StressApi`; без jQuery, без DOM, без бизнес-правил UI.
 * `GetStressTestVersions` — §2.1; `GetStressVersion` + `getValidData` — §3.1.
 */
export class AddListIndicatorsService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * @returns {string}
   */
  getUserId() {
    return this.apiClient.getUserId()
  }

  /**
   * Список версий стресс-теста для комбо попапа (легаси `PrognozVersionEls` / `GetStressTestVersions`).
   *
   * @param {string|number|null|undefined} prognozVersionId — текущая версия прогноза из params
   * @returns {Promise<Array<{ id: string|number, name: string }>>}
   */
  async loadStressTestVersionOptions(prognozVersionId) {
    if (prognozVersionId == null || String(prognozVersionId) === '') {
      return []
    }

    const json = { prognozVersion: Number(prognozVersionId) }
    const userId = this.apiClient.getUserId()
    const raw = await this.apiClient.getStressTestVersions(json, userId, prognozVersionId)

    if (!raw || raw.status === 'ERROR' || (raw.faultstring && String(raw.faultstring).length > 0)) {
      return []
    }

    let items

    try {
      items = JSON.parse(raw.message)
    } catch {
      return []
    }

    if (!Array.isArray(items)) {
      return []
    }

    return items.map((item) => {
      return { id: item.key, name: item.name }
    })
  }

  /**
   * Строки Input/Output для copy (п.17 §3.1–3.2; легаси `copy()` → `renderInput` / `renderOutput`).
   *
   * @param {string|number} stressVersionId — id версии стресс-теста из комбо попапа
   * @param {string|number} prognozVersionId — текущая версия прогноза (`params.versionId`)
   * @param {'Input'|'Output'} table
   * @returns {Promise<Array|null>} массив строк блока или `null` при сбое `GetStressVersion`
   */
  async fetchRowsForCopy(stressVersionId, prognozVersionId, table) {
    try {
      const userId = this.apiClient.getUserId()
      const requestJson = { StressVersion: Number(stressVersionId) }
      const versionRaw = await this.apiClient.getStressVersion(requestJson, userId, prognozVersionId)

      if (!versionRaw || versionRaw.status === 'ERROR' || this._hasFaultstring(versionRaw)) {
        return null
      }

      const structure = this._parseModuleMessage(versionRaw)

      if (structure == null) {
        return null
      }

      const prognozVersion =
        structure.prognozVersion != null ? structure.prognozVersion : prognozVersionId
      const validRaw = await this.apiClient.getValidData(structure, prognozVersion, userId)

      let resolved = structure

      if (validRaw && validRaw.status !== 'ERROR' && !this._hasFaultstring(validRaw)) {
        const validated = this._parseModuleMessage(validRaw)

        if (validated != null) {
          resolved = validated
        }
      }

      return this._extractRowsFromStructure(resolved, table)
    } catch {
      return null
    }
  }

  /**
   * @param {Object|null|undefined} structure
   * @param {'Input'|'Output'} table
   * @returns {Array}
   */
  _extractRowsFromStructure(structure, table) {
    if (structure == null || typeof structure !== 'object') {
      return []
    }

    if (table === 'Input') {
      if (Array.isArray(structure.Input)) {
        return structure.Input
      }

      if (Array.isArray(structure.input)) {
        return structure.input
      }

      return []
    }

    if (Array.isArray(structure.Output)) {
      return structure.Output
    }

    if (Array.isArray(structure.output)) {
      return structure.output
    }

    return []
  }

  /**
   * @param {*} raw
   * @returns {boolean}
   */
  _hasFaultstring(raw) {
    return raw.faultstring != null && String(raw.faultstring).length > 0
  }

  /**
   * @param {*} raw — ответ модуля с полем `message`
   * @returns {Object|null}
   */
  _parseModuleMessage(raw) {
    if (raw == null || raw.message == null) {
      return null
    }

    try {
      const parsed = JSON.parse(raw.message)

      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
}
