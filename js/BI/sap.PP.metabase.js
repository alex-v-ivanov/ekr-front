/**
 * Класс подключения к метабазе.
 * Зависимости: bi, config (Moniker, ClientServiceUrl, currentPath).
 */
import { CommonMessages } from '../Common/constants.js';

export function MetabaseClass(bi, config) {
	this.bi = bi;
	this.config = config || {};
	this.settings = null;
	this.Mb = null;
	this.IsOpened = false;
}

MetabaseClass.prototype.Open = function (_params) {
	var self = this;
	var currentPath = this.config.currentPath || (typeof window !== "undefined" && window.top && window.top.document && window.top.document.location ? window.top.document.location.pathname.split("/Reports")[0] : "");
	var settings = $.extend({},
		{
			resources: currentPath + "/assets/platform_modules/resources",
			showWaiter: false,
			culture: PP.Cultures.ru,
			_StartRequest: function () {
				var data = {
					Key: -1,
					Type: '',
					MenuKey: -1,
					Moniker: '',
					Id: ''
				};
			},
			_EndRequest: function (sender, args) { },
			_Error: function (sender, args) { },
			_Opened: function () { },
			saveToCookie: false,
			ImagePath: currentPath + "/assets/platform_modules/build/img",
			ScriptPath: currentPath + "/assets/platform_modules/build/",
			CSSPath: currentPath + "/assets/platform_modules/build/",
			Moniker: this.config.Moniker,
			MbId: undefined,
			UserCreds: {
				UserName: undefined,
				Password: undefined
			},
			PPServiceUrl: this.config.ClientServiceUrl,
		}, _params);
	self.settings = settings;

	PP.ImagePath = settings.ImagePath;
	PP.ScriptPath = settings.ScriptPath;
	PP.CSSPath = settings.CSSPath;
	PP.resourceManager.setRootResourcesFolder(settings.resources);
	PP.resourceManager.setResourceList(['PP', 'Metabase', 'Regular', 'VisualizerMaster', 'Demo', 'Express', 'Kap', 'MF', 'MS',
		'Navigator', 'Ts', 'TSheetMaster', 'Ufe', 'Vf', 'Dictionaries', 'Dm', 'Workspace']);
	PP.setCurrentCulture(settings.culture);

	if (self.settings.Moniker == undefined) {
		debugWarn("Не задан моникер!");
	} else {
		self.Mb = self._OpenByMoniker();
		self.settings._Opened();
		self.IsOpened = true;
	}
	return this;
};

MetabaseClass.prototype._OpenByMoniker = function () {
	var self = this;
	var waiter;
	if (self.settings.showWaiter)
		waiter = new PP.Ui.Waiter();
	var metabase = new PP.Mb.Metabase({
		PPServiceUrl: self.settings.PPServiceUrl,
		ConnectionOdId: self.settings.Moniker,
		StartRequest: function (sender, args) {
			if (self.settings.showWaiter)
				waiter.show();
			self.settings._StartRequest(sender, args);
		},
		EndRequest: function (sender, args) {
			self.settings._EndRequest(sender, args);
			if (self.settings.showWaiter)
				waiter.hide();
		},
		Opened: function () {
			self.settings._Opened(sender, args);
		}
	});
	return metabase;
};

MetabaseClass.prototype.GetStatus = function (callback) {
	var self = this;
	this.bi.GetStatus().then(function (x) {
		if (x.Fault) {
			if (self.common && self.common.showDialog) self.common.showDialog(CommonMessages.SESSION_EXPIRED);
			if (self.common && self.common.StatusId != undefined) clearInterval(self.common.StatusId);
		}
		if (callback) callback(x);
	});
};

MetabaseClass.prototype.setCommon = function (common) {
	this.common = common;
};
