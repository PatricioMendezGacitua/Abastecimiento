sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Abastecimiento.controller.Outbound.Traspasos", {

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
			}, {
				"id": "oSelectLoteId",
				"required": false,
				"type": "sl"
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

			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
				this.btnReestablecerTraspaso();
			} else {
				this.onBackMenu();
			}

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
				this._oViewAddPosTraspasoDialog = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.addPosTraspaso", this);

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
			var oVboxLote = sap.ui.getCore().byId("oVboxLoteId");
			var lote = sap.ui.getCore().byId("oSelectLoteId");
			this.objectFragment[2].required = false;
			var codMaterial = sap.ui.getCore().byId("idPosTraspasoCodMatIngresar").getValue();
			var almacen = sap.ui.getCore().byId("idPosTraspasoAlmacenIngresar").getValue();
			var mensaje = "La combinación material y almacén ya se encuentra creada.";

			if (oVboxLote.getVisible()) {
				this.objectFragment[2].required = true;
				mensaje = "La combinación material,almacén y lote ya se encuentra creada.";
			}

			if (!this.validarT(this.objectFragment, "", "")) {

				var functionFinal = function () {
					this.valuePos = this.valuePos + 10;
					//this.openBusyDialog();
					var arrPosTraspaso = {
						"codMaterial": codMaterial,
						"pos": this.valuePos,
						"denMaterial": this.denMaterial,
						"uni_medida": this.unidad,
						"almacen": almacen,
						"cantidad": sap.ui.getCore().byId("oInputCantidadTraspasoId").getValue(),
						"visibleLote": oVboxLote.getVisible(),
						"lote": ""
					};

					if (oVboxLote.getVisible()) {
						arrPosTraspaso.lote = lote.getSelectedKey();
					}

					var model = this.getView().getModel("oModelPosTraslado");
					model.getData().push(arrPosTraspaso);
					model.refresh();

					sap.ui.getCore().byId("idVboxFrag").setVisible(false);

					this.onInsertarPosTraspasoClose();

				}.bind(this);
				var oModelPosTraslado = this.getView().getModel("oModelPosTraslado").getData();

				if (oModelPosTraslado.length === 0) {
					functionFinal();
				} else {
					var coutnCon = 0;
					oModelPosTraslado.forEach(function (element, index) {

						if (oVboxLote.getVisible()) {
							if (element.codMaterial === codMaterial && element.almacen === almacen && element.lote === lote.getSelectedKey()) {
								coutnCon++;
							}
						} else {
							if (element.codMaterial === codMaterial && element.almacen === almacen) {
								coutnCon++;
							}
						}

						if (oModelPosTraslado.length === (index + 1)) {
							if (coutnCon === 0) {
								functionFinal();
							} else {
								MessageToast.show(mensaje);
							}
						}
					}.bind(this));

				}

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

						this.cerrarT(this.InputsViewCabeceraTraslado, "", "vista");

						this._route.navTo("Menu");
					}
				}.bind(this)
			});

		},

		openListAlmacenesCompleta: function (oEvent) {
			this.idAlmacen = oEvent.getSource().getId();
			if (!this._valueDialogListAlmacenes) {
				this._valueDialogListAlmacenes = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListAlmacenAll", this);
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
				this._valueDialogListAlmacenesFilter = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListAlmacenFilter", this);
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
				this._valueDialogListCentros = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListCentroAll", this);
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

		validarT: function (fields, accion, v) {
			var error = false;
			for (var i = 0; i < fields.length; i++) {
				var input = (v === "vista") ? this.getView().byId(fields[i].id + accion) : sap.ui.getCore().byId(fields[i].id + accion);
				if (fields[i].required) {
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

			}
			return error;
		},

		cerrarT: function (fields, accion, v) {
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
			var oSelectLote = sap.ui.getCore().byId("oSelectLoteId");
			var oModelLotes = new JSONModel([]);
			oSelectLote.setModel(oModelLotes, "oModelLotes");
			var vboxFrag = sap.ui.getCore().byId("idVboxFrag");
			vboxFrag.setVisible(false);
			var oItem = oEvent.getParameter("suggestionItem");
			var posTraspasoDenMatIngresar = sap.ui.getCore().byId("idPosTraspasoDenMatIngresar");
			var posTraspasoUnMedidaIngresar = sap.ui.getCore().byId("idPosTraspasoUnMedidaIngresar");
			var btIngresarPosTraspaso = sap.ui.getCore().byId("btIngresarPosTraspaso");
			btIngresarPosTraspaso.setEnabled(false);
			posTraspasoDenMatIngresar.setText();
			posTraspasoUnMedidaIngresar.setText();

			var oVboxLote = sap.ui.getCore().byId("oVboxLoteId");
			oVboxLote.setVisible(false);

			var numeroCentro = this.getView().byId("oInputCentroCTraspaso");
			this.flagIngresoPos = false;
			if (oItem) {
				this._oViewAddPosTraspasoDialog.setBusy(true);
				this.getMaterialesPorCodigoMaterialCentroERP(oItem.getKey(), numeroCentro.getValue()).then(function (resultado) {
					console.log(resultado);
					if (resultado.length > 0) {
						this.denMaterial = resultado[0].Maktx;
						posTraspasoDenMatIngresar.setText(this.denMaterial);
						this.unidad = resultado[0].Meins;
						posTraspasoUnMedidaIngresar.setText(this.unidad);
						this.flagIngresoPos = true;
						vboxFrag.setVisible(true);
						btIngresarPosTraspaso.setEnabled(true);

						if (resultado[0].Xchpf === "X") {
							oVboxLote.setVisible(true);
							oSelectLote.setBusy(true);
							this.getLoteMaterialesERP(oItem.getKey(), numeroCentro.getValue()).then(function (resultadoLote) {
								oModelLotes.setData(resultadoLote);
								oModelLotes.refresh();
								oSelectLote.setBusy(false);
								this._oViewAddPosTraspasoDialog.setBusy(false);
							}.bind(this));
						} else {
							this._oViewAddPosTraspasoDialog.setBusy(false);
						}

					} else {
						this._oViewAddPosTraspasoDialog.setBusy(false);
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
			this.getView().byId("oPageTraspasoId").scrollTo(0, 0);
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

			var hoy = new Date();
			var unMesesEnMilisegundos = 2629750000;
			//var dosMesesEnMilisegundos = 5259500000;
			//var tresMesesEnMilisegundos = 7889250000;
			var resta = hoy.getTime() - unMesesEnMilisegundos; //getTime devuelve milisegundos de esa fecha

			var primerDiaDelMes = new Date(resta);
			primerDiaDelMes = primerDiaDelMes.setDate(1);
			//primerDiaDelMes = new Date(primerDiaDelMes);

			var fechaHaceTresMesesEnMilisegundos = new Date(primerDiaDelMes);
			oDatePickerFCTraspaso.setMinDate(new Date(fechaHaceTresMesesEnMilisegundos));
			oDatePickerFCTraspaso.setDateValue(hoy);
			oDatePickerFCTraspaso.setMaxDate(hoy);

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
						if (!this.validarT(this.InputsViewCabeceraTraslado, "", "vista")) {
							if (cantidadItems > 0) {

								this.getView().setBusy(true);
								var listInventario = this.getView().byId("idtableLPTraspaso").getItems();

								var oDatePickerFCTraspaso = this.getView().byId("oDatePickerFCTraspaso");
								var oTextAreaObservacion = this.getView().byId("oTextAreaObservacion");
								var oInputCentroCTraspaso = this.getView().byId("oInputCentroCTraspaso");
								var oInputAlmacenCTraspaso = this.getView().byId("oInputAlmacenCTraspaso");

								var recordERPCab = {};
								recordERPCab.Ikey = "1";
								recordERPCab.NavEjeTraspasoPos = [];
								recordERPCab.NavEjeTraspasoDoc = {
									Ikey: "1", // Edm.String" Nullable="false" MaxLength="1"
									EMblnr: "", //Edm.String" Nullable="false" MaxLength="10" sap:label="Doc.material"
									EMjahr: "", //Edm.String" Nullable="false" MaxLength="4" sap:label="Ejerc.doc.mat."
									Type: "", //Edm.String" Nullable="false" MaxLength="1" sap:label="Tipo de mensaje"
									Message: "" //Edm.String" Nullable="false" MaxLength="220" sap:label="Texto mensaje"
								};

								var recordERPCabHana = {};
								recordERPCabHana.Ikey = "1";
								recordERPCabHana.NavEjeTraspasoPos = [];

								var functionRecorrer = function (item, i) {
									if (item.length === i) {

										this.traspasarEnERP(recordERPCab).then(function (respuestaIERP) {
											if (respuestaIERP.resolve) {
												var nroDocumentoSap = respuestaIERP.nroDocumento;
												recordERPCabHana.nroDocumento = nroDocumentoSap;

												this.traspasarEnHANA(recordERPCabHana).then(function (respuestaIHANA) {
													this.datosCreacion = {
														NRO_DOCUMENTO_SAP: nroDocumentoSap,
														TX: "Aplicación Móvil Abastecimiento > Traspasos"
													};

													this.registrarLog("Traspaso_Realizado", this.datosCreacion).then(function (respuestaRegistrarLog) {
														this.getView().setBusy(false);
														this.preocesoGenerarTraspasoConExito(nroDocumentoSap);
													}.bind(this));

												}.bind(this));
											} else {
												this.getView().setBusy(false);
												var msj = 'No fue posible traspasar la posición, intente más tarde.';

												if (cantidadItems.length > 1) {
													msj = 'No fue posible traspasar las posiciones, intente más tarde.';
												}

												MessageBox.information(msj, {
													title: "Aviso",
													actions: ["OK"],
													styleClass: "",
													onClose: function (sAction) {}.bind(this),
													details: respuestaIERP.error,
												});
											}
										}.bind(this));
									} else {

										var recordERPDet = {};
										var recordERPDetHana = {};

										var obj = item[i].getBindingContext("oModelPosTraslado").getObject();

										//ERP
										recordERPDet.Ikey = "1"; //Edm.String" Nullable="false" MaxLength="1"
										recordERPDet.Budat = oDatePickerFCTraspaso.getDateValue(); //Edm.DateTime" Nullable="false" Precision="7" sap:label="Fecha contab."
										recordERPDet.Bldat = oDatePickerFCTraspaso.getDateValue(); //Edm.DateTime" Nullable="false" Precision="7" sap:label="Fecha documento"
										recordERPDet.Bktxt = oTextAreaObservacion.getValue().trim().slice(0, 25); //Edm.String" Nullable="false" MaxLength="25" sap:label="Txt.cab.doc."
										recordERPDet.Xblnr = ""; //Edm.String" Nullable="false" MaxLength="16" sap:label="Referencia"
										recordERPDet.Werks = oInputCentroCTraspaso.getValue().slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Centro"
										recordERPDet.LgortIni = oInputAlmacenCTraspaso.getValue().slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén inicio"
										recordERPDet.LgortDes = obj.almacen.slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén destino"
										recordERPDet.Sgtxt = obj.denMaterial.slice(0, 50); //Edm.String" Nullable="false" MaxLength="50" sap:label="Texto"
										recordERPDet.Matnr = obj.codMaterial.slice(0, 18); //Edm.String" Nullable="false" MaxLength="18" sap:label="Material"
										var cantidad = obj.cantidad.replace(/,/g, ".");
										recordERPDet.Menge = cantidad; //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Cantidad"
										recordERPDet.Meins = obj.uni_medida.slice(0, 3); //Edm.String" Nullable="false" MaxLength="3"sap:label="UM base"
										recordERPDet.Lgpbe = ""; //Edm.String" Nullable="false" MaxLength="10" sap:label="Ubicación"
										recordERPDet.Charg = obj.lote.slice(0, 10); //Edm.String" Nullable="false" MaxLength="10" sap:label="Lote"
										recordERPCab.NavEjeTraspasoPos.push(recordERPDet);

										//HANA
										recordERPDetHana.nroPos = obj.pos.toString();
										recordERPDetHana.Budat = this.convertFechaXSJS(new Date(oDatePickerFCTraspaso.getDateValue()));
										recordERPDetHana.Bldat = this.convertFechaXSJS(new Date(oDatePickerFCTraspaso.getDateValue()));
										recordERPDetHana.Bktxt = oTextAreaObservacion.getValue().trim();
										recordERPDetHana.Xblnr = "";
										recordERPDetHana.Werks = oInputCentroCTraspaso.getValue();
										recordERPDetHana.Lgort = obj.almacen;
										recordERPDetHana.Sgtxt = obj.denMaterial;
										recordERPDetHana.Matnr = obj.codMaterial;
										recordERPDetHana.Menge = obj.cantidad;
										recordERPDetHana.Meins = obj.uni_medida;
										recordERPDetHana.Lgpbe = "";
										recordERPDetHana.Charg = obj.lote;
										recordERPCabHana.NavEjeTraspasoPos.push(recordERPDetHana);

										i++;
										functionRecorrer(listInventario, i);
									}
								}.bind(this);

								functionRecorrer(listInventario, 0);

							} else {
								MessageToast.show("Ingresa al menos una posición para traspasar");
							}
						} else {
							MessageToast.show("Complete los datos obligatorios.");
							jQuery.sap.delayedCall(3000, this, function () {
								this.cerrarT(this.InputsViewCabeceraTraslado, "", "vista");
								this.quitarState(this.InputsViewCabeceraTraslado, "", "vista");
							}.bind(this));
						}
					}
				}.bind(this)

			});
		},

		preocesoGenerarTraspasoConExito: function (nroDoc) {
			MessageBox.success("Traspaso Realizado. \n  \n El documento SAP asociado es el N°" +
				nroDoc + ".", {
					title: "Aviso",
					onClose: function (sAction) {
						this.btnReestablecerTraspaso();
					}.bind(this)
				});
		},

		traspasarEnERP: function (datos) {
			return new Promise(
				function resolver(resolve, reject) {

					this.getView().getModel("oModelSAPERP").create('/EjeTraspasoSet', datos, {
						success: function (oResult) {

							var respuesta = oResult.NavEjeTraspasoDoc.EMblnr + "-" + oResult.NavEjeTraspasoDoc.EMjahr;
							if (oResult.NavEjeTraspasoDoc.Type === "E") {
								resolve({
									nroDocumento: "",
									resolve: false,
									error: oResult.NavEjeTraspasoDoc.Message
								});
							} else {
								resolve({
									nroDocumento: respuesta,
									resolve: true,
									error: ""
								});
							}

						}.bind(this),
						error: function (oError) {
							var mensaje = "";
							try {
								mensaje = JSON.parse(oError.responseText).error.message.value;
								resolve({
									nroDocumento: "",
									error: mensaje,
									resolve: false
								});
							} catch (e) {
								resolve({
									nroDocumento: "",
									error: mensaje,
									resolve: false
								});
							}

						}.bind(this)
					});

				}.bind(this));
		},

		traspasarEnHANA: function (json) {
			return new Promise(
				function resolver(resolve, reject) {

					var fecha = new Date();
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);
					json.FechaTraspaso = this.convertFechaXSJS(new Date(fecha));
					json.horaTraspaso = this.horaXSJS();
					json.almacenCabecera = this.getView().byId("oInputAlmacenCTraspaso").getValue();
					json.userSCPCodTraspaso = this.userSCPCod;

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=traspasar";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve(respuesta);
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));
		}

	});

});