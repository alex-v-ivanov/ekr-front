import { AnalysisPopUpValidator } from './AnalysisPopUpValidator.js'
import { AnalysisPopUpView } from './AnalysisPopUpView.js'

/**
 * Обзор показателей Input/Output с фильтрами и удалением строк. Legacy: `AnalysisPopUp` в `stress-popups.js`.
 *
 * **Разметка:** `.modal-custom__analysis`, `.SelectAnalysisBody`, `getRowTemplate` в legacy.
 *
 * Слои (п.18 §0.2): без jQuery и без DOM — только оркестрация, `service` / `validator`, делегирование в `view`.
 * `AnalysisPopUpService` создаётся в `InputController` / `OutputController` и передаётся сюда.
 *
 * Экземпляр на блок; `table` задаётся при создании, не при каждом `openModal`.
 */
export class AnalysisPopUpController {

  /**
   * @param {import('./AnalysisPopUpService.js').AnalysisPopUpService} analysisPopUpService
   * @param {'Input'|'Output'} table
   * @param {() => Array} getIndicators — текущий список строк блока
   * @param {(rowNumber: number) => void} onRowRemoved — после удаления строки из модалки (`removeIndicator` в блоке)
   * @param {() => string} getRemoveRowConfirmMessage — текст confirm из `InputValidator` / `OutputValidator` блока
   */
  constructor(
    analysisPopUpService,
    table,
    getIndicators,
    onRowRemoved,
    getRemoveRowConfirmMessage,
  ) {
    this.table = table
    this.getIndicators = getIndicators
    this.onRowRemoved = onRowRemoved
    this.getRemoveRowConfirmMessage = getRemoveRowConfirmMessage
    /** @type {((message: string, onConfirm: () => void) => void)|null} */
    this._showConfirmDialog = null

    this.service = analysisPopUpService
    this.validator = new AnalysisPopUpValidator()
    this.view = new AnalysisPopUpView(this)
  }

  /**
   * Открытие модалки: полный Dim в фильтрах (легаси `initSelect2Field` на `#analysis__*`).
   * `table` задан при создании экземпляра; render таблицы — §5.1.
   */
  async openModal() {
    await this.service.loadFieldOptions()

    const filterOptions = this.service.getFilterFieldOptions()

    this.view.setInputColumnsVisible(this.table === 'Input')
    this.view.renderFilterSelects(filterOptions)
    this.renderTable()
    this.view.openModal()
  }

  /** Перерисовка `.SelectAnalysisBody` (п.18 §5.1; повторно — §5.2–5.4). */
  renderTable() {
    const rows = this.service.buildRenderRows(this.getIndicators(), this.table)

    this.view.render({
      table: this.table,
      rows,
    })
  }

  closeModal() {
    this.clearFilter()
    this.view.closeModal()
  }

  /**
   * Confirm-диалог для удаления строки (п.18 §6.2; проброс из `StressController` через блок).
   *
   * @param {((message: string, onConfirm: () => void) => void)|null} fn
   */
  setShowConfirmDialog(fn) {
    this._showConfirmDialog = typeof fn === 'function' ? fn : null
  }

  /**
   * Фильтрация строк по `#analysis__*` (п.18 §5.2; легаси `applyFilter`).
   */
  applyFilter() {
    const filters = this.view.collectFilterValues()

    this.view.applyRowVisibility(filters)
  }

  /**
   * Сброс фильтров и показ всех строк (п.18 §5.2; легаси `clearFilter`).
   */
  clearFilter() {
    this.view.clearFilterSelects()
    this.view.showAllRows()
  }

  /**
   * Удаление строки из модалки (п.18 §5.3; легаси click `removeRow` + `showDialog`).
   *
   * @param {number} rowNumber
   */
  handleRemoveRow(rowNumber) {
    const onConfirm = () => {
      this._removeRow(rowNumber)
    }

    const showDialog = this._showConfirmDialog

    if (!showDialog) {
      onConfirm()
      return
    }

    showDialog(this.getRemoveRowConfirmMessage(), onConfirm)
  }

  /**
   * @param {number} rowNumber
   */
  _removeRow(rowNumber) {
    const exists = this.getIndicators().some((row) => row.number === rowNumber)

    if (!exists) {
      return
    }

    this.onRowRemoved(rowNumber)
    this._refreshModalAfterRowsChanged()
  }

  /**
   * Re-render модалки после изменения списка (п.18 §5.4): фильтры, таблица, активные фильтры.
   */
  _refreshModalAfterRowsChanged() {
    const previousFilters = this.view.collectFilterValues()
    const filterOptions = this.service.getFilterFieldOptions()

    this.view.renderFilterSelects(filterOptions)
    this.view.restoreFilterSelections(previousFilters, filterOptions)
    this.renderTable()
    this.view.applyRowVisibility(this.view.collectFilterValues())
  }
}
