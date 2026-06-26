/**
 * Класс для работы с комбо-справочником измерений.
 * Зависимость от Metabase передаётся через конструктор.
 */
export function DimComboClass(metabase) {
	this.metabase = metabase;
	this.settings = null;
	this.dimSrv = null;
	this.dim = null;
	this.dimCombo = null;
}

// Открываем справочник
DimComboClass.prototype.open = function (objKey, _params) {
	var self = this;
	this.settings = {};
	this.settings.DimCombo = $.extend({},
		{
			ParentNode: document.body,
			Width: $(document.body).width(),
			Height: $(document.body).height(),
			Callback: function () { },
			TreeOpened: function () { },
			ObjParams: null,
			OnLoad: function (id) { },
			OnSelectonChanged: function (keys) { }
		}, _params);

	var mb = this.metabase && this.metabase.Mb;
	if (!mb) throw new Error("DimCombo: metabase not opened");
	this.dimSrv = new PP.Mb.DimSrv({ Metabase: mb });

	this.dimSrv.DimOpened.add(
		function (sender, args) {
			self.settings.DimCombo.OnLoad(self.settings.DimCombo.Id);

			if (self.settings.DimCombo.Callback)
				self.settings.DimCombo.Callback();
		}
	);

	// если открываем с параметрами
	if (this.settings.DimCombo.ObjParams) {
		var paramValues = [];
		var params = this.settings.DimCombo.ObjParams;
		for (var i = 0; i < params.length; i++) {
			var paramName = params[i].Id;
			var value = params[i].Value;
			var param = new PP.Mb.Param({
				Key: Number.MAX_SAFE_INTEGER,
				Id: paramName,
				Value: value,
				Type: params[i].Type
			});
			paramValues.push(param);
		}
		var pattern = {
			getDescr: true,
			getAttrs: true,
			getLevs: true,
			getHiers: true,
			getGroups: true,
			getSchemas: true,
			getSelection: true
		};

		this.dim = self.dimSrv.open(
			objKey,
			false,
			true,
			pattern,
			function (sender, args) { },
			paramValues
		);
	} else {
		this.dim = self.dimSrv.open(objKey, true, true);
	}

	// Создаем экземпляр компонента DimensionCombo
	this.dimCombo = new PP.Mb.Ui.DimCombo({
		TreeView: {
			Source: self.dim, Service: self.dimSrv,
			MultiSelect: self.settings.DimCombo.MultiSelect,
			Width: self.settings.DimCombo.Width
		},
		Width: self.settings.DimCombo.Width,
		ParentNode: self.settings.DimCombo.ParentNode,
	});

	this.dimCombo.ComboOpened.add(function (sender, args) {
		if (self.settings.DimCombo.TreeOpened)
			self.settings.DimCombo.TreeOpened();
	});

	if (self.settings.DimCombo.MultiSelect == false) {
		this.dimCombo.getTreeView().setSelectionMode(PP.Ui.TreeListSelectionMode.SingleSelect);
	}

	this.dimCombo.getTreeView().getControl().SelectionChanged.add(function (sender, args) {
		var selectedKeys = args.Node;
		var select = args.Value;
		self.settings.DimCombo.OnSelectonChanged(selectedKeys, select, sender, args);
	});
};

/**
 * Создает экземпляр DimCombo, открывает справочник в указанном DOM-узле.
 * @param {Object} metabase - экземпляр Metabase (должен быть открыт)
 */
DimComboClass.openInNode = function (metabase, dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
	var combo = new DimComboClass(metabase);
	var node = divId != null ? document.getElementById(divId) : null;
	var tempNode = null;
	if (!node) {
		tempNode = document.createElement("div");
		tempNode.id = "DimCombo_temp_" + (Date.now ? Date.now() : Math.random());
		tempNode.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden;";
		if (document.body) document.body.appendChild(tempNode);
		node = tempNode;
	} else {
		$(node).empty();
	}

	isMultiSelect = isMultiSelect ?? false;

	var settings = {
		ParentNode: node,
		Width: node === tempNode ? 1 : $(node).width(),
		Height: node === tempNode ? 1 : $(node).height(),
		ObjParams: _params,
		OnSelectonChanged: onselectionChange,
		MultiSelect: isMultiSelect,
		Callback: function () { },
		OnLoad: onLoad || function () { },
		TreeOpened: function () { },
	};
	combo.open(dimKey, settings);

	if (tempNode && combo._tempContainer !== true) {
		combo._tempContainer = tempNode;
	}

	return combo;
};

/**
 * Открывает комбо-справочник в указанном узле. Используется как фабрика с подставленным metabase.
 * @param {Object} metabase - экземпляр Metabase
 */
export function openDimCombo(metabase, dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad) {
	return DimComboClass.openInNode(metabase, dimKey, divId, _params, onselectionChange, isMultiSelect, onLoad);
}
