sap.ui.define([
	"com/gasco/Inbound/controller/Inbound/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("com.gasco.Inbound.controller.Inbound.Detail_Zero", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			//this._route.getRoute("Recepciones_Master").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
			} else {
				this.onBackMenu();
			}
		}

	});

});