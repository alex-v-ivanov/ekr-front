/**
 * @typedef {Object} FilterPopUpDimOption
 * @property {*} id
 * @property {string} name
 */

/**
 * @typedef {Object} FilterPopUpHeaderItem
 * @property {string|number} number
 * @property {string} indicatorName
 */

/**
 * FilterPopUpService — dims и подготовка данных для popup фильтров.
 *
 * Слои (C.3 §0.2): только `StressApi`; без jQuery, без DOM, без бизнес-правил UI.
 * Legacy: `stress-custome-popup.js` (режимы filtering*), `stress-ui.js` (`filterInputItems` / `filterOutputItems`).
 *
 * Реализация API и маппинга — §2.
 */
export class FilterPopUpService {

  /**
   * @param {import('../../StressApi.js').StressApi} apiClient
   */
  constructor(apiClient) {
    this.apiClient = apiClient
  }

  /**
   * Справочник блоков показателей (`DK_MODEL_BLOCK_NSISPRAV` + «Все»).
   * §2.1.
   *
   * @returns {Promise<FilterPopUpDimOption[]>}
   */
  async loadModelBlockOptions() {
    const raw = await this.apiClient.getModelBlockDimElements()
    const items = this._normalizeDimItems(raw)

    if (items.length === 0) {
      return []
    }

    return [{ id: '-1', name: 'Все' }, ...items]
  }

  /**
   * Показатели `STRESS_POKS` с фильтром по блоку.
   * §2.2.
   *
   * @param {1|2} indType
   * @param {string|number} blockId
   * @returns {Promise<FilterPopUpDimOption[]>}
   */
  async fetchIndicatorsByBlock(indType, blockId) {
    const raw = await this.apiClient.getStressPoksIndicators(indType, blockId)
    return this._normalizeDimItems(raw)
  }

  /**
   * Пункты popup фильтра шапки (Number / Name / Product).
   * §2.3.
   *
   * @param {'Input'|'Output'} table
   * @param {'Number'|'Name'|'Product'} headerColumn — колонка шапки (атрибут `mode` в HTML)
   * @param {Array<{ number?: *, indicatorName?: string }>} rows
   * @param {FilterPopUpDimOption[]} productOptions
   * @returns {FilterPopUpHeaderItem[]}
   */
  buildHeaderFilterItems(table, headerColumn, rows, productOptions) {
    void table

    if (headerColumn === 'Product') {
      return (productOptions || []).map((item) => ({
        number: item.id,
        indicatorName: item.name != null ? String(item.name) : '',
      }))
    }

    let data = (rows || []).map((row) => ({
      number: row.number,
      indicatorName:
        row.indicatorName != null
          ? String(row.indicatorName)
          : (row.name != null ? String(row.name) : ''),
    }))

    data.unshift({
      number: 'Все',
      indicatorName: 'Все',
    })

    if (headerColumn !== 'Number') {
      data = data.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.indicatorName === item.indicatorName),
      )
    }

    return data
  }

  /**
   * Фиксированный список «Все / Распределение / Модель» для фильтра distribution в строке.
   * §2.4.
   *
   * @returns {Array<{ id: number, name: string }>}
   */
  buildDistributionFilterItems() {
    return [
      { id: 0, name: 'Все' },
      { id: 1, name: 'Распределение' },
      { id: 2, name: 'Модель' },
    ]
  }

  /**
   * Сузить справочник распределений по типу (0 — все, 1 — distribution, 2 — model).
   * §2.5.
   *
   * @param {Array<{ id: *, name: string, distributionType?: 1|2 }>} allOptions
   * @param {number} typeId
   * @returns {Array<{ id: *, name: string, distributionType?: 1|2 }>}
   */
  filterDistributionOptions(allOptions, typeId) {
    const source = allOptions || []

    if (typeId === 0) {
      return source
    }

    return source.filter((item) => Number(item.distributionType) === Number(typeId))
  }

  /**
   * BI `{ k, n }` → `{ id, name }`.
   *
   * @param {Array<{ k: *, n: * }>} items
   * @returns {FilterPopUpDimOption[]}
   */
  _normalizeDimItems(items) {
    return (items || [])
      .filter((item) => item != null && item.k != null && item.k !== '')
      .map((item) => ({
        id: item.k,
        name: item.n != null ? String(item.n) : '',
      }))
  }
}
