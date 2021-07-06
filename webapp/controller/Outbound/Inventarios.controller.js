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

			this.crearMessageView();
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");

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

			} else {
				this.onBackMenu();
			}

		},

		mostrarResultadosCreacionSAP: function () {
			var oModelResultado = new JSONModel(this.arregloResultado);
			this.oMessageView.setModel(oModelResultado);
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},

		crearMessageView: function () {
			var that = this;
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}',
				markupDescription: '{markupDescription}',
				groupName: '{group}'
			});
			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				groupItems: true,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});
			var oBackButton = new sap.m.Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});
			this.oDialog = new sap.m.Dialog({
				resizable: true,
				content: this.oMessageView,
				state: 'Information',
				beginButton: new sap.m.Button({
					press: function () {
						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: "Resultado"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});
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
			var oButtonBuscar = this.getView().byId("oButtonBuscarId");
			oButtonBuscar.setEnabled(true);

			var oButtonInventariar = this.getView().byId("oButtonInventariarId");
			oButtonInventariar.setEnabled(false);

			if (oInputDocumentoInventario.getValue().trim().length > 0) {
				this.getView().setBusy(true);
				oInputDocumentoInventario.setEditable(false);
				ejercicio.setEditable(false);
				this.getView().byId("oDatePickerFInv").setEditable(true);

				this.getView().byId("oInputUsuarioReg").setEditable(true);

				this.busquedaDocumentoInventario(oInputDocumentoInventario.getValue().trim(), ejercicio.getValue()).then(function (
					respuestabusquedaDI) {
					var respuestaBusquedaDocumentoInventario = respuestabusquedaDI.datos;

					var model = new JSONModel(respuestaBusquedaDocumentoInventario);
					this.getView().setModel(model, "oModelInventario");
					this.getView().setBusy(false);

					if (respuestabusquedaDI.mensajeError.length > 0) {
						MessageToast.show(respuestabusquedaDI.mensajeError);
					} else {
						oButtonInventariar.setEnabled(true);
						oButtonBuscar.setEnabled(false);
					}

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
			this.getView().byId("oPageInventariosId").scrollTo(0, 0);
			var oButtonBuscar = this.getView().byId("oButtonBuscarId");
			oButtonBuscar.setEnabled(true);

			var oButtonInventariar = this.getView().byId("oButtonInventariarId");
			oButtonInventariar.setEnabled(false);

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
			oInputPeriodo.setEditable(false);

		},

		btnAceptarInventario: function (oEvent) {
			var vista = this.getView().byId("oPageInventariosId");
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

								//ERP
								var recordERPCab = {};
								recordERPCab.Ikey = "1";
								recordERPCab.IGjahr = oInputPeriodo.getValue(); //Type="Edm.String" Nullable="false" MaxLength="4" sap:label="Ejercicio"
								recordERPCab.IIblnr = oInputDocumentoInventarioTraspaso.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="10" sap:label="Doc.inventario"
								recordERPCab.IUsuHana = oInputUsuarioReg.getValue().trim(); //Type="Edm.String" Nullable="false" MaxLength="20" sap:label="Usuario Hana"
								recordERPCab.IZldat = oDatePickerFInv.getDateValue(); //Type="Edm.DateTime" Nullable="false" Precision="7" sap:label="Fe.recuento"
								recordERPCab.NavEjeInventarioPos = [];
								recordERPCab.NavEjeInventarioRet = [];

								//HANA
								var recordERPCabHana = {};
								recordERPCabHana.Ikey = "1";
								recordERPCabHana.IGjahr = oInputPeriodo.getValue();
								recordERPCabHana.IIblnr = oInputDocumentoInventarioTraspaso.getValue().trim();
								recordERPCabHana.IUsuHana = oInputUsuarioReg.getValue().trim();
								recordERPCabHana.IZldat = oDatePickerFInv.getDateValue();
								recordERPCabHana.NavEjeInventarioPos = [];

								var functionRecorrer = function (item, i) {
									if (item.length === i) {

										this.inventariarEnERP(recordERPCab, recordERPCabHana).then(function (respuestaIERP) {
											if (respuestaIERP.resolve) {
												if (this.countErrores < recordERPCabHana.NavEjeInventarioPos.length) {
													this.inventariarEnHANA(recordERPCabHana).then(function (respuestaIHANA) {
														this.datosCreacion = {
															NRO_DOCUMENTO_SAP: "",
															TX: "Aplicación Móvil Abastecimiento > Inventarios"
														};

														this.registrarLog("Inventario_Realizado", this.datosCreacion).then(function (respuestaRegistrarLog) {
															MessageToast.show("Inventario Realizado");
															jQuery.sap.delayedCall(3000, this, function () {
																this.btnReestablecerInventario();
															this.getView().setBusy(false);
															}.bind(this));
														}.bind(this));
													}.bind(this));
												} else {
													this.getView().setBusy(false);
													MessageToast.show("No fue posible inventariar el documento, intente más tarde.");
												}
											} else {
												this.getView().setBusy(false);
												MessageToast.show("No fue posible inventariar el documento, intente más tarde.");
											}
										}.bind(this));
									} else {

										var recordERPDet = {};
										var recordERPDetHana = {};

										var obj = item[i].getBindingContext("oModelInventario").getObject();
										var pos = item[i].getContent()[0].getContent()[4].getItems()[1];
										this.existePosicionHana(obj.Zeili, recordERPCab.IIblnr, recordERPCab.IGjahr).then(function (existeEnHana) {

											//ERP
											recordERPDet.Ikey = "1"; //Edm.String" Nullable="false" MaxLength="1"
											recordERPDet.Zeili = obj.Zeili.slice(0, 3); //Edm.String" Nullable="false" MaxLength="3" sap:label="Posición"
											recordERPDet.Matnr = obj.Matnr.slice(0, 18); //Edm.String" Nullable="false" MaxLength="18" sap:label="Material"
											recordERPDet.Maktx = obj.Maktx.slice(0, 40); //Edm.String" Nullable="false" MaxLength="40" sap:label="Txt.brv."
											var cantidad = pos.getValue().replace(/,/g, ".");
											recordERPDet.Erfmg = cantidad; //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Ctd.en UME"
											recordERPDet.Erfme = obj.Erfme.slice(0, 3); //Edm.String" Nullable="false" MaxLength="3" sap:label="UM entrada"
											recordERPDet.Lgpbe = obj.Lgpbe.slice(0, 10); //Edm.String" Nullable="false" MaxLength="10" sap:label="Ubicación"
											recordERPDet.Werks = obj.Werks.slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Centro"
											recordERPDet.Lgort = obj.Lgort.slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén"
											recordERPDet.Transaccion = existeEnHana.slice(0, 20); //Edm.String" Nullable="false" MaxLength="20" sap:label="Transaccion"

											var zeroCount = "X";

											if (existeEnHana === "05") {
												if (pos.getValue() === "0" || pos.getValue() === "") {
													zeroCount = "0";
													recordERPDet.Erfmg = "0";
												}
											} else if (existeEnHana === "04") {
												if (pos.getValue() === "0") {
													zeroCount = "0";
													recordERPDet.Erfmg = "0";
												} else if (pos.getValue() === "") {
													zeroCount = "X";
												}
											}

											recordERPDet.ZeroCount = zeroCount; //Edm.String" Nullable="false" MaxLength="1" sap:label="Recuento cero"

											if (pos.getValue() !== "") {
												recordERPCab.NavEjeInventarioPos.push(recordERPDet);
											}

											//HANA
											recordERPDetHana.Zeili = obj.Zeili;
											recordERPDetHana.Matnr = obj.Matnr;
											recordERPDetHana.Maktx = obj.Maktx;
											recordERPDetHana.Erfmg = recordERPDet.Erfmg;
											recordERPDetHana.Erfme = obj.Erfme;
											recordERPDetHana.Lgpbe = obj.Lgpbe;
											recordERPDetHana.Werks = obj.Werks;
											recordERPDetHana.Lgort = obj.Lgort;
											recordERPDetHana.ZeroCount = zeroCount;
											recordERPDetHana.Transaccion = existeEnHana;
											recordERPDetHana.Charg = obj.Charg;
											recordERPDetHana.error = false;

											if (pos.getValue() !== "") {
												recordERPCabHana.NavEjeInventarioPos.push(recordERPDetHana);
											}

											i++;
											functionRecorrer(listInventario, i);

										}.bind(this));
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

		inventariarEnHANA: function (json) {
			return new Promise(
				function resolver(resolve, reject) {
					var fecha = new Date();
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);
					json.IZldat = this.convertFechaXSJS(new Date(json.IZldat));
					json.FechaInventario = this.convertFechaXSJS(new Date(fecha));
					json.horaInventario = this.horaXSJS();
					json.UserSCPCodInventario = this.userSCPCod;
					var newPos = [];

					json.NavEjeInventarioPos.forEach(function (element, index) {
						if (!element.error) {
							newPos.push(element);
						}

						if (json.NavEjeInventarioPos.length === (index + 1)) {
							json.NavEjeInventarioPos = newPos;
							var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=inventariar";

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
						}
					}.bind(this));

				}.bind(this));
		},

		existePosicionHana: function (pos, docInventario, ejercicio) {
			return new Promise(
				function resolver(resolve) {

					var filterDocInv = new sap.ui.model.Filter({
						path: "DOCUMENTO_INVENTARIO",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: docInventario
					});

					var filterEjercicio = new sap.ui.model.Filter({
						path: "EJERCICIO",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: ejercicio
					});

					var finalFilter = new sap.ui.model.Filter({
						filters: [filterDocInv, filterEjercicio],
						and: true
					});

					var tx = "04";
					var countCond = 0;

					this.getView().getModel("oModeloHanaSalida").read("/Inventario", {
						filters: [finalFilter],
						urlParameters: {
							"$expand": ["InventarioTODetalle_Inventario"]
						},
						success: function (oResults) {

							var inventario = oResults.results;
							if (inventario.length > 0) {
								var functionRecorrer = function (item, i) {
									if (item.length === i) {
										if (countCond > 0) {
											tx = "05";
										}
										resolve(tx);
									} else {
										var detalleInventario = item[i].InventarioTODetalle_Inventario.results;
										if (detalleInventario.length > 0) {
											detalleInventario.forEach(function (element, index) {
												if (element.NUMERO_POSICION === pos) {
													countCond++;
												}
												if (detalleInventario.length === (index + 1)) {
													i++;
													functionRecorrer(item, i);
												}
											}.bind(this));
										}
									}
								}.bind(this);
								functionRecorrer(inventario, 0);
							} else {
								resolve(tx);
							}
						}.bind(this),
						error: function (oError) {
							resolve(tx);
						}.bind(this)
					});
				}.bind(this));
		},

		inventariarEnERP: function (datos, datosParaHana) {
			return new Promise(
				function resolver(resolve, reject) {

					this.getView().getModel("oModelSAPERP").create('/EjeInventarioSet', datos, {
						success: function (oResult) {
							var datosRotorno = oResult.NavEjeInventarioRet.results;

							this.arregloResultado = [];
							this.countErrores = 0;

							var functionRecorrer = function (item, i) {
								if (item.length === i) {
									this.mostrarResultadosCreacionSAP();
									resolve({
										nroDocumento: "",
										resolve: true,
										error: ""
									});
								} else {
									var a;
									var type = 'Success';
									var title = "El inventario de la posición " + item[i].Zeili + " fue realizado correctamente.";
									var descripcion = "";

									if (item[i].Type === "E") {
										this.countErrores++;
										type = 'Error';
										title = "El inventario de la posición " + item[i].Zeili + " no fue realizado.";
										descripcion = item[i].Message;

										datosParaHana.NavEjeInventarioPos.forEach(function (element, index) {
											if (element.Zeili === item[i].Zeili) {
												element.error = true;
											}
										}.bind(this));

									}

									a = {
										type: type,
										title: title,
										description: descripcion,
										group: "Posiciones documento inventario " + datos.IIblnr
									};
									this.arregloResultado.push(a);

									i++;
									functionRecorrer(datosRotorno, i);
								}
							}.bind(this);
							functionRecorrer(datosRotorno, 0);

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