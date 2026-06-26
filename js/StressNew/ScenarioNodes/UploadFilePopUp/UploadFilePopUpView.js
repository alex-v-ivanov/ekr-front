/**
 * DOM модалки «Загрузить из Excel» (`#select_UploadFile_block`).
 * jQuery — только здесь; PutBin / SaveExcelDataSet — в controller / service.
 *
 * Legacy: `UploadFilePopUp.init` / `openModal` / `closeModal` в `stress-popups.js`.
 */

/* global $ */

export class UploadFilePopUpView {

  /**
   * @param {import('./UploadFilePopUpController.js').UploadFilePopUpController} controller
   */
  constructor(controller) {
    this.controller = controller
    this.modalEl = null
    this.formEl = null
    this.dropZoneEl = null
    this.fileInputEl = null
    this.excelNameEl = null
    this.$modal = null
    this.$form = null
    this.$dropZone = null
    this.$fileInput = null
    this.$excelName = null
    this.$excelNameWrap = null
    this.$parameterTypeRadios = null
    this.$removeFile = null
    /** @type {boolean} легасi `isRemoveFile` — подавить click по зоне после remove */
    this._skipDropZoneClickOnce = false
    this._bound = false
  }

  /**
   * Привязка модалки, формы загрузки и кнопки «Отправить» (п.19 §1.1).
   *
   * @param {HTMLElement|Document} [root]
   */
  bind(root) {
    const scope = root || document

    this.modalEl =
      scope.querySelector('#select_UploadFile_block') ||
      scope.querySelector('.modal-custom__UploadFile')

    this.formEl = this.modalEl
      ? this.modalEl.querySelector('#uploadForm')
      : null

    this.dropZoneEl = this.formEl
      ? this.formEl.querySelector('.upload-zone_dragover')
      : null

    this.fileInputEl = this.formEl
      ? this.formEl.querySelector('#uploadForm_File')
      : null

    this.excelNameEl = this.formEl
      ? this.formEl.querySelector('#ExcelName')
      : null

    this.$modal = $(this.modalEl)
    this.$form = $(this.formEl)
    this.$dropZone = $(this.dropZoneEl)
    this.$fileInput = $(this.fileInputEl)
    this.$excelName = $(this.excelNameEl)
    this.$excelNameWrap = this.$excelName.parent()
    this.$parameterTypeRadios = this.$form.find('[name="parameterTypeFile"]')
    this.$removeFile = this.$dropZone.find('.removeFile')

    this._stripLegacyOnclick()

    if (this._bound) {
      return
    }

    this._bindDocumentDragDrop()
    this._bindDropZone()
    this._bindFileInputChange()
    this._bindRemoveFileButton()
    this._bindSendButton()
    this._bindCloseButton()
    this._bound = true
  }

  /**
   * Запретить браузерное открытие файла при drop вне зоны (легасi `init` → `document` dragover/drop).
   */
  _bindDocumentDragDrop() {
    $(document)
      .off('dragover.uploadFilePopUp drop.uploadFilePopUp')
      .on('dragover.uploadFilePopUp drop.uploadFilePopUp', (evt) => {
        evt.preventDefault()
        return false
      })
  }

  /**
   * Drag-drop и click по `.upload-zone_dragover` (п.19 §1.2; легасi `init`).
   */
  _bindDropZone() {
    this.$dropZone
      .off('dragenter.uploadFilePopUp')
      .on('dragenter.uploadFilePopUp', function onDragEnter() {
        $(this).addClass('_active')
      })

    this.$dropZone
      .off('dragleave.uploadFilePopUp')
      .on('dragleave.uploadFilePopUp', function onDragLeave() {
        $(this).removeClass('_active')
      })

    this.$dropZone
      .off('drop.uploadFilePopUp')
      .on('drop.uploadFilePopUp', (event) => {
        event.preventDefault()
        $(event.currentTarget).removeClass('_active')
        const file = event.originalEvent?.dataTransfer?.files?.[0]
        if (file) {
          this._applySelectedFile(file, event.originalEvent.dataTransfer.files)
        }
      })

    this.$dropZone
      .off('click.uploadFilePopUp')
      .on('click.uploadFilePopUp', () => {
        if (!this._skipDropZoneClickOnce) {
          this.$fileInput.trigger('click')
        } else {
          this._skipDropZoneClickOnce = false
        }
      })
  }

  /**
   * Выбор файла через `<input type="file">` (п.19 §1.2; легасi `uploadInput.on('change')`).
   */
  _bindFileInputChange() {
    this.$fileInput
      .off('change.uploadFilePopUp')
      .on('change.uploadFilePopUp', (event) => {
        const input = event.currentTarget
        const file = input.files?.[0]
        if (file) {
          this._applySelectedFile(file, input.files)
        }
      })
  }

  /**
   * Крестик сброса файла в зоне (п.19 §1.2; легасi `.removeFile` click → `removeFile`).
   */
  _bindRemoveFileButton() {
    this.$removeFile
      .off('click.uploadFilePopUpRemove')
      .on('click.uploadFilePopUpRemove', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.removeFile()
      })
  }

  /**
   * Отобразить выбранный файл в drag-zone (легасi append `.file_name`, скрыть `.loading__file-Info`).
   *
   * @param {File} file
   * @param {FileList} files
   */
  _applySelectedFile(file, files) {
    this.$dropZone.find('.file_name').remove()
    this.$dropZone.append(
      $('<p>', { text: file.name, class: 'file_name', css: { color: '#000000' } }),
    )
    this.$dropZone.find('.loading__file-Info').css('display', 'none')
    this.$removeFile.addClass('removeFile__active')

    if (this.fileInputEl && files) {
      this.fileInputEl.files = files
    }
  }

  /**
   * Сброс UI выбранного файла (п.19 §1.2; легасi `removeFile`).
   * Состояние строки / sessionContext — в controller.
   */
  removeFile() {
    this.$dropZone.removeClass('_active upload-zone_dragover__error')
    this.$dropZone.find('.file_name').remove()
    this.$removeFile.removeClass('removeFile__active')
    this.$dropZone.find('.loading__file-Info').css('display', 'flex')
    this.$form.find('.form-upload__submit').removeClass('upload-btn-active')
    this._skipDropZoneClickOnce = true
    this.$fileInput.val('')
  }

  /**
   * @returns {File|null}
   */
  getSelectedFile() {
    return this.fileInputEl?.files?.[0] || null
  }

  /**
   * @returns {boolean}
   */
  hasSelectedFile() {
    return (this.fileInputEl?.files?.length || 0) > 0
  }

  /**
   * @returns {string}
   */
  getExcelNameValue() {
    return this.$excelName.val() || ''
  }

  /**
   * Сброс inline-ошибок формы отправки (п.19 §1.5; легасi `send` — removeClass перед upload).
   */
  clearSendValidationErrors() {
    this.$excelNameWrap.removeClass('error')
    this.$dropZone.removeClass('upload-zone_dragover__error')
  }

  /**
   * Inline-ошибки при неполной форме (п.19 §1.5; легасi `send` else-branch).
   * Пустое имя — приоритет; иначе подсветка зоны файла.
   *
   * @param {string} excelNameValue
   * @param {boolean} hasFile
   */
  showSendValidationErrors(excelNameValue, hasFile) {
    this.clearSendValidationErrors()

    if (excelNameValue === '') {
      this.$excelNameWrap.addClass('error')
    } else if (!hasFile) {
      this.$dropZone.addClass('upload-zone_dragover__error')
    }
  }

  /**
   * @returns {1|2}
   */
  getSelectedExcelType() {
    const typeEl = this.$parameterTypeRadios.filter(':checked')
    return typeEl.length > 0 ? Number(typeEl.attr('typeId')) : 1
  }

  /**
   * @param {boolean} disabled
   */
  setSendButtonDisabled(disabled) {
    this.$form.find('[data-btn="copy"]').toggleClass('Disabled', disabled)
  }

  /**
   * Снять legacy onclick на модалке Upload (п.19 §1.6; fallback если HTML ещё с Reports.Stress.*).
   */
  _stripLegacyOnclick() {
    if (!this.$modal || !this.$modal.length) {
      return
    }

    this.$modal.find('[onclick*="uploadFilePopUp"]').removeAttr('onclick')
    this.$modal.find('[data-btn][onclick]').removeAttr('onclick')
  }

  /**
   * Крестик в `.modal-custom__nav` (п.19 §1.3; легасi `Reports.Stress.uploadFilePopUp.closeModal`).
   */
  _bindCloseButton() {
    this.$modal
      .find('.modal-custom__nav > div')
      .not('.modal-custom__title')
      .off('click.uploadFilePopUpClose')
      .on('click.uploadFilePopUpClose', (ev) => {
        ev.preventDefault()
        this.controller.closeModal()
      })
  }

  /**
   * Кнопка «Отправить» (п.19 §1.1; легаси `Reports.Stress.uploadFilePopUp.send`).
   */
  _bindSendButton() {
    this.$form
      .find('[data-btn="copy"]')
      .off('click.uploadFilePopUpSend')
      .on('click.uploadFilePopUpSend', (ev) => {
        ev.preventDefault()
        void this.controller.handleSend()
      })
  }

  /**
   * Показать модалку, pre-select radio, прокрутка вверх (п.19 §1.3–1.4; легасi `openModal`).
   *
   * @param {1|2|number|string} [excelType]
   */
  openModal(excelType = 1) {
    this._selectParameterTypeFile(excelType)
    $('html').animate({ scrollTop: 0 }, 500)
    this.$modal.removeClass('Hidden')
  }

  /**
   * Radio «Скалярный» / «Матрица» (п.19 §1.4; легасi `[name="parameterTypeFile"][typeid]`).
   *
   * @param {*} excelType
   */
  _selectParameterTypeFile(excelType) {
    const type = excelType !== undefined && excelType !== '' ? Number(excelType) : 1
    this.$parameterTypeRadios.filter(`[typeId="${type}"]`).prop('checked', true)
  }

  /**
   * Закрыть модалку и сбросить форму (п.19 §1.3; легасi `closeModal`).
   */
  closeModal() {
    this.clearSendValidationErrors()
    this.$excelName.val('')
    this.$modal.addClass('Hidden')
    this.removeFile()
    this.$form.find('[data-btn="copy"]').removeClass('Disabled')
  }
}
