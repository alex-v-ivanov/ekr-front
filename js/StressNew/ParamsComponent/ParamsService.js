/**
 * ParamsService — запросы к Fore через StressApi. Без DOM и без jQuery (п.0.2).
 */
export class ParamsService {

  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async loadForecastVersions(startDate, endDate) {
    try {
      const items = await this.apiClient.getForecastVersions(startDate, endDate)

      return items.map((item) => {
        return { id: item.k, name: item.n }
      })
    } catch (err) {
      console.error('ParamsService.loadForecastVersions', err)
      return []
    }
  }

  /**
   * @param {string} prognozVersionId
   * @returns {Promise<Array>}
   */
  async loadStressTestVersions(prognozVersionId) {
    const json = { prognozVersion: Number(prognozVersionId) }
    const userId = this.apiClient.getUserId()
    const raw = await this.apiClient.getStressTestVersions(json, userId, prognozVersionId)
    const items = JSON.parse(raw.message)

    return items.map((item) => {
      return { id: item.key, name: item.name }
    })
  }

  /**
   * Элементы справочника итераций для Select2.
   * @returns {Promise<Array<{ id: string, name: string }>>}
   */
  async loadIterationCounts() {
    const items = await this.apiClient.getIterationCountDimElements()

    return items.map((item) => {
      const label = String(item.n)
      return { id: label, name: label }
    })
  }

  /**
   * Статический список симуляций.
   * @returns {Promise<Array<{ id: string, name: string }>>}
   */
  async loadSimulationCounts() {
    return Array.from({ length: 10 }, (_, i) => {
      const label = String(i + 1)
      return { id: label, name: label }
    })
  }

  /**
   * Сохранённая структура пользователя при старте (легаси initVersion: getStructure, version "-1").
   * @returns {Promise<*>}
   */
  async loadSavedUserStructure() {
    const userId = this.apiClient.getUserId()
    return await this.apiClient.getStructure(userId, '-1')
  }

  /**
   * @param {string} stressTestVersionId
   * @returns {Promise<*>}
   */
  async loadStructure(stressTestVersionId) {
    const userId = this.apiClient.getUserId()
    return await this.apiClient.getStructure(userId, stressTestVersionId)
  }

  /**
   * @param {Object} structureRaw
   * @returns {Promise<*>}
   */
  async loadValidStructure(structureRaw) {
    const userId = this.apiClient.getUserId()
    let versionId = structureRaw != null ? structureRaw.prognozVersion : null

    if ((versionId == null || versionId === '') && structureRaw != null && structureRaw.message) {
      try {
        const parsed = JSON.parse(structureRaw.message)
        versionId = parsed.prognozVersion
      } catch {
        versionId = null
      }
    }

    return await this.apiClient.getValidData(structureRaw, versionId, userId)
  }
}
