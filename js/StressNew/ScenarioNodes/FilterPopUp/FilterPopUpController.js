import { FilterPopUpView } from './FilterPopUpView.js'

/**
 * @typedef {Object} FilterPopUpIndicatorSelectContext
 * @property {number} rowNumber
 * @property {1|2} indType
 * @property {string|number} blockId
 * @property {string} blockName
 * @property {import('./FilterPopUpService.js').FilterPopUpDimOption[]} options
 */

/**
 * @typedef {Object} FilterPopUpDistributionSelectContext
 * @property {number} rowNumber
 * @property {number} typeId
 * @property {string} typeName
 * @property {Array<{ id: *, name: string, distributionType?: 1|2 }>} options
 */

/**
 * @typedef {Object} FilterPopUpHeaderSelectContext
 * @property {'Input'|'Output'} table
 * @property {'Number'|'Name'|'Product'} headerColumn — атрибут `mode` на SVG в HTML (не enum приложения)
 * @property {string|number} value
 * @property {string} label
 */

/**
 * Floating popup фильтров списка Input/Output.
 * Legacy: `CustomePopUp` в `Reports/js/Stress/stress-custome-popup.js` (только filtering*).
 *
 * **Не** переносим `init($el, data, selected, mode, $nav)` — вместо dispatch по `mode` три явных entry point'а
 * (см. `filter-popup.md` §«Отказ от mode»).
 *
 * Экземпляр на блок (`InputController` / `OutputController`), не глобальный `Stress.customePopUp`.
 */
export class FilterPopUpController {

  /**
   * @param {import('./FilterPopUpService.js').FilterPopUpService} filterPopUpService
   * @param {'Input'|'Output'} table
   * @param {() => Array} getIndicators
   * @param {() => Array} getProductOptions
   * @param {() => Array|null} getDistributionOptions — Input; Output — `() => null`
   * @param {() => import('./FilterPopUpService.js').FilterPopUpDimOption[]} getIndicatorCatalog — полный справочник показателей блока (§5.5)
   * @param {(ctx: FilterPopUpIndicatorSelectContext) => void|Promise<void>} onIndicatorOptions
   * @param {(ctx: FilterPopUpDistributionSelectContext) => void|Promise<void>} onDistributionOptions
   * @param {(ctx: FilterPopUpHeaderSelectContext) => void} onHeaderFilter
   */
  constructor(
    filterPopUpService,
    table,
    getIndicators,
    getProductOptions,
    getDistributionOptions,
    getIndicatorCatalog,
    onIndicatorOptions,
    onDistributionOptions,
    onHeaderFilter,
  ) {
    this.table = table
    this.getIndicators = getIndicators
    this.getProductOptions = getProductOptions
    this.getDistributionOptions = getDistributionOptions
    this.getIndicatorCatalog = getIndicatorCatalog
    this.onIndicatorOptions = onIndicatorOptions
    this.onDistributionOptions = onDistributionOptions
    this.onHeaderFilter = onHeaderFilter

    this.service = filterPopUpService
    this.view = new FilterPopUpView(this)

    /** @type {import('./FilterPopUpService.js').FilterPopUpDimOption[]|null} */
    this._modelBlockOptions = null
  }

  /**
   * Фильтр шапки по колонке № / имя / продукт (§3).
   *
   * @param {'Number'|'Name'|'Product'} headerColumn — атрибут `mode` на `[data-rowBtn="filteringInput"]`
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav — `#input_block .ListHeadlines` / `#output_block .ListHeadlines`
   */
  openHeaderFilter(headerColumn, $anchor, $nav) {
    const items = this.service.buildHeaderFilterItems(
      this.table,
      headerColumn,
      this.getIndicators(),
      this.getProductOptions(),
    )

    this.view.showListPopup({
      $anchor,
      $nav,
      items,
      layout: 'header',
      searchMatch: headerColumn === 'Number' ? 'exact' : 'contains',
      getItemLabel: (item) =>
        headerColumn === 'Number' ? String(item.number) : String(item.indicatorName),
      getItemKey: (item) =>
        headerColumn === 'Number' ? item.number : item.indicatorName,
      onSelect: (item) => this._handleHeaderItemSelect(headerColumn, item, $anchor),
    })
  }

  /**
   * Фильтр распределения в строке Input (§4). Output — no-op (`table !== 'Input'`).
   *
   * @param {number} rowNumber
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   */
  openDistributionFilter(rowNumber, $anchor, $nav) {
    if (this.table !== 'Input') {
      return
    }

    const items = this.service.buildDistributionFilterItems()

    this.view.showListPopup({
      $anchor,
      $nav,
      items,
      layout: 'row',
      searchMatch: 'contains',
      getItemLabel: (item) => item.name,
      getItemKey: (item) => item.id,
      onSelect: (item) => this._handleDistributionItemSelect(rowNumber, item, $anchor),
    })
  }

  /**
   * Фильтр показателя по блоку модели в строке (§5).
   *
   * @param {number} rowNumber
   * @param {import('jquery')} $anchor
   * @param {import('jquery')} $nav
   * @returns {Promise<void>}
   */
  async openIndicatorBlockFilter(rowNumber, $anchor, $nav) {
    const blocks = await this._ensureModelBlockOptions()
    const items = blocks.map((block) => ({
      id: block.id,
      text: `${block.id}#;${block.name}`,
    }))

    this.view.showListPopup({
      $anchor,
      $nav,
      items,
      layout: 'row',
      searchMatch: 'contains',
      getItemLabel: (item) => {
        const parts = String(item.text).split('#;')
        return parts.length > 1 ? parts[1] : parts[0]
      },
      getItemKey: (item) => item.id,
      onSelect: (item) => this._handleIndicatorBlockItemSelect(rowNumber, item, $anchor),
    })
  }

  /**
   * @returns {1|2}
   */
  _getIndType() {
    return this.table === 'Input' ? 1 : 2
  }

  /**
   * @returns {Promise<import('./FilterPopUpService.js').FilterPopUpDimOption[]>}
   */
  async _ensureModelBlockOptions() {
    if (this._modelBlockOptions != null) {
      return this._modelBlockOptions
    }

    this._modelBlockOptions = await this.service.loadModelBlockOptions()
    return this._modelBlockOptions
  }

  /**
   * @param {'Number'|'Name'|'Product'} headerColumn
   * @param {import('./FilterPopUpService.js').FilterPopUpHeaderItem} item
   * @param {import('jquery')} $anchor
   */
  _handleHeaderItemSelect(headerColumn, item, $anchor) {
    const value = headerColumn === 'Number' ? item.number : item.indicatorName
    const label = String(value)

    this.view.updateFilterButtonState($anchor, label)
    this.view.closeAllPopups()

    this.onHeaderFilter({
      table: this.table,
      headerColumn,
      value,
      label,
    })
  }

  /**
   * @param {number} rowNumber
   * @param {{ id: number, name: string }} item
   * @param {import('jquery')} $anchor
   */
  _handleDistributionItemSelect(rowNumber, item, $anchor) {
    const allOptions = this.getDistributionOptions() || []
    const options = this.service.filterDistributionOptions(allOptions, item.id)

    this.view.updateFilterButtonState($anchor, item.name)
    this.view.closeAllPopups()

    this.onDistributionOptions({
      rowNumber,
      typeId: item.id,
      typeName: item.name,
      options,
    })
  }

  /**
   * @param {number} rowNumber
   * @param {{ id: *, text: string }} item
   * @param {import('jquery')} $anchor
   * @returns {Promise<void>}
   */
  async _handleIndicatorBlockItemSelect(rowNumber, item, $anchor) {
    const parts = String(item.text).split('#;')
    const blockName = parts.length > 1 ? parts[1] : parts[0]
    const blockId = item.id

    this.view.updateFilterButtonState($anchor, blockName)
    this.view.closeAllPopups()

    const indType = this._getIndType()
    let options

    if (String(blockId) === '-1' || blockName === 'Все') {
      options = this.getIndicatorCatalog() || []
    } else {
      options = await this.service.fetchIndicatorsByBlock(indType, blockId)
    }

    await this.onIndicatorOptions({
      rowNumber,
      indType,
      blockId,
      blockName,
      options,
    })
  }
}
