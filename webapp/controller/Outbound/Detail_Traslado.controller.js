sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Abastecimiento.controller.Outbound.Detail_Traslado", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("traslado").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			this.getView().byId("idtableLPTraslado").setVisible(false);

			this.getView().byId("idGridTraslado").setVisible(false);
			this.getView().byId("oTitleIdLTraslado").setVisible(false);
			this.getView().byId("vboxDatePicking").setVisible(false);
			this.getView().byId("btnAceptarTraslado").setEnabled(false);
			this.getView().byId("btnReestablecerTraslado").setEnabled(false);
			this.getView().byId("oButtonBuscarId").setEnabled(true);
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this.objectFragmentTraslado = [{
				"id": "cantPickingTraslado",
				"required": true,
				"type": "ip"
			}];
			this.InputsViewCabeceraTraslado = [{
				"id": "oInputCentroCTraspaso",
				"required": true,
				"type": "ip"
			}, {
				"id": "oInputAlmacenCTraspaso",
				"required": true,
				"type": "ip"
			}, {
				"id": "oDatePickerFCTraspaso",
				"required": true,
				"type": "dt"
			}, {
				"id": "oDatePickerFDTraspaso",
				"required": true,
				"type": "dt"
			}, {
				"id": "oInputGuiaDespachoTraspaso",
				"required": true,
				"type": "ip"
			}, {
				"id": "oTextAreaObservacion",
				"required": false,
				"type": "ip"
			}];
			this.modeloPosTraspaso = new JSONModel([]);
			this.getView().setModel(this.modeloPosTraspaso, "oModelPosTraslado");

			/*if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
						this._oStorage.put("navegacion_IngresoMercaderia", null);
						this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
						this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
			

						this.InputsViewCabeceraTraslado = [{
							"id": "oInputCentroCTraspaso",
							"required": true,
							"type": "ip"
						},
						{
							"id": "oInputAlmacenCTraspaso",
							"required": true,
							"type": "ip"
						},
						{
							"id": "oDatePickerFC",
							"required": true,
							"type": "dt"
						}, {
							"id": "oDatePickerFDTraspaso",
							"required": true,
							"type": "dt"
						}, {
							"id": "oInputGuiaDespachoTraspaso",
							"required": true,
							"type": "ip"
						}, {
							"id": "oTextAreaObservacion",
							"required": false,
							"type": "ip"
						}];
			
					} else {
						this.onBackMenu();
					}*/

		},
		countTitleLPTraslado: function (oEvent) {

			//Actualiza el numero de registros

			this.getView().byId("oTitleIdLTraslado").setText("Posiciones Traslado(" + this.getView().byId("idtableLPTraslado").getItems().length +
				") ");

		},

		onPressBuscarTrapaso: function (oEvent) {

			var sValueNroPedido = this.getView().byId("oInputGuiaDespachoTraspaso").getValue().trim();

			if (sValueNroPedido.length > 0) {

				this.busquedaNroPedido(sValueNroPedido).then(function (respuestaBusquedaNroPedido) {
					this.getView().setBusy(true);
					var datosRespuestaBusqueda = respuestaBusquedaNroPedido.datos;
					if (respuestaBusquedaNroPedido.mensajeError.length > 0) {
						this.getView().byId("oButtonBuscarId").setEnabled(true);
						this.getView().byId("oInputGuiaDespachoTraspaso").setValue();
						MessageToast.show(respuestaBusquedaNroPedido.mensajeError);
						this.getView().setBusy(false);
					} else {
						this.getView().byId("btnAceptarTraslado").setEnabled(true);
						this.getView().byId("btnReestablecerTraslado").setEnabled(true);
						this.getView().byId("oButtonBuscarId").setEnabled(false);

						var model = new JSONModel(datosRespuestaBusqueda);
						this.getView().setModel(model, "oModelTraspaso");
						this.getView().byId("idtableLPTraslado").setVisible(true);
						this.getView().byId("idGridTraslado").setVisible(true);
						this.getView().byId("oTitleIdLTraslado").setVisible(true);
						this.getView().setBusy(false);
					}

				}.bind(this));

			} else {

				MessageToast.show("Debe ingresar un número de pedido de traslado");

			}

			/*		
					this.getView().byId("idtableLPTraslado").setVisible(true);
					this.getView().byId("idGridTraslado").setVisible(true);
					this.getView().byId("oTitleIdLTraslado").setVisible(true);
					this.getView().byId("vboxDatePicking").setVisible(true);
					this.getView().byId("oDatePickerFPickTitulo").setValue("25.05.2021");
					
					
					
					
					var arrTraspaso = [{
						"Pos": 10,
						"Material": "103032",
						"Ubicacion": "1130",
						"DenMaterial": "Conector Codo macho 6 mm",
						"Centro": 7110,
						"Almacen": 1130,
						"CantEntrega": 5,
						"UM" : "C/U",
						"CtdPicking": 0,
						"Lote": "",
						"Fecha_Picking" : "25.05.2021"
					},{
						"Pos": 20,
						"Material": "115009",
						"Ubicacion": "1150",
						"DenMaterial": "Union Tee 4 mm",
						"Centro": 7110,
						"Almacen": 1130,
						"CantEntrega": 5,
						"UM" : "C/U",
						"CtdPicking": 0,
						"Lote": 15,
						"Fecha_Picking" : "25.05.2021"
					},{
						"Pos": 30,
						"Material": "101166",
						"Ubicacion": "1160",
						"DenMaterial": "GOLILLA ACRILONITRILO 23",
						"Centro": 7110,
						"Almacen": 1130,
						"CantEntrega": 7,
						"UM" : "C/U",
						"CtdPicking": 0,
						"Lote": "",
						"Fecha_Picking" : "25.05.2021"
					}];
					
					var model = new JSONModel(arrTraspaso);
					this.getView().setModel(model,"oModelTraspaso");*/

		},

		validarCampos: function (fields, accion, v) {
			var error = false;
			for (var i = 0; i < fields.length; i++) {
				var input = (v === "vista") ? this.getView().byId(fields[i].id + accion) : sap.ui.getCore().byId(fields[i].id + accion);
				if (fields[i].type === "ip") {
					var value = input.getValue();
					if (value === "" || value.trim().length === 0) {
						input.setValueState("Error");
						error = true;
					}
				} else if (fields[i].type === "dt") {
					var value = input.getDateValue();
					if (value === null) {
						input.setValueState("Error");
						error = true;
					}
				} else {
					var value = input.getSelectedKey();
					if (value === null || value.length === 0) {
						input.setValueState("Error");
						error = true;
					}
				}

			}
			return error;
		},

		cerrar: function (fields, accion, v) {
			var error = false;
			for (var i = 0; i < fields.length; i++) {
				var input;
				if (v === "vista") {
					input = this.getView().byId(fields[i].id + accion);

				} else {
					input = sap.ui.getCore().byId(fields[i].id + accion);
				}

				if (fields[i].type === "ip") {
					input.setValue();
				} else if (fields[i].type === "dt") {
					input.setValue();
				} else {
					input.setSelectedKey();
				}
			}
			return error;
		},
		cerrarVista: function (fields, accion) {
			var error = false;
			for (var i = 0; i < fields.length; i++) {
				var input = this.getView().byId(fields[i].id + accion);
				if (fields[i].type === "ip") {
					input.setValue();
				} else if (fields[i].type === "dt") {
					input.setValue();
				} else {
					input.setSelectedKey();
				}
			}
			return error;
		},
		quitarState: function (fields, accion, vista) {
			var error = false;
			for (var i = 0; i < fields.length; i++) {
				var input;
				if (vista === "vista") {
					input = this.getView().byId(fields[i].id + accion);
				} else {
					input = sap.ui.getCore().byId(fields[i].id + accion);
				}
				input.setValueState("None");
			}
			return error;
		},

		btnReestablecerTraslado: function (oEvent) {

			MessageBox.information('¿Seguro deseas Restablecer?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");
						//if (!this.validar(this.InputsViewCabeceraTraslado, "", "vista")) {

						//MessageToast.show("Traslado Efectuado");
						jQuery.sap.delayedCall(3000, this, function () {

							var model = new JSONModel([]);

							this.getView().setModel(model, "oModelTraspaso");
							this.getView().byId("idGridTraslado").setVisible(false);
							this.getView().getModel("oModelTraspaso").refresh();
							this.getView().byId("idtableLPTraslado").setVisible(false);
							this.getView().byId("oInputGuiaDespachoTraspaso").setValue("");

							this.getView().byId("oTitleIdLTraslado").setVisible(false);
							this.getView().byId("vboxDatePicking").setVisible(false);
							this.getView().byId("btnAceptarTraslado").setEnabled(false);
							this.getView().byId("btnReestablecerTraslado").setEnabled(false);
							this.getView().byId("oButtonBuscarId").setEnabled(true);
							//this._route.navTo("Menu");
						}.bind(this));

						/*} else {
							MessageToast.show("Complete los datos obligatorios.");
							jQuery.sap.delayedCall(3000, this, function () {
								this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");
								this.quitarState(this.InputsViewCabeceraTraslado, "", "vista");
							}.bind(this));
						}*/

					}
				}.bind(this)

			});

		},

		btnAceptarTraslado: function (oEvent) {

			if (!this.validarCampos(this.objectFragmentTraslado, "", "vista")) {

				MessageBox.information('¿Seguro deseas trasladar?', {
					title: "Aviso",
					actions: ["Si", "No"],
					styleClass: "",
					onClose: function (sAction) {
						if (sAction === "Si") {
							this._oStorage.put("logeoIngresoMerecaderia", "Si");

							/*	MessageToast.show("Traslado Efectuado");*/
							jQuery.sap.delayedCall(3000, this, function () {

							}.bind(this));

						}
					}.bind(this)

				});

			} else {
				MessageToast.show("Complete los datos obligatorios.");
				jQuery.sap.delayedCall(3000, this, function () {
					this.cerrar(this.objectFragmentTraslado, "", "vista");
					this.quitarState(this.objectFragmentTraslado, "", "vista");
				}.bind(this));
			}

		},
		onBackHomeOutbound: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			MessageBox.information('¿Seguro deseas salir?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");

						this.btnReestablecerTraslado();
						this._route.navTo("Menu");
					}
				}.bind(this)
			});

		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.gasco.Abastecimiento.view.Detail_Traslado
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.gasco.Abastecimiento.view.Detail_Traslado
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.gasco.Abastecimiento.view.Detail_Traslado
		 */
		//	onExit: function() {
		//
		//	}

	});

});