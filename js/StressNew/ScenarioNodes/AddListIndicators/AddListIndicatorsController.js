import { AddListIndicatorsValidator } from './AddListIndicatorsValidator.js'
import { AddListIndicatorsView } from './AddListIndicatorsView.js'

/**
 * Модалка «Добавить список»: копирование Input/Output с другой версии стресс-теста.
 * Legacy: `AddListIndicators` в `Reports/js/Stress/stress-add-list.js`.
 *
 * **Разметка:** `.modal-custom__AddListIndicators`, `#AddListIndicatorsSelect`.
 *
 * Слои (п.17 §0.2): без jQuery и без DOM — только оркестрация, `service` / `validator`, делегирование в `view`.
 * `AddListIndicatorsService` создаётся в `InputController` / `OutputController` и передаётся сюда.
 *
 * Экземпляр на блок (`InputController` / `OutputController`), не один глобальный на обе таблицы.
 */
export class AddListIndicatorsController {

  /**
   * @param {import('./AddListIndicatorsService.js').AddListIndicatorsService} addListIndicatorsService
   * @param {'Input'|'Output'} table
   * @param {() => Object|null} getParams — текущие params блока (`versionId` для API)
   * @param {(rows: Array) => void|Promise<void>} onCopy — замена списка строк в блоке
   */
  constructor(addListIndicatorsService, table, getParams, onCopy) {
    this.table = table
    this.getParams = getParams
    this.onCopy = onCopy

    this.service = addListIndicatorsService
    this.validator = new AddListIndicatorsValidator()
    this.view = new AddListIndicatorsView(this)

    /** @type {((token: string) => void)|null} */
    this._showWaiter = null
    /** @type {((token: string) => void)|null} */
    this._hideWaiter = null
  }

  /**
   * Оверлей загрузки (легаси `common.waiter`). Проброс из блока — п.17 §4.2.
   *
   * @param {((token: string) => void)|null} showFn
   * @param {((token: string) => void)|null} hideFn
   */
  setWaiter(showFn, hideFn) {
    this._showWaiter = typeof showFn === 'function' ? showFn : null
    this._hideWaiter = typeof hideFn === 'function' ? hideFn : null
  }

  /**
   * @template T
   * @param {string} token
   * @param {() => Promise<T>|T} fn
   * @returns {Promise<T>}
   */
  async _withWaiter(token, fn) {
    if (this._showWaiter) {
      this._showWaiter(token)
    }

    try {
      return await fn()
    } finally {
      if (this._hideWaiter) {
        this._hideWaiter(token)
      }
    }
  }

  /**
   * Показать модалку: загрузить версии стресс-теста → Select2 → open (п.17 §2.1; легаси `openModal`).
   * Без `versionId` — пустой комбо, без API и без диалога (п.17 §2.5; легаси пустой `PrognozVersionEls`).
   *
   * @returns {Promise<void>}
   */
  async openModal() {
    this.view.setAsActive()

    const versionId = this._getPrognozVersionId()

    if (versionId == null) {
      this.view.setStressTestVersionOptions([])
      this.view.openModal()
      return
    }

    const versions = await this.service.loadStressTestVersionOptions(versionId)

    this.view.setStressTestVersionOptions(versions)
    this.view.openModal()
  }

  /**
   * Текущая версия прогноза из params блока (легаси `PrognozVersionComboSelected`).
   *
   * @returns {string|number|null}
   */
  _getPrognozVersionId() {
    const params = this.getParams()

    if (params == null || params.versionId == null || String(params.versionId) === '') {
      return null
    }

    return params.versionId
  }

  /**
   * Скрыть модалку (легаси `closeModal`).
   */
  closeModal() {
    this.view.closeModal()
  }

  /**
   * «Скопировать»: collect → validate → waiter → `fetchRowsForCopy` → `onCopy` → `closeModal` (п.17 §3.5–3.6, §4.1).
   * Сбой API / сеть — §4.3: waiter в `finally`, без диалога (легаси молчит при не-OK `GetStressVersion`).
   */
  async handleCopy() {
    const selectedVersionId = this.view.collectSelectedStressVersionId()
    const check = this.validator.validateVersionSelected(selectedVersionId)

    if (!check.isValid) {
      this.view.showFieldRequiredError(this.validator.getFieldRequiredMessage())
      return
    }

    this.view.clearFieldError()

    await this._withWaiter('Copy List', async () => {
      try {
        const prognozVersionId = this._getPrognozVersionId()
        const rows = await this.service.fetchRowsForCopy(
          selectedVersionId,
          prognozVersionId,
          this.table,
        )

        if (rows == null) {
          console.error('AddListIndicatorsController.handleCopy: GetStressVersion failed', {
            stressVersionId: selectedVersionId,
            prognozVersionId,
            table: this.table,
          })
          return
        }

        await Promise.resolve(this.onCopy(rows))
        this.closeModal()
      } catch (err) {
        console.error('AddListIndicatorsController.handleCopy', err)
      }
    })
  }
}
