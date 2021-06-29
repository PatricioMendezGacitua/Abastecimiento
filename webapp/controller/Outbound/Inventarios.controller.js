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

			this.InputsViewCabeceraInventario = [{
				"id": "oInputDocumentoInventarioTraspaso",
				"required": true,
				"type": "ip"
			}, {
				"id": "oInputPeriodo",
				"required": true,
				"type": "dt"
			}, {
				"id": "oDatePickerFInv",
				"required": true,
				"type": "dt"
			}, {
				"id": "oInputUsuarioReg",
				"required": true,
				"type": "ip"
			}];
			this.modeloPosTraspaso = new JSONModel([]);
			this.getView().setModel(this.modeloPosTraspaso, "oModelPosTraslado");

			var arrPicker = [{
				id: "oDatePickerFInv",
				type: "dateMax"
			}, {
				id: "oInputPeriodo",
				type: "dateMax"
			}];

			this.functionDisablePicker(arrPicker);
			this.btnReestablecerInventario();
		},

		alSeleccionarFechaInv: function (oEvent) {
			//var obj = oEvent.getSource().getDateValue();
			//var anio = new Date(obj).getFullYear();
			//this.getView().byId("oInputPeriodo").setValue(anio);
		},

		countTitleLPInventario: function (oEvent) {

			this.getView().byId("oTitleIdLInventario").setText("Posiciones (" + this.getView().byId("idtableLPInventario").getItems().length +
				")");

		},

		onPressBuscarInventario: function (oEvent) {
			var oInputDocumentoInventario = this.getView().byId("oInputDocumentoInventarioTraspaso");
			var ejercicio = this.getView().byId("oInputPeriodo");

			if (oInputDocumentoInventario.getValue().trim().length > 0) {
				this.getView().setBusy(true);
				oInputDocumentoInventario.setEditable(false);
				ejercicio.setEditable(false);
				this.getView().byId("oDatePickerFInv").setEditable(true);

				this.getView().byId("oInputUsuarioReg").setEditable(true);

				/*var arrInventario = {
				"Centro": "7110",
				"Almacen": "1130",
				"Detalle": [{
					"Pos": 1,
					"Material": "101373",
					"Ubicacion": "1130",
					"DenMaterial": "LAPIZ PASTA BIC ORANGE AZUL",
					"UM": "C/U",
					"Lote": ""
				}, {
					"Pos": 2,
					"Material": "101371",
					"Ubicacion": "1150",
					"DenMaterial": "LAPIZ PASTA BIC CRISTAL NEGRO",
					"UM": "C/U",
					"Lote": 15
				}, {
					"Pos": 3,
					"Material": "101372",
					"Ubicacion": "1160",
					"DenMaterial": "LAPIZ PASTA BIC CRISTAL ROJO",
					"UM": "C/U",
					"Lote": ""
				}, {
					"Pos": 4,
					"Material": "101375",
					"Ubicacion": "1160",
					"DenMaterial": "LAPIZ PASTA BIC ORANGE ROJO",
					"UM": "C/U",
					"Lote": ""
				}]
				};
				*/

				this.busquedaDocumentoInventario(oInputDocumentoInventario.getValue().trim(), ejercicio.getValue()).then(function (
					respuestabusquedaDI) {
					var respuestaBusquedaDocumentoInventario = respuestabusquedaDI.datos;

					var model = new JSONModel(respuestaBusquedaDocumentoInventario);
					this.getView().setModel(model, "oModelInventario");
					this.getView().setBusy(false);
				}.bind(this));

			} else {
				this.getView().setBusy(false);
				oInputDocumentoInventario.setValueState("Error");
				MessageToast.show("Ingrese un documento inventario para la búsqueda");
				jQuery.sap.delayedCall(3000, this, function () {
					oInputDocumentoInventario.setValueState("None");
				}.bind(this));
			}

		},

		busquedaDocumentoInventario: function (dato, ejercicio) {
			return new Promise(
				function resolver(resolve) {
					var oInputCentro = this.getView().byId("oInputCentroId");
					var oInputAlmacen = this.getView().byId("oInputAlmacenId");

					oInputCentro.setValue();
					oInputAlmacen.setValue();

					var aFil = [];

					var tFilterIGjahr = new sap.ui.model.Filter({
						path: "IGjahr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: ejercicio
					});
					aFil.push(tFilterIGjahr);

					var tFilterIIblnr = new sap.ui.model.Filter({
						path: "IIblnr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: dato
					});
					aFil.push(tFilterIIblnr);

					this.getView().getModel("oModelSAPERP").read('/ConsInventarioSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							if (datos.length > 0) {

								oInputCentro.setValue(datos[0].Werks);
								oInputAlmacen.setValue(datos[0].Lgort);

								datos.forEach(function (element) {
									element.visibleLote = false;
									if (element.Charg !== undefined) {
										if (element.Charg.length > 0) {
											element.visibleLote = true;
										}
									}
								}.bind(this));

								resolve({
									mensajeError: "",
									datos: datos
								});
							} else {
								resolve({
									mensajeError: "Documento sin posiciones para inventariar",
									datos: []
								});
							}
						}.bind(this),
						error: function (oError) {
							resolve({
								mensajeError: "Intente más tarde",
								datos: []
							});
						}.bind(this)
					});

				}.bind(this));

		},

		btnReestablecerInventario: function (oEvent) {
			var oInputDocumentoInventario = this.getView().byId("oInputDocumentoInventarioTraspaso");
			var oInputPeriodo = this.getView().byId("oInputPeriodo");
			this.getView().byId("oDatePickerFInv").setEditable(false);
			this.getView().byId("oInputUsuarioReg").setEditable(false);
			var model = new JSONModel([]);

			this.getView().setModel(model, "oModelInventario");
			this.getView().getModel("oModelInventario").refresh();

			oInputDocumentoInventario.setEditable(true);
			oInputDocumentoInventario.setValue("");
			this.getView().byId("oDatePickerFInv").setValue("");
			this.getView().byId("oInputUsuarioReg").setValue("");

			this.getView().byId("oInputCentroId").setValue("");
			this.getView().byId("oInputAlmacenId").setValue("");

			var anio = new Date().getFullYear();
			oInputPeriodo.setValue(anio);
			oInputPeriodo.setEditable(true);

		},

		btnAceptarInventario: function (oEvent) {
			var vista = this.getView().byId("oPageTrasladoId");
			MessageBox.information('¿Seguro deseas finalizar el inventario?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");
						this.validar(this.InputsViewCabeceraInventario, "", vista).then(function (respuestaValidar) {
							if (!respuestaValidar) {
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

								var functionRecorrer = function (item, i) {
									if (item.length === i) {
										debugger;
										this.inventariarEnERP(recordERPCab).then(function (respuestaIERP) {
											if (respuestaIERP.resolve) {
												this.inventariarEnHANA(recordERPCab).then(function (respuestaIHANA) {
													MessageToast.show("Inventario Realizado");
													jQuery.sap.delayedCall(3000, this, function () {
														this.btnReestablecerInventario();
													}.bind(this));
													this.getView().setBusy(false);
												}.bind(this));
											} else {
												this.getView().setBusy(false);
												MessageToast.show("No fue posible inventariar el documento, intente más tarde.");
											}
										}.bind(this));
									} else {

										var recordERPDet = {};

										var obj = item[i].getBindingContext("oModelInventario").getObject();
										var pos = item[i].getContent()[0].getContent()[4].getItems()[1];

										recordERPDet.Ikey = "1"; //Edm.String" Nullable="false" MaxLength="1"
										recordERPDet.Zeili = obj.Zeili; //Edm.String" Nullable="false" MaxLength="3" sap:label="Posición"
										recordERPDet.Matnr = obj.Matnr; //Edm.String" Nullable="false" MaxLength="18" sap:label="Material"
										recordERPDet.Maktx = obj.Maktx; //Edm.String" Nullable="false" MaxLength="40" sap:label="Txt.brv."
										recordERPDet.Erfmg = pos.getValue().toString(); //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Ctd.en UME"
										recordERPDet.Erfme = obj.Erfme; //Edm.String" Nullable="false" MaxLength="3" sap:label="UM entrada"
										recordERPDet.Lgpbe = obj.Lgpbe; //Edm.String" Nullable="false" MaxLength="10" sap:label="Ubicación"
										recordERPDet.Werks = obj.Werks; //Edm.String" Nullable="false" MaxLength="4" sap:label="Centro"
										recordERPDet.Lgort = obj.Lgort; //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén"
										recordERPDet.ZeroCount = pos.getValue() === 0 ? "" : "";
										recordERPCab.NavEjeInventarioPos.push(recordERPDet);
										i++;
										functionRecorrer(listInventario, i);

									}
								}.bind(this);

								if (listInventario.length > 0) {
									functionRecorrer(listInventario, 0);
								} else {
									this.getView().setBusy(false);
									MessageToast.show("Documento sin posiciones para inventariar.");
								}

							} else {
								MessageToast.show("Complete los datos obligatorios.");
								jQuery.sap.delayedCall(3000, this, function () {
									this.quitarState(this.InputsViewCabeceraInventario, "", vista);
								}.bind(this));
							}
						}.bind(this));
					}
				}.bind(this)

			});

		},

		inventariarEnERP: function (datos) {
			return new Promise(
				function resolver(resolve, reject) {

					this.getView().getModel("oModelSAPERP").create('/EjeInventarioSet', datos, {
						success: function (oResult) {
							debugger;
							resolve({
								nroDocumento: "",
								resolve: true,
								error: ""
							});
							/*var respuesta = oResult.navCrearDocMatDocumento.EMblnr + "-" + oResult.navCrearDocMatDocumento.EMjahr;

							if (respuesta.length > 0) {
								resolve({
									nroDocumento: respuesta,
									resolve: true,
									error: ""
								});
							} else {
								resolve({
									nroDocumento: "",
									resolve: false,
									error: ""
								});
							}*/

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