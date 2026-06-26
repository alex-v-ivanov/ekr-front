/**
 * Сервис для работы с API Форсайт.
 * Конструктор принимает окружение (нужны Moniker доступа и ClientServiceUrl).
 */

//import { CommonMessages } from '../Common/constants.js';

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


Foresight.prototype.getStressId = async function (ctx) {
	await fetch(this._clientServiceUrl, {
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
	})
		.then(res => res.json())
		.then(res => debugLog(res, ' test fetch id res'))
		.catch(err => {
			debugError("getStressId", err);
			if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
		});
	debugLog(ctx, 'context - url - ', this._clientServiceUrl);
	return '777777-123123';
};

Foresight.prototype.openRds = async function (ctx) {
	debugLog("openRds");
	let rez = "";
	let _params = {
		"OpenRds": {
			"tOb": { "id": `${this._moniker}!${ctx.rdsKey}` },
			"tArg": {
				"args": {
					"args": { "it": [] },
					"openForEdit": false,
					"setDefaultDateTimeParamValues": true,
					"fetchAll": true
				},
				"metaGet": { "attrs": "Get" }
			}
		}
	};
	if (ctx.params?.length > 0) {
		ctx.params.forEach(element => {
			_params.OpenRds.tArg.args.args.it.push(element);
		});
	}
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		if (x.Fault?.faultstring) {
			rez = "error";
			debugError("openRds ", x.Fault.faultstring);
		} else {
			rez = x.OpenRdsResult;
		}
	}).catch(err => {
		debugError("openRds", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.closeRds = async function (ctx) {
	debugLog("closeRds");
	let rez = "";
	let _params = {
		"CloseRds": {
			"tRds": { "id": `${ctx.id}` }
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.CloseRdsResult;
	}).catch(err => {
		debugError("closeRds", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.getRdsElements = async function (ctx) {
	debugLog("GetRdsElements");
	let rez = "";
	let _params = {
		"GetRdsElements": {
			"tRds": { "id": `${ctx.id}` },
			"tArg": {
				"parent": { "key": "" },
				"filter": {
					"levels": "-1",
					"includeRoot": "false",
					"onlySelected": "false",
					"includeParents": "true",
					"includeParentsWithSiblings": "true"
				},
				"pattern": {
					"attributes": "*",
					"attributeValuesOnly": "false",
					"extendedAttributeValuesOnly": "true",
					"getSelectState": "true",
					"getParentKey": "true",
					"getHasChildren": "true",
					"getLevel": "true",
					"getHasSelectedChildren": "true",
					"getHistory": "true",
					"getImageIndex": "true"
				}
			}
		}
	};
	if (ctx.filter != undefined) {
		_params.GetRdsElements.tArg = {
			filter: {
				text: {
					"caseSensitive": false,
					"wholeWordsOnly": false,
					"attrIds": { "it": [{ "id": ctx.filter.attrId }] },
					"text": ctx.filter.text
				}
			}
		};
	}
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.GetRdsElementsResult;
	}).catch(err => {
		debugError("getRdsElements", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.GetStatus = async function (ctx) {
	debugLog("GetStatus");
	let rez = "";
	let _params = {
		"GetStatus": {
			"tArg": {
				"metabase": { "id": `${this._moniker}` }
			}
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x;
	}).catch(err => {
		debugError("GetStatus", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.GetMbSec = async function (ctx) {
	debugLog("GetMbSec :" + this._moniker);
	let rez = "";
	let _params = {
		"GetMbSec": {
			"tMbSec": { "id": `${this._moniker}` },
			"tArg": {
				"pattern": {
					"profiles": "Get",
					"profilesFilter": { "current": "true" },
					"groups": "Get",
					"groupsFilter": { "current": "true" }
				}
			}
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.GetMbSecResult;
	}).catch(err => {
		debugError("GetMbSec", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.openDim = async function (ctx) {
	debugLog("openDim");
	let rez = "";
	let _params = {
		"OpenDim": {
			"tObject": { "id": `${this._moniker}!${ctx.dimKey}` },
			"tArg": {
				"openArgs": "",
				"metaArg": {
					"pattern": {
						"obInst": "false",
						"getDescr": "true",
						"getAttrs": "true"
					},
					"elsArg": {
						"pattern": {
							"attributes": "*",
							"getParentKey": "true",
							"getImageIndex": "true"
						}
					}
				}
			}
		}
	};
	if (ctx.params?.length > 0) {
		_params.OpenDim.tArg.openArgs = { args: { "it": [] } };
		ctx.params.forEach(element => {
			_params.OpenDim.tArg.openArgs.args.it.push(element);
		});
	}
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		if (x.Fault?.faultstring) {
			rez = "error";
			debugError("openDim", x.Fault.faultstring);
		} else {
			rez = x.OpenDimResult;
		}
	}).catch(err => {
		debugError("openDim", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.closeDim = async function (ctx) {
	debugLog("closeDim");
	let rez = "";
	let _params = {
		"CloseDim": {
			"tDim": { "id": `${ctx.id}` }
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.CloseDimResult;
	}).catch(err => {
		debugError("closeDim", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.clearCache = async function (ctx) {
	debugLog("clearCache");
	let rez = "";
	let _params = {
		"GetObjects": {
			"tArg": {
				"refresh": { "cache": { "all": true }, "all": true },
				"range": { "count": 0 }
			},
			"tFilter": { "levels": 1 },
			"tParent": { "id": `${this._moniker}!Root` }
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.GetObjectsResult;
	}).catch(err => {
		debugError("clearCache", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.getFiltredDimElements = async function (ctx) {
	let rez = "";
	let _params = {
		"GetDimElements": {
			"tDim": { "id": `${ctx.key}` },
			"tArg": {
				"pattern": {
					"getLevel": "true",
					"getImageIndex": "true",
					"attributes": "*",
					"attributeValuesOnly": "false"
				}
			}
		}
	};
	if (ctx.attrId?.length > 0 && ctx.filter?.length > 0) {
		_params.GetDimElements.tArg["filter"] = {
			"text": {
				"attributes": ctx.attrId,
				"text": ctx.filter,
				"wholeWordsOnly": "false",
				"caseSensitive": "false"
			},
			"includeParents": "true",
			"includeParentsWithSiblings": "true"
		};
	}
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		rez = x.GetDimElementsResult.els.e;
	}).catch(err => {
		debugError("getFiltredDimElements", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.openQuery = async function (ctx) {
	let rez = "";
	let _params = {
		"GetQuery": {
			"tOb": { "id": `${this._moniker}!${ctx.rdsKey}` },
			"tArg": {
				"pattern": {
					"obInst": "true",
					"fields": "true",
					"rows": "Get",
					"sqlText": "true"
				}
			}
		}
	};
	await fetch(this._clientServiceUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json;charset=utf-8' },
		body: JSON.stringify(_params)
	}).then(x => x.json()).then(x => {
		if (x.Fault?.faultstring) {
			rez = "error";
			debugError("openQuery ", x.Fault.faultstring);
		} else {
			rez = x.OpenRdsResult;
		}
	}).catch(err => {
		debugError("openQuery", err);
		if (typeof window !== "undefined" && window.Common && window.Common.showDialog) window.Common.showDialog(CommonMessages.REQUEST_ERROR);
	});
	return rez;
};

Foresight.prototype.updateFromConfig = function (config) {
	if (config) {
		this.config = config;
		this._moniker = config.Moniker;
		this._clientServiceUrl = config.ClientServiceUrl;
	}
};
