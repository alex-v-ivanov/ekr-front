import { AnalyticsPopUpValidator } from './AnalyticsPopUpValidator.js'
import { AnalyticsPopUpView } from './AnalyticsPopUpView.js'

/**
 * @typedef {Object} AnalyticsPopUpInitContext
 * @property {number} rowNumber — номер строки в блоке Input/Output
 * @property {*} [indicatorId]
 * @property {string} [indicatorName]
 * @property {Object|null} [analytics]
 */

/**
 * @typedef {AnalyticsPopUpInitContext & { table: 'Input'|'Output', analytics: Object }} AnalyticsPopUpSessionContext
 */

/**
 * Аналитики по строке Input/Output. Legacy: `AnalyticsPopUp` в `Reports/js/Stress/stress-popups.js`.
 *
 * **Разметка:** `.modal-custom__analytics`, `.SelectAnalyticsContent`, форма `.SelectAnalyticsForm`.
 *
 * Слои (п.18 §0.2): без jQuery и без DOM — только оркестрация, `service` / `validator`, делегирование в `view`.
 * `AnalyticsPopUpService` создаётся в `InputController` / `OutputController` и передаётся сюда.
 *
 * Экземпляр на блок (`InputController` / `OutputController`), не один глобальный на обе таблицы.
 */
export class AnalyticsPopUpController {

  /**
   * @param {import('./AnalyticsPopUpService.js').AnalyticsPopUpService} analyticsPopUpService
   * @param {'Input'|'Output'} table
   * @param {() => Array} getIndicators — текущий список строк блока
   * @param {(rowNumber: number, analytics: Object) => void|Promise<void>} onApply — сохранение в модель строки
   */
  constructor(analyticsPopUpService, table, getIndicators, onApply) {
    this.table = table
    this.getIndicators = getIndicators
    this.onApply = onApply

    this.service = analyticsPopUpService
    this.validator = new AnalyticsPopUpValidator()
    this.view = new AnalyticsPopUpView(this)

    /** @type {AnalyticsPopUpSessionContext|null} */
    this.sessionContext = null
  }

  /**
   * Контекст открытой сессии попапа (п.18 §1.2; легаси `init` перед render/save).
   *
   * @returns {AnalyticsPopUpSessionContext|null}
   */
  getSessionContext() {
    return this.sessionContext
  }

  /**
   * Запомнить строку, для которой открывают/рисуют форму аналитик.
   *
   * @param {AnalyticsPopUpInitContext} context
   */
  init(context) {
    this.sessionContext = {
      table: this.table,
      rowNumber: context.rowNumber,
      indicatorId: context.indicatorId,
      indicatorName: context.indicatorName != null ? String(context.indicatorName) : '',
      analytics: this._prepareSessionAnalytics(context.analytics),
    }
  }

  /**
   * Загрузить справочник analytics для показателя, если в строке пусто (п.18 §2.5; легаси `loadingAnalysts`).
   *
   * @returns {Promise<{ loaded: boolean, analytics: Object|null }>}
   */
  async ensureAnalyticsLoaded() {
    const ctx = this.sessionContext

    if (!ctx) {
      return { loaded: false, analytics: null }
    }

    if (!this._isAnalyticsEmpty(ctx.analytics)) {
      return { loaded: false, analytics: ctx.analytics }
    }

    const analytics = await this.service.loadAnalyticsDictionary(ctx.indicatorId, this.table)

    this.sessionContext = {
      ...ctx,
      analytics: { ...analytics },
    }

    return { loaded: true, analytics: this.sessionContext.analytics }
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  _prepareSessionAnalytics(analytics) {
    if (this._isAnalyticsEmpty(analytics)) {
      return {}
    }

    return this._normalizeAnalytics(analytics)
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {boolean}
   */
  _isAnalyticsEmpty(analytics) {
    return analytics == null || typeof analytics !== 'object' || Object.keys(analytics).length === 0
  }

  /**
   * @param {Object|null|undefined} analytics
   * @returns {Object}
   */
  _normalizeAnalytics(analytics) {
    if (this._isAnalyticsEmpty(analytics)) {
      return {}
    }

    const result = {}

    Object.keys(analytics).forEach((key) => {
      if (analytics[key] != null) {
        result[key] = String(analytics[key])
      }
    })

    return result
  }

  /**
   * Загрузить опции полей и отрисовать форму (п.18 §3.2; легаси `render` перед `openModal`).
   *
   * @returns {Promise<void>}
   */
  async renderForm() {
    const ctx = this.sessionContext

    if (!ctx || ctx.analytics == null) {
      return
    }

    await this.service.loadFieldOptions()

    const fields = Object.keys(ctx.analytics).map((fieldName) => ({
      fieldName,
      label: this.service.getFieldLabel(fieldName),
      value: ctx.analytics[fieldName],
      options: this.service.getSelectItems(fieldName) || [],
    }))

    this.view.render({
      table: ctx.table,
      rowNumber: ctx.rowNumber,
      indicatorName: ctx.indicatorName,
      fields,
    })
  }

  /**
   * «Сохранить» в модалке: collect → validate → `onApply` → `closeModal` (п.18 §3.4–3.6; легаси save handler).
   */
  async handleSave() {
    const ctx = this.sessionContext

    if (!ctx) {
      return
    }

    const collected = this.view.collectFormFieldValues()

    if (collected == null) {
      return
    }

    const analytics = this._buildAnalyticsFromForm(collected, ctx.analytics)
    const check = this.validator.validateFormState({
      table: ctx.table,
      rowNumber: ctx.rowNumber,
      analytics,
    })

    if (!check.isValid) {
      return
    }

    await Promise.resolve(this.onApply(ctx.rowNumber, analytics))
    this.closeModal()
  }

  /**
   * @param {{ table: string, rowNumber: number, fields: Array<{ fieldName: string, selectVal: Array }> }} collected
   * @param {Object} sessionAnalytics
   * @returns {Object}
   */
  _buildAnalyticsFromForm(collected, sessionAnalytics) {
    const analytics = { ...sessionAnalytics }

    collected.fields.forEach(({ fieldName, selectVal }) => {
      if (analytics[fieldName] === undefined) {
        return
      }

      if (selectVal.length > 0) {
        analytics[fieldName] = selectVal[0].text.split('#;')[0]
      } else {
        analytics[fieldName] = this._defaultAnalyticsFieldValue(collected.table, fieldName)
      }
    })

    return analytics
  }

  /**
   * Дефолт при пустом Select2 (легаси save handler).
   *
   * @param {string} table
   * @param {string} fieldName
   * @returns {string}
   */
  _defaultAnalyticsFieldValue(table, fieldName) {
    if (table === 'Input' || (table === 'Output' && fieldName === 'trCurrency')) {
      return '-1'
    }

    if (table === 'Output') {
      return '0'
    }

    return '-1'
  }

  openModal() {
    this.view.openModal()
  }

  closeModal() {
    this.view.closeModal()
  }
}
