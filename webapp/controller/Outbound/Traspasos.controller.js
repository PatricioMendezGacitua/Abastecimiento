sap.ui.define([
	"com/gasco/Inbound/controller/Outbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Inbound.controller.Outbound.Traspasos", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("traspaso").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			this.valuePos = 0;
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this.flagIngresoPos = false;

			this.objectFragment = [{
				"id": "oInputCantidadTraspasoId",
				"required": true,
				"type": "ip"
			}, {
				"id": "idPosTraspasoAlmacenIngresar",
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
				"id": "oTextAreaObservacion",
				"required": false,
				"type": "ip"
			}];
			var modeloPosTraspaso = new JSONModel([]);
			this.getView().setModel(modeloPosTraspaso, "oModelPosTraslado");

			var arrPicker = [{
				id: "oDatePickerFCTraspaso",
				type: "date"
			}];

			this.functionDisablePicker(arrPicker);

			var oDatePickerFecha = this.getView().byId("oDatePickerFCTraspaso");
			var hoy = new Date();
			var unMesesEnMilisegundos = 2629750000;
			//var dosMesesEnMilisegundos = 5259500000;
			//var tresMesesEnMilisegundos = 7889250000;
			var resta = hoy.getTime() - unMesesEnMilisegundos; //getTime devuelve milisegundos de esa fecha

			var primerDiaDelMes = new Date(resta);
			primerDiaDelMes = primerDiaDelMes.setDate(1);
			//primerDiaDelMes = new Date(primerDiaDelMes);

			var fechaHaceTresMesesEnMilisegundos = new Date(primerDiaDelMes);
			oDatePickerFecha.setMinDate(new Date(fechaHaceTresMesesEnMilisegundos));
			oDatePickerFecha.setDateValue(hoy);
			oDatePickerFecha.setMaxDate(hoy);

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
							"id": "oTextAreaObservacion",
							"required": false,
							"type": "ip"
						}];
			
					} else {
						this.onBackMenu();
					}*/

		},

		onPressedDeleteMode: function (oEvent) {
			var oList = this.getView().byId("idtableLPTraspaso");
			var mode = "None";

			if (oEvent.getSource().getPressed()) {
				mode = "Delete";
			}

			oList.setMode(mode);
		},

		countTitleLPTraspaso: function (oEvent) {
			var oList = this.getView().byId("idtableLPTraspaso");
			var cantidadItems = oList.getItems().length;
			this.getView().byId("oTitleIdLPHI").setText("Posiciones (" + cantidadItems + ")");

			var oToggleButtonEliminar = this.getView().byId("oToggleButtonEliminarId");

			if (cantidadItems === 0) {
				oList.setMode("None");
				oToggleButtonEliminar.setPressed(false);
				oToggleButtonEliminar.setEnabled(false);
			} else {
				oToggleButtonEliminar.setEnabled(true);
				var oModelPosTraslado = this.getView().getModel("oModelPosTraslado");
				this.valuePos = 0;
				oModelPosTraslado.getData().forEach(function (element) {
					this.valuePos = this.valuePos + 10;
					element.pos = this.valuePos;
				}.bind(this));
				oModelPosTraslado.refresh();
			}

		},

		onDeletePosTraspaso: function (oEvent) {
			var binding = oEvent.getParameters().listItem.getBindingContext("oModelPosTraslado");
			var oModelPosTraslado = this.getView().getModel("oModelPosTraslado");
			var path = binding.getPath();
			var pos = path.replace("/", "");
			pos = Number(pos);
			MessageBox["information"]("¿Seguro que deseas eliminar está posición?", {
				title: "Aviso",
				actions: ["Si", "No"],
				onClose: function (oAction) {
					if (oAction === "Si") {
						oModelPosTraslado.getData().splice(pos, 1);
						oModelPosTraslado.refresh();
					}
				}.bind(this)
			});
		},

		onAddPositionTraspaso: function () {
			var numeroCentro = this.getView().byId("oInputCentroCTraspaso");
			var numeroAlmacen = this.getView().byId("oInputAlmacenCTraspaso");
			if (numeroAlmacen.getValue().length > 0) {
				this._oViewAddPosTraspasoDialog = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.addPosTraspaso", this);

				this._oViewAddPosTraspasoDialog.attachAfterClose(function () {
					this._oViewAddPosTraspasoDialog.destroy();
				}.bind(this));
				this.getView().addDependent(this._oViewAddPosTraspasoDialog);

				var modelAyudaMateriales = new JSONModel([]);
				this._oViewAddPosTraspasoDialog.setModel(modelAyudaMateriales, "modelAyudaMateriales");

				this._oViewAddPosTraspasoDialog.open();
				var searchFieldCodigoMaterial = sap.ui.getCore().byId("idPosTraspasoCodMatIngresar");
				searchFieldCodigoMaterial.setBusy(true);
				this.getMaterialesPorCentroERP(numeroCentro.getValue()).then(function (resultado) {
					modelAyudaMateriales.setData(resultado);
					modelAyudaMateriales.refresh();
					if (resultado.length > 100) {
						modelAyudaMateriales.setSizeLimit(resultado.length);
					}
					searchFieldCodigoMaterial.setBusy(false);
				}.bind(this));
			} else {
				numeroAlmacen.setValueState("Error");
				MessageToast.show("Seleccione un centro y almacén para continuar.");
				jQuery.sap.delayedCall(3000, this, function () {
					numeroAlmacen.setValueState("None");
				}.bind(this));
			}

		},

		onInsertarPosTraspasoClose: function (oEvent) {
			this._oViewAddPosTraspasoDialog.destroy();
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

		onInsertarPosTraspasoAdd: function (oEvent) {
			if (!this.validar(this.objectFragment, "", "")) {
				this.valuePos = this.valuePos + 10;
				var oVboxLote = sap.ui.getCore().byId("oVboxLoteId");
				//this.openBusyDialog();
				var arrPosTraspaso = {
					"codMaterial": sap.ui.getCore().byId("idPosTraspasoCodMatIngresar").getValue(),
					"pos": this.valuePos,
					"denMaterial": this.denMaterial,
					"uni_medida": this.unidad,
					"almacen": sap.ui.getCore().byId("idPosTraspasoAlmacenIngresar").getValue(),
					"cantidad": sap.ui.getCore().byId("oInputCantidadTraspasoId").getValue(),
					"visibleLote": oVboxLote.getVisible(),
					"lote": ""
				};

				var model = this.getView().getModel("oModelPosTraslado");
				model.getData().push(arrPosTraspaso);
				model.refresh();

				sap.ui.getCore().byId("idVboxFrag").setVisible(false);

				this.onInsertarPosTraspasoClose();

			} else {
				MessageToast.show("Complete los datos obligatorios.");
				jQuery.sap.delayedCall(3000, this, function () {
					this.quitarState(this.objectFragment, "");
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

						this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");

						this._route.navTo("Menu");
					}
				}.bind(this)
			});

		},

		openListAlmacenesCompleta: function (oEvent) {
			this.idAlmacen = oEvent.getSource().getId();
			if (!this._valueDialogListAlmacenes) {
				this._valueDialogListAlmacenes = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.dialogoListAlmacenAll", this);
			}

			var numeroCentro = this.getView().byId("oInputCentroCTraspaso").getValue();
			var modelAlmacenes = new JSONModel([]);
			this._valueDialogListAlmacenes.setModel(modelAlmacenes, "modelAlmacenesC");
			this._valueDialogListAlmacenes.open();
			this._valueDialogListAlmacenes.setBusy(true);

			this.getAlmacenesERP(numeroCentro).then(function (resultado) {
				modelAlmacenes.setData(resultado);
				modelAlmacenes.refresh();
				if (resultado.length > 100) {
					modelAlmacenes.setSizeLimit(resultado.length);
				}
				this._valueDialogListAlmacenes.setTitle("Lista de Almacenes (" + modelAlmacenes.getData().length + ")");
				this._valueDialogListAlmacenes.setBusy(false);
			}.bind(this));

		},

		openListAlmacenFilter: function (oEvent) {
			this.idAlmacen = oEvent.getSource().getId();
			if (!this._valueDialogListAlmacenesFilter) {
				this._valueDialogListAlmacenesFilter = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.dialogoListAlmacenFilter", this);
			}

			var numeroCentro = this.getView().byId("oInputCentroCTraspaso").getValue();
			var numeroAlmacen = this.getView().byId("oInputAlmacenCTraspaso").getValue();
			var modelAlmacenes = new JSONModel([]);
			this._valueDialogListAlmacenesFilter.setModel(modelAlmacenes, "modelAlmacenesC");
			this._valueDialogListAlmacenesFilter.open();
			this._valueDialogListAlmacenesFilter.setBusy(true);

			this.getAlmacenesERP(numeroCentro).then(function (resultado) {
				var resultadoF = [];
				resultado.forEach(function (element) {
					if (element.Lgort !== numeroAlmacen) {
						resultadoF.push(element);
					}
				}.bind(this));
				modelAlmacenes.setData(resultadoF);
				modelAlmacenes.refresh();
				if (resultado.length > 100) {
					modelAlmacenes.setSizeLimit(resultado.length);
				}
				this._valueDialogListAlmacenesFilter.setTitle("Lista de Almacenes (" + modelAlmacenes.getData().length + ")");
				this._valueDialogListAlmacenesFilter.setBusy(false);
			}.bind(this));

		},

		openListCentrosCompleta: function (oEvent) {

			this.idCentro = oEvent.getSource().getId();
			if (!this._valueDialogListCentros) {
				this._valueDialogListCentros = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.dialogoListCentroAll", this);
			}

			var modelCentro = new JSONModel([]);
			this._valueDialogListCentros.setModel(modelCentro, "modelCentroC");
			this._valueDialogListCentros.open();

			var oInputCentroCTraspaso = this.getView().byId("oInputCentroCTraspaso");
			oInputCentroCTraspaso.setValue();

			var oInputAlmacenCTraspaso = this.getView().byId("oInputAlmacenCTraspaso");
			oInputAlmacenCTraspaso.setValue();
			oInputAlmacenCTraspaso.setEditable(false);

			this._valueDialogListCentros.setBusy(true);

			this.getCentrosERP().then(function (resultado) {
				modelCentro.setData(resultado);
				modelCentro.refresh();
				if (resultado.length > 100) {
					modelCentro.setSizeLimit(resultado.length);
				}

				this._valueDialogListCentros.setTitle("Lista de Centros (" + modelCentro.getData().length + ")");
				this._valueDialogListCentros.setBusy(false);
			}.bind(this));

		},

		onValueHelpDialogCloseAlmacen: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {
				if (this.idAlmacen === "idPosTraspasoAlmacenIngresar") {
					sap.ui.getCore().byId(this.idAlmacen).setValue(oSelectedItem.getTitle());
				} else {
					this.getView().byId(this.idAlmacen).setValue(oSelectedItem.getTitle());

					var modeloPosTraspaso = new JSONModel([]);
					this.getView().setModel(modeloPosTraspaso, "oModelPosTraslado");
					modeloPosTraspaso.refresh();
				}
			}
		},

		onValueHelpDialogCloseCentro: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this.getView().byId("oInputCentroCTraspaso").setValue(oSelectedItem.getTitle());
				this.getView().byId("oInputAlmacenCTraspaso").setEditable(true);

				var modeloPosTraspaso = new JSONModel([]);
				this.getView().setModel(modeloPosTraspaso, "oModelPosTraslado");
				modeloPosTraspaso.refresh();
			}
			//this.buttonAsignarAlmacen.setText(this.seleccionAlmacen);
		},
		validar: function (fields, accion, v) {
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

		onSearchAlmacenesTra: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var filterFinal = [];
			if (sValue.trim().length > 0) {
				var oFilterNumeroAlmacen = new sap.ui.model.Filter({
					path: "Lgort",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});
				var oFilterDenominacion = new sap.ui.model.Filter({
					path: "Lgobe",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});

				filterFinal = new sap.ui.model.Filter({
					filters: [oFilterNumeroAlmacen, oFilterDenominacion],
					and: false
				});
			}
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter(filterFinal);
		},

		onSearchAyudaMaterial: function (oEvent) {
			var vboxFrag = sap.ui.getCore().byId("idVboxFrag");
			vboxFrag.setVisible(false);
			var oItem = oEvent.getParameter("suggestionItem");
			var posTraspasoDenMatIngresar = sap.ui.getCore().byId("idPosTraspasoDenMatIngresar");
			var posTraspasoUnMedidaIngresar = sap.ui.getCore().byId("idPosTraspasoUnMedidaIngresar");
			var btIngresarPosTraspaso = sap.ui.getCore().byId("btIngresarPosTraspaso");
			btIngresarPosTraspaso.setEnabled(false);
			posTraspasoDenMatIngresar.setText();
			posTraspasoUnMedidaIngresar.setText();

			var numeroCentro = this.getView().byId("oInputCentroCTraspaso");
			this.flagIngresoPos = false;
			if (oItem) {
				this._oViewAddPosTraspasoDialog.setBusy(true);
				this.getMaterialesPorCodigoMaterialCentroERP(oItem.getKey(), numeroCentro.getValue()).then(function (resultado) {
					this._oViewAddPosTraspasoDialog.setBusy(false);
					console.log(resultado);
					if (resultado.length > 0) {
						this.denMaterial = resultado[0].Maktx;
						posTraspasoDenMatIngresar.setText(this.denMaterial);
						this.unidad = resultado[0].Meins;
						posTraspasoUnMedidaIngresar.setText(this.unidad);
						this.flagIngresoPos = true;
						vboxFrag.setVisible(true);
						btIngresarPosTraspaso.setEnabled(true);
					} else {
						MessageToast.show("No se encontraron resultados para la búsqueda realizada.");
					}
				}.bind(this));
			}
		},

		onSuggestAyudaMaterial: function (event) {
			var sValue = event.getParameter("suggestValue"),
				aFilters = [];
			if (sValue) {
				aFilters = [
					new sap.ui.model.Filter([
						new sap.ui.model.Filter("Maktx", function (sText) {
							return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
						}),
						new sap.ui.model.Filter("Matnr", function (sDes) {
							return (sDes || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
						})
					], false)
				];
			}

			event.getSource().getBinding("suggestionItems").filter(aFilters);
			event.getSource().suggest();
		},

		onSearchCentro: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var filterFinal = [];
			if (sValue.trim().length > 0) {
				var oFilterCentro = new sap.ui.model.Filter({
					path: "Werks",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});
				var oFilterTextoCentro = new sap.ui.model.Filter({
					path: "Name1",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});

				filterFinal = new sap.ui.model.Filter({
					filters: [oFilterCentro, oFilterTextoCentro],
					and: false
				});
			}
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter(filterFinal);
		},

		btnReestablecerTraspaso: function () {
			var oInputCentroCTraspaso = this.getView().byId("oInputCentroCTraspaso");
			var oInputAlmacenCTraspaso = this.getView().byId("oInputAlmacenCTraspaso");
			var oDatePickerFCTraspaso = this.getView().byId("oDatePickerFCTraspaso");
			var oTextAreaObservacion = this.getView().byId("oTextAreaObservacion");
			oInputAlmacenCTraspaso.setEditable(false);
			oInputAlmacenCTraspaso.setValue();
			oInputCentroCTraspaso.setValue();
			oDatePickerFCTraspaso.setValue();
			oTextAreaObservacion.setValue();

			var modeloPosTraspaso = new JSONModel([]);
			this.getView().setModel(modeloPosTraspaso, "oModelPosTraslado");
			modeloPosTraspaso.refresh();
		},

		btnAceptarTraspaso: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			MessageBox.information('¿Seguro deseas traspasar?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");
						var oList = this.getView().byId("idtableLPTraspaso");
						var cantidadItems = oList.getItems().length;
						if (!this.validar(this.InputsViewCabeceraTraslado, "", "vista")) {
							if (cantidadItems > 0) {

								this.getView().setBusy(true);
								var listInventario = this.getView().byId("idtableLPInventario").getItems();

								var oInputDocumentoInventarioTraspaso = this.getView().byId("oInputDocumentoInventarioTraspaso");
								var oInputPeriodo = this.getView().byId("oInputPeriodo");
								var oDatePickerFInv = this.getView().byId("oDatePickerFInv");
								var oInputUsuarioReg = this.getView().byId("oInputUsuarioReg");

								var recordERPCab = {};
								recordERPCab.Ikey = "1";
								recordERPCab.IGjahr = oInputPeriodo.getValue(); //Type="Edm.String" Nullable="false" MaxLength="4" sap:label="Ejercicio"
								recordERPCab.IIblnr = oInputDocumentoInventarioTraspaso.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="10" sap:label="Doc.inventario"
								recordERPCab.IUsuHana = oInputUsuarioReg.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="20" sap:label="Usuario Hana"
								recordERPCab.IZldat = oDatePickerFInv.getDateValue(); //Type="Edm.DateTime" Nullable="false" Precision="7" sap:label="Fe.recuento"
								recordERPCab.NavEjeInventarioPos = [];

								var recordERPCabHana = {};
								recordERPCabHana.Ikey = "1";
								recordERPCabHana.IGjahr = oInputPeriodo.getValue(); //Type="Edm.String" Nullable="false" MaxLength="4" sap:label="Ejercicio"
								recordERPCabHana.IIblnr = oInputDocumentoInventarioTraspaso.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="10" sap:label="Doc.inventario"
								recordERPCabHana.IUsuHana = oInputUsuarioReg.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="20" sap:label="Usuario Hana"
								recordERPCabHana.IZldat = oDatePickerFInv.getDateValue(); //Type="Edm.DateTime" Nullable="false" Precision="7" sap:label="Fe.recuento"
								recordERPCabHana.NavEjeInventarioPos = [];

								var functionRecorrer = function (item, i) {
									if (item.length === i) {

										this.inventariarEnERP(recordERPCab).then(function (respuestaIERP) {
											if (respuestaIERP.resolve) {
												this.inventariarEnHANA(recordERPCabHana).then(function (respuestaIHANA) {
													MessageToast.show("Traspaso Realizado");
													jQuery.sap.delayedCall(3000, this, function () {
														this.btnReestablecerTraspaso();
													}.bind(this));
													this.getView().setBusy(false);
												}.bind(this));
											} else {
												this.getView().setBusy(false);
												MessageToast.show("No fue posible traspasar las posiciones, intente más tarde.");
											}
										}.bind(this));
									} else {

										var recordERPDet = {};
										var recordERPDetHana = {};

										var obj = item[i].getBindingContext("oModelInventario").getObject();
										var pos = item[i].getContent()[0].getContent()[4].getItems()[1];
										this.existePosicionHana(obj.Zeili, recordERPCab.IIblnr, recordERPCab.IGjahr).then(function (existeEnHana) {

											recordERPDet.Ikey = "1"; //Edm.String" Nullable="false" MaxLength="1"
											recordERPDet.Zeili = obj.Zeili; //Edm.String" Nullable="false" MaxLength="3" sap:label="Posición"
											recordERPDet.Matnr = obj.Matnr; //Edm.String" Nullable="false" MaxLength="18" sap:label="Material"
											recordERPDet.Maktx = obj.Maktx; //Edm.String" Nullable="false" MaxLength="40" sap:label="Txt.brv."
											var cantidad = pos.getValue().replace(/,/g, ".");
											recordERPDet.Erfmg = cantidad; //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Ctd.en UME"
											recordERPDet.Erfme = obj.Erfme; //Edm.String" Nullable="false" MaxLength="3" sap:label="UM entrada"
											recordERPDet.Lgpbe = obj.Lgpbe; //Edm.String" Nullable="false" MaxLength="10" sap:label="Ubicación"
											recordERPDet.Werks = obj.Werks; //Edm.String" Nullable="false" MaxLength="4" sap:label="Centro"
											recordERPDet.Lgort = obj.Lgort; //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén"
											recordERPDet.ZeroCount = pos.getValue() === "0" ? "0" : "X"; //Edm.String" Nullable="false" MaxLength="1" sap:label="Recuento cero"
											recordERPDet.ITransaccion = existeEnHana;
											recordERPCab.NavEjeInventarioPos.push(recordERPDet);

											recordERPDetHana = recordERPDet;
											recordERPDetHana.Charg = obj.Charg;
											recordERPCabHana.NavEjeInventarioPos.push(recordERPDetHana);

											i++;
											functionRecorrer(listInventario, i);

										}.bind(this));
									}
								}.bind(this);

								functionRecorrer(listInventario, 0);

							} else {
								MessageToast.show("Ingresa al menos una posición para traspasar");
							}
						} else {
							MessageToast.show("Complete los datos obligatorios.");
							jQuery.sap.delayedCall(3000, this, function () {
								this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");
								this.quitarState(this.InputsViewCabeceraTraslado, "", "vista");
							}.bind(this));
						}
					}
				}.bind(this)

			});
		}

	});

});