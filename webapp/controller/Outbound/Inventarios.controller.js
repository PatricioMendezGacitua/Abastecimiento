sap.ui.define([
	"com/gasco/Inbound/controller/Outbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Inbound.controller.Outbound.Inventarios", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("inventario").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this.objectFragment = [{
				"id": "idPosTraspasoCodMat",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoPosicion",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoDenMat",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoUbicacion",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoUnMedida",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoAlmacen",
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
				"id": "oInputDocumentoInventarioTraspaso",
				"required": true,
				"type": "ip"
			}, {
				"id": "oTextAreaObservacion",
				"required": false,
				"type": "ip"
			}];
			this.modeloPosTraspaso = new JSONModel([]);
			this.getView().setModel(this.modeloPosTraspaso, "oModelPosTraslado");

			var arrPicker = [{
				id: "oDatePickerFInv",
				type: "dateMax"
			}];

			this.functionDisablePicker(arrPicker);

		},

		alSeleccionarFechaInv: function (oEvent) {
			var obj = oEvent.getSource().getDateValue();
			var anio = new Date(obj).getFullYear();
			this.getView().byId("oInputPeriodo").setValue(anio);
		},

		countTitleLPInventario: function (oEvent) {

			this.getView().byId("oTitleIdLInventario").setText("Posiciones (" + this.getView().byId("idtableLPInventario").getItems().length +
				")");

		},

		onPressBuscarInventario: function (oEvent) {
			var oInputDocumentoInventario = this.getView().byId("oInputDocumentoInventarioTraspaso");

			if (oInputDocumentoInventario.getValue().trim().length > 0) {
				oInputDocumentoInventario.setEditable(false);
				this.getView().byId("oDatePickerFInv").setEditable(true);
				this.getView().byId("oInputUsuarioReg").setEditable(true);

				this.getView().byId("idCentroInventario").setValue("7110");
				this.getView().byId("idAmacenInventario").setValue("1139");

				var arrInventario = [{
					"Pos": 10,
					"Material": "103032",
					"Ubicacion": "1130",
					"DenMaterial": "Conector Codo macho 6 mm",
					"Centro": 7110,
					"Almacen": 1130,
					"CantEntrega": 5,
					"UM": "C/U",
					"CtdPicking": 0,
					"Lote": "",
					"Fecha_Picking": "25.05.2021"
				}, {
					"Pos": 20,
					"Material": "115009",
					"Ubicacion": "1150",
					"DenMaterial": "Union Tee 4 mm",
					"Centro": 7110,
					"Almacen": 1130,
					"CantEntrega": 5,
					"UM": "C/U",
					"CtdPicking": 0,
					"Lote": 15,
					"Fecha_Picking": "25.05.2021"
				}, {
					"Pos": 30,
					"Material": "101166",
					"Ubicacion": "1160",
					"DenMaterial": "GOLILLA ACRILONITRILO 23",
					"Centro": 7110,
					"Almacen": 1130,
					"CantEntrega": 7,
					"UM": "C/U",
					"CtdPicking": 0,
					"Lote": "",
					"Fecha_Picking": "25.05.2021"
				}];

				arrInventario.forEach(function (element) {
					if (element.Lote === "") {
						element.visibleLote = false;
					} else {
						element.visibleLote = true;
					}
				}.bind(this));

				var model = new JSONModel(arrInventario);
				this.getView().setModel(model, "oModelInventario");
			} else {
				oInputDocumentoInventario.setValueState("Error");
				MessageToast.show("Ingrese un documento inventario para la búsqueda");
				jQuery.sap.delayedCall(3000, this, function () {
					oInputDocumentoInventario.setValueState("None");
				}.bind(this));
			}

		},

		btnReestablecerInventario: function (oEvent) {
			var oInputDocumentoInventario = this.getView().byId("oInputDocumentoInventarioTraspaso");
			this.getView().byId("idCentroInventario").setValue();
			this.getView().byId("idAmacenInventario").setValue();
			this.getView().byId("oDatePickerFInv").setEditable(false);
			this.getView().byId("oInputUsuarioReg").setEditable(false);
			var model = new JSONModel([]);

			this.getView().setModel(model, "oModelInventario");
			this.getView().getModel("oModelInventario").refresh();

			oInputDocumentoInventario.setEditable(true);
			oInputDocumentoInventario.setValue("");
			this.getView().byId("oDatePickerFInv").setValue("");
			this.getView().byId("oInputPeriodo").setValue("");
			this.getView().byId("oInputUsuarioReg").setValue("");

		},

		btnAceptarInventario: function (oEvent) {
			MessageBox.information('¿Seguro deseas inventariar?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");
						//if (!this.validar(this.InputsViewCabeceraTraslado, "", "vista")) {

						MessageToast.show("Inventario Realizado");
						jQuery.sap.delayedCall(3000, this, function () {

							this.btnReestablecerInventario();
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
						this.btnReestablecerInventario();
						this._route.navTo("Menu");
					}
				}.bind(this)
			});

		}

	});

});