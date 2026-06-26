/**
 * Сервис для работы с API Форсайт.
 * Конструктор принимает окружение (нужны Moniker доступа и ClientServiceUrl).
 */

export class Foresight {
	constructor(config) {
        this._moniker = config.Moniker;
        this._clientServiceUrl = config.ClientServiceUrl;
    };

	static ItDataType = {
        NoData: 0,
        String: 1,
        Integer: 2,
        Float: 3,
        DateTime: 4,
        Blob: 5,
        Boolean: 6,
        Date: 7,
        Tree: 8
    };

	static OpenArgs = function (id, value, type) {
		return {
			dt: type,
			id: id,
			n: id,
			k: Number.MAX_SAFE_INTEGER,
			vis: true,
			value: value
		};
	};   
	
	getResultForeModule = async function (ctx) {
		let rez = "";
		let _params = {
			"ForeExec": {
				"tFore": { "id": `${this._moniker}!${ctx.moduleKey}` },
				"tArg": { "methodName": `${ctx.methodName}` }
			}
		};

		if (ctx.args?.length > 0) {
			_params.ForeExec.tArg["args"] = { "it": ctx.args };
		}

		await fetch(this._clientServiceUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json;charset=utf-8' },
			body: JSON.stringify(_params)
		}).then(x => x.json()).then(x => {
			if (x.Fault?.faultstring) {
				rez = x.Fault;
				debugError(`getResultForeModule in modyle ${ctx.moduleKey} method '${ctx.methodName}'`, x.Fault.faultstring);
			} else if (x.ForeExecResult?.result.length == 0) {
				rez = "error";
				debugError(`getResultForeModule in modyle ${ctx.moduleKey} method '${ctx.methodName}' empty result!`);
			} else if (x.ForeExecResult.result.toLowerCase() == "ok") {
				rez = "ok";
			} else if (x.ForeExecResult.result.toLowerCase() == "error") {
				rez = "error";
				debugError(`getResultForeModule in modyle ${ctx.moduleKey} method '${ctx.methodName}'`, x.ForeExecResult.result);
			} else {
				rez = JSON.parse(x.ForeExecResult.result);
			}
		}).catch(err => {
			debugError("getResultForeModule", err);
			if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
		});
		return rez;
	};
}