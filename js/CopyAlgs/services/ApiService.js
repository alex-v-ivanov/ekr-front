import { foreKeys, apiStatuses } from "../constants.js";

export class ApiService {
    constructor(bi) {
        this.bi = bi;
        this.foreKeys = foreKeys;
    }

    async getSystemState() {
        return this._callModule("GetSystemState", null);
    }

    async getAlgCopiesList() {
        return this._callModule("GetAlgCopiesList", null);
    }

    async createAlgCopy(comment) {
        const args = [
            this.bi.OpenArgs("Comment", comment, this.bi.ItDataType.String)
        ];
        return this._callModule("AlgMakeCopy", args);
    }

    async deleteAlgFolder(folderId) {
        const args = [
            this.bi.OpenArgs("FolderID", folderId, this.bi.ItDataType.String)
        ];
        return this._callModule("DeleteAlgFolder", args);
    }

    async restoreAlgFolder(folderId = null) {
        const restoreOriginal = folderId === "ORIGINAL";
        const methodName = restoreOriginal ? "RestoreOriginalAlgFolder" : "CopyAlgFolder";
        const args = restoreOriginal ? null : [
            this.bi.OpenArgs("SrcFolderID", folderId, this.bi.ItDataType.String)
        ];
        
        return this._callModule(methodName, args);
    }

    async getUserInfo() {
        return this.bi.GetMbSec();
    }

    // Приватный метод для вызова модулей
    async _callModule(methodName, args) {
        try {
            const response = await this.bi.getResultForeModule({
                moduleKey: this.foreKeys.DK_EKR_COPY_ALGS_M,
                methodName: methodName,
                args: args
            });

            if (response === apiStatuses.ERROR_LOWER) {
                throw new Error("API недоступен");
            }

            if (response.faultstring?.length > 0) {
                throw new Error(response.faultstring);
            }

            return response;
        } catch (error) {
            console.error(`API Error in ${methodName}:`, error);
            throw error;
        }
    }
}