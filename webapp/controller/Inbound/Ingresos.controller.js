sap.ui.define([
	"com/gasco/Inbound/controller/Inbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Inbound.controller.Inbound.Ingresos", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("ingresos").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
				this._wizard = this.getView().byId("WizardInbound");

				this.InputsView = [{
					"id": "oInputOC",
					"required": true,
					"type": "ip"
				}, {
					"id": "oDatePickerFC",
					"required": true,
					"type": "dt"
				}, {
					"id": "oInputPatente",
					"required": true,
					"type": "ip"
				}, {
					"id": "oInputGuiaDespacho",
					"required": true,
					"type": "ip"
				}, {
					"id": "oDatePickerFD",
					"required": true,
					"type": "dt"
				}, {
					"id": "oTextAreaObservacion",
					"required": false,
					"type": "ip"
				}];
				var oButtonComplete = this.getView().byId("oButtonComplete");
				if (oButtonComplete.aDelegates.length === 0) {
					oButtonComplete.addEventDelegate({
						ontap: function (oEvent) {
							if (this.buttonDisabled) {
								this.onPressGenerarTemporal();
							}
						}.bind(this)
					});
				}
				this.onPressRestablecer();
			} else {
				this.onBackMenu();
			}

		},

		capturePhoto: function () {
			var oNav = navigator.camera;
			oNav.getPicture(this.onPhotoDataSuccess.bind(this), this.onFail, {
				quality: 25,
				destinationType: oNav.DestinationType.DATA_URL
			});

		},

		onPhotoDataSuccess: function (imageData) {
			var imagen = "data:image/png;base64," + imageData;
			var image = this.getView().byId("oImageEvidenciaGuiaDespachoId");
			var image2 = this.getView().byId("oLightBoxItemEvidenciaGuiaDespachoId");

			var oVBoxImagenGuiaDespacho = this.getView().byId("oVBoxImagenGuiaDespacho");
			oVBoxImagenGuiaDespacho.setVisible(true);
			oVBoxImagenGuiaDespacho.setHeight("62px");
			image.setSrc(imagen);
			image2.setImageSrc(imagen);
		},

		onFail: function () {

		},

		onPressBuscar: function () {
			this.lotesSeleccionados = [];
			var inputNroOC = this.getView().byId("oInputOC");
			var oButtonBuscar = this.getView().byId("oButtonBuscarId");

			if (inputNroOC.getValue().trim().length > 0) {
				this.getView().setBusy(true);
				oButtonBuscar.setEnabled(false);
				inputNroOC.setEditable(false);
				this.busquedaOrdenDeCompra("NRO_OC", inputNroOC.getValue().trim()).then(function (respuestaBusquedaOC) {
					var respuestaBusquedaOrdenDeCompra = respuestaBusquedaOC.datos;

					var oModeloPosicionesIngresoMercaderia = new JSONModel([]);
					this.getView().setModel(oModeloPosicionesIngresoMercaderia, "oModeloPosicionesIngresoMercaderia");
					var posiciones = [];
					var functionFinal = function () {
						if (posiciones.length > 100) {
							posiciones.setSizeLimit(posiciones.length);
						}

						this.getView().byId("oTitleIdLPHI").setText("Posiciones (" + posiciones.length + ")");
						oModeloPosicionesIngresoMercaderia.setData(posiciones);
						oModeloPosicionesIngresoMercaderia.refresh();
						this.getView().setBusy(false);

						if (!this.restablecer) {
							this.restablecer = true;
							this._wizard.nextStep();
						}

						this.getView().byId("CabeceraStep").setValidated(false);
					}.bind(this);

					if (respuestaBusquedaOC.mensajeError.length === 0) {

						if (respuestaBusquedaOrdenDeCompra.length > 0) {
							this.getView().byId("oButtonComplete").setVisible(true);
							this.posicionEnMemoria = null;

							respuestaBusquedaOrdenDeCompra.sort(
								function (a, b) {
									if (a.Ebelp > b.Ebelp)
										return 1;
									else if (a.Ebelp < b.Ebelp)
										return -1;

									return 0;
								});

							respuestaBusquedaOrdenDeCompra.forEach(function (element, index) {

								element.Cantidad = element.Cantidad.replace(/ /g, "");
								element.CantidadPen = element.CantidadPen.replace(/ /g, "");
								element.StockLabst = element.StockLabst.replace(/ /g, "");

								if (element.Charg.length === 0) {
									posiciones.push(element);
								} else {

									if (this.nroPosicionEnMemoria !== element.Ebelp) {
										this.nroPosicionEnMemoria = element.Ebelp;
										this.posicionEnMemoria = element;
										this.posicionEnMemoria.lotes = [];
										this.posicionEnMemoria.lotes.push({
											lote: element.Charg
										});
										posiciones.push(this.posicionEnMemoria);
									} else {

										this.posicionEnMemoria.lotes.push({
											lote: element.Charg
										});

									}

								}

								if (respuestaBusquedaOrdenDeCompra.length === index + 1) {
									functionFinal();
								}

							}.bind(this));

						} else {
							MessageToast.show("Documento sin posiciones para recepcionar");
							oButtonBuscar.setEnabled(true);
							functionFinal();
						}

					} else {
						MessageToast.show(respuestaBusquedaOC.mensajeError);
						oButtonBuscar.setEnabled(true);
						functionFinal();
					}
				}.bind(this));
			} else {
				inputNroOC.setValueState("Error");
				MessageToast.show("Ingrese una Orden de compra valida");
				jQuery.sap.delayedCall(3000, this, function () {
					inputNroOC.setValueState("None");
				}.bind(this));
			}

		},

		onPressLecturaQR: function (oEvent) {
			sap.ndc.BarcodeScanner.scan(
				function (mResult) {
					var valor = "";
					if (mResult.format === "QR_CODE") {
						var value = mResult.text;

						if (value.length > 5) {
							var primerCaracter = value.slice(0, 1);
							var ultimoCaracter = value.slice(value.length - 1);

							if (primerCaracter === "{" && ultimoCaracter === "}") {
								valor = JSON.parse(value);
								if (valor.CABECERA !== undefined) {
									if (valor.CABECERA.ORDEN_DE_COMPRA !== undefined) {
										valor = valor.CABECERA.ORDEN_DE_COMPRA;
										this.cerrarDialogoMenuBusqueda();
										this.getView().byId("oInputOC").setValue(valor);
										this.getView().byId("oButtonBuscarId").focus();
									} else {
										this.estructuraDeCodigo();
									}
								} else {
									this.estructuraDeCodigo();
								}
							} else {
								this.estructuraDeCodigo();
							}
						} else {
							this.estructuraDeCodigo();
						}

					} else {
						MessageToast.show("El tipo de código no compatible con el formato esperado.");
					}

				}.bind(this),
				function (Error) {
					MessageToast.show("Ocurrió un problema al intentar leer el código.");
				},
			);
		},

		estructuraDeCodigo: function () {
			MessageToast.show("La estructura del código no compatible con el formato esperado.");
		},

		onRestablecerBusqueda: function () {
			var oInputBusquedaOC = sap.ui.getCore().byId("oInputBusquedaOCId");
			oInputBusquedaOC.setValue();
			var oModeloResultadosBusqueda = new JSONModel([]);
			this.getView().setModel(oModeloResultadosBusqueda, "oModeloResultadosBusqueda");
			sap.ui.getCore().byId("oTitleIdBRM").setHeaderText("Resultados (0)");
		},

		onSelectOCBusqueda: function (oEvent) {
			var obj = oEvent.getSource();
			var datos = obj.getSelectedItem().getBindingContext("oModeloResultadosBusqueda").getObject();
			var oc = datos.Ebeln;
			this.cerrarDialogoMenuBusqueda();
			this.getView().byId("oInputOC").setValue(oc);
			this.getView().byId("oButtonBuscarId").focus();
		},

		onSearchBusquedaOrdenDeCompra: function () {
			var inputBusqueda = sap.ui.getCore().byId("oInputBusquedaOCId");
			var oSelectpeBusqueda = sap.ui.getCore().byId("oSelectpeBusquedaId");

			if (inputBusqueda.getValue().trim().length > 0) {
				this.dialogMenuBusqueda.setBusy(true);
				this.busquedaOrdenDeCompra(oSelectpeBusqueda.getSelectedKey(), inputBusqueda.getValue().trim()).then(function (
					respuestaB) {
					var respuestaBusqueda = respuestaB.datos;
					var oModeloResultadosBusqueda = new JSONModel([]);
					this.getView().setModel(oModeloResultadosBusqueda, "oModeloResultadosBusqueda");
					respuestaBusqueda = this.eliminaDuplicado(respuestaBusqueda, "Ebeln");
					sap.ui.getCore().byId("oTitleIdBRM").setHeaderText("Resultados (" + respuestaBusqueda.length + ")");

					if (oModeloResultadosBusqueda.length > 100) {
						oModeloResultadosBusqueda.setSizeLimit(respuestaBusqueda.length);
					}

					oModeloResultadosBusqueda.setData(respuestaBusqueda);
					oModeloResultadosBusqueda.refresh();
					this.dialogMenuBusqueda.setBusy(false);

				}.bind(this));
			} else {
				inputBusqueda.setValueState("Error");
				MessageToast.show("Ingrese un valor para la búsqueda");
				jQuery.sap.delayedCall(3000, this, function () {
					inputBusqueda.setValueState("None");
				}.bind(this));
			}

		},

		onSelectChange: function () {

			var idList = this.getView().byId("idtableLPHI");
			var oButtonComplete = this.getView().byId("oButtonComplete");

			var cantOK = 0;
			var cantSobreZero = 0;

			idList.getItems().forEach(function (element, index) {
				var pos = element.getContent()[0].getItems()[1].getContent();
				var cantPen = pos[4].getItems()[1].getText();
				var cantPenNum = Number(pos[4].getItems()[1].getText().replace(/\./g, ""));
				if (cantPen !== "0") {
					cantSobreZero++;
					var step = pos[6].getItems()[1].getValue();
					var check = pos[7].getItems()[0].getSelected();
					var lote = pos[8].getItems()[1].getSelectedKey();

					if (!pos[8].getVisible()) {
						if (cantPenNum > 0 && (step <= cantPenNum && step > 0) && check) {
							cantOK++;
						}
					} else if (pos[8].getVisible()) {
						if (cantPenNum > 0 && (step <= cantPenNum && step > 0) && check && lote.length > 0) {
							cantOK++;
						}
					}
				}

				if (idList.getItems().length === (index + 1)) {
					oButtonComplete.addStyleClass("sapMBtnDisabled");
					this.buttonDisabled = false;
					if (cantOK > 0) {
						oButtonComplete.removeStyleClass("sapMBtnDisabled");
						this.buttonDisabled = true;
					}
					if (cantOK === cantSobreZero) {
						var scrollObj = $("#" + this._wizard.getId() + "-step-container");
						scrollObj.animate({
							scrollTop: scrollObj.prop("scrollHeight")
						}, 1000);
					}
				}

			}.bind(this));
		},

		alSeleccionarUnLote: function (oEvent) {
			var seleccion = oEvent.getSource();
			var selectedItem = oEvent.getParameters().selectedItem;
			if (selectedItem !== null) {
				var binding = selectedItem.getBindingContext("oModeloPosicionesIngresoMercaderia");
				var path = binding.getPath().slice(0, 3);
				var object = this.getView().getModel("oModeloPosicionesIngresoMercaderia").getProperty(path);
				var pos = object.Ebelp;

				this.lotesSeleccionados.forEach(function (elementt, ii) {
					if (elementt.pos === pos) {
						this.lotesSeleccionados.splice(ii, 1);
					}
				}.bind(this));

				var countErrorLote = 0;
				if (this.lotesSeleccionados.length > 0) {
					this.lotesSeleccionados.forEach(function (element, index) {
						if (seleccion.getSelectedKey() === element.lote) {
							countErrorLote++;
						}

						if (this.lotesSeleccionados.length === index + 1) {
							if (countErrorLote > 0) {
								MessageToast.show("Número de lote ya fue seleccionado en otra posición");
								oEvent.getSource().setSelectedKey();
								this.onSelectChange();
							} else {
								this.lotesSeleccionados.push({
									lote: seleccion.getSelectedKey(),
									pos: pos
								});
								this.onSelectChange();
							}
						}
					}.bind(this));
				} else {
					this.lotesSeleccionados.push({
						lote: seleccion.getSelectedKey(),
						pos: pos
					});
					this.onSelectChange();
				}
			}
		},

		onPressGenerarTemporal: function () {
			var contenedor = this.getView().byId("oPageId");
			this.validar(this.InputsView, "", contenedor).then(function (respuestaValidar) {
				if (!respuestaValidar) {

					MessageBox.information('¿Seguro que deseas recepcionar el trabajo realizado?', {
						title: "Aviso",
						actions: ["Si", "No"],
						styleClass: "",
						onClose: function (sAction) {
							if (sAction === "Si") {

								this.openBusyDialogCargando();
								//Consulta si existe ot, sino la crea y retorna el id de la ot
								var ot = this.getView().byId("oInputOC").getValue();

								this.consultaOC(ot).then(function (respuestaOC) {
									if (respuestaOC.resolve) {
										var idOC = respuestaOC.idOc;
										var guiDespacho = this.getView().byId("oInputGuiaDespacho").getValue();
										this.consultaOCGuia(idOC, guiDespacho).then(function (respuestaOCGuia) {
											if (respuestaOCGuia) {
												var fechaConta = this.getView().byId("oDatePickerFC").getDateValue();
												var patente = this.getView().byId("oInputPatente").getValue();
												var fechaGuia = this.getView().byId("oDatePickerFD").getDateValue();
												var observacion = this.getView().byId("oTextAreaObservacion").getValue();

												var fecha = new Date();
												fecha.setHours(0);
												fecha.setMinutes(0);
												fecha.setSeconds(0);

												var dataIngreso = {
													ID_INGRESO: 0,
													ID_OC: idOC,
													ID_ESTADO_INGRESO: 1,
													FECHA_CONTABILIZACION: fechaConta,
													GUIA_DESPACHO: guiDespacho,
													FECHA_GUIA_DESPACHO: fechaGuia,
													PATENTE: patente,
													OBSERVACION: observacion,
													FECHA_INBOUND: fecha,
													HORA_INBOUND: this.hora(),
													USER_SCP_COD_INBOUND: this.userSCPCod,
													FECHA_RECEPCION: null,
													HORA_RECEPCION: null,
													NUMERO_INGRESO_ERP: null,
													USER_SCP_COD_RECEPCION: null
												};
												var creacionConError = 0;

												this.createIngresoXSODATA(dataIngreso).then(function (respuestaIngreso) {
													if (respuestaIngreso.resolve) {
														var idIngreso = respuestaIngreso.idIngreso;

														var idList = this.getView().byId("idtableLPHI");

														var recorrerPosiciones = function (element, index) {
															if (element.length === index) {
																if (creacionConError === 0) {

																	this.datosCreacion = {
																		ID_AVISO: idIngreso,
																		NUMERO_MATERIAL: ""
																	};

																	this.registrarLog("Genera_Ingreso_Temporal", this.datosCreacion).then(function (respuestaRegistrarLog) {
																		this.BusyDialogCargando.close();
																		this.preocesoGenerarOCConExito(idIngreso);
																	}.bind(this));
																} else {
																	this.BusyDialogCargando.close();
																	this.errorAlGenerarOC();
																}
															} else {

																var pos0 = element[index].getContent()[0].getItems()[0].getContent();
																var pos1 = element[index].getContent()[0].getItems()[1].getContent();

																var cantPen = pos1[4].getItems()[1].getText();
																//var cantPenNum = Number(pos1[4].getItems()[1].getText().replace(/\./g, ""));
																if (cantPen !== "0") {
																	var codMaterial = pos0[0].getItems()[1].getText();
																	var stockMaterial = pos0[1].getItems()[1].getText();
																	var position = pos0[2].getItems()[1].getText();
																	var denomination = pos0[3].getItems()[1].getText();

																	var ubicacion = pos1[0].getItems()[1].getItems()[0].getText();
																	var centro = pos1[1].getItems()[1].getItems()[0].getText();
																	var almacen = pos1[2].getItems()[1].getText();
																	var cantTotal = pos1[3].getItems()[1].getText();
																	var unidadMedida = pos1[5].getItems()[1].getText();
																	var step = pos1[6].getItems()[1].getValue().toString();
																	//var check = pos1[7].getItems()[0].getSelected();

																	var loteo = null;
																	var idTipoPosicion = 1;
																	var vBoxLote = pos1[8];

																	if (vBoxLote.getVisible()) {
																		loteo = vBoxLote.getItems()[1].getSelectedKey();
																		idTipoPosicion = 2;
																	}
																	var stockZero = pos1[9].getItems()[1].getText();
																	var codigoSAPProveedor = pos1[10].getItems()[1].getText();
																	var esSeriado = pos1[11].getItems()[1].getText();

																	if (esSeriado.length > 0) {
																		idTipoPosicion = 3;
																	}

																	if (almacen === "Asignar") {
																		almacen = "";
																	}

																	var dataPosiciones = {
																		ID_POSICION: 0,
																		ID_INGRESO: idIngreso,
																		ID_ESTADO_POSICION: 1,
																		NUMERO_POSICION: position,
																		CODIGO_MATERIAL: codMaterial,
																		DESCRIPCION_MATERIAL: denomination,
																		CANTIDAD_MATERIAL_TOTAL: cantTotal,
																		CANTIDAD_MATERIAL_PENDIENTE: cantPen,
																		CANTIDAD_MATERIAL_INGRESADO: step,
																		UNIDAD_DE_MEDIDA_MATERIAL: unidadMedida,
																		NUMERO_UBICACION: ubicacion,
																		NUMERO_LOTE: loteo,
																		CENTRO: centro,
																		ALMACEN: almacen,
																		ID_TIPO_POSICION: idTipoPosicion,
																		STOCK_MATERIAL: stockZero,
																		CODIGO_SAP_PROVEEDOR: codigoSAPProveedor
																	};

																	this.createPosicionIngresoXSODATA(dataPosiciones).then(function (respuestaPosicionIngreso) {
																		if (respuestaPosicionIngreso) {
																			index++;
																			recorrerPosiciones(element, index);
																		} else {
																			creacionConError++;
																			index++;
																			recorrerPosiciones(element, index);
																		}
																	}.bind(this));
																} else {
																	index++;
																	recorrerPosiciones(element, index);
																}

															}
														}.bind(this);
														recorrerPosiciones(idList.getItems(), 0);
													} else {
														this.BusyDialogCargando.close();
														this.errorAlGenerarOC();
													}
												}.bind(this));
											} else {
												this.BusyDialogCargando.close();
												MessageToast.show("En nuestro sistema ya registra un ingreso para la Orden de Compra " + ot +
													" y la Guía de Despacho " +
													guiDespacho + ".", {
														duration: 8000,
														width: "25rem"
													});
											}
										}.bind(this));

									} else {
										this.BusyDialogCargando.close();
										this.errorAlGenerarOC();
									}
								}.bind(this));

							}
						}.bind(this)
					});
				} else {
					this._wizard.goToStep(this.getView().byId("CabeceraStep"));
					MessageToast.show("Completa los campos obligatorios para continuar.");

					jQuery.sap.delayedCall(3000, this, function () {
						this.quitarState(this.InputsView, "");
					}.bind(this));
				}
			}.bind(this));
		},

		errorAlGenerarOC: function () {
			MessageToast.show(
				"No fue posible guardar el ingreso de la Orden de Compra, intenta más tarde o comunícate con el área encargada.", {
					duration: 6000,
					width: "25rem"
				});
		},

		preocesoGenerarOCConExito: function (idIngreso) {
			MessageBox.success("Orden de compra recepcionada con éxito. \n El número de ingreso temporal asociado es el N°" + idIngreso + ".", {
				title: "Aviso",
				onClose: function (sAction) {
					this.onPressRestablecer();
				}.bind(this)
			});
		},

		consultaOCGuia: function (idOc, guiaDespacho) {
			return new Promise(
				function resolver(resolve, reject) {

					var aFil = [];
					var tFilterIO = new sap.ui.model.Filter({
						path: "ID_OC",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: idOc
					});
					aFil.push(tFilterIO);

					var tFilterGD = new sap.ui.model.Filter({
						path: "GUIA_DESPACHO",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: guiaDespacho
					});
					aFil.push(tFilterGD);

					this.getView().getModel("oModeloHanaIngresoMercaderia").read('/Ingreso', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							if (datos.length > 0) {
								resolve(false);
							} else {
								resolve(true);
							}
						}.bind(this),
						error: function (oError) {
							resolve(true);
						}.bind(this)
					});

				}.bind(this));
		},

		consultaOC: function (oc) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=consultaOC";

					var json = {
						ORDEN_DE_COMPRA: oc
					};

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							if (respuesta === "ERROR") {
								resolve({
									idOc: respuesta,
									resolve: false
								});
							} else {
								resolve({
									idOc: respuesta,
									resolve: true
								});
							}
							resolve(respuesta);
						}.bind(this),
						error: function (oError) {
							resolve({
								idOc: oError,
								resolve: false
							});
						}.bind(this)
					});

				}.bind(this));
		},

		onPressRestablecer: function () {
			var scrollObj = $("#" + this._wizard.getId() + "-step-container");

			scrollObj.animate({
				scrollTop: 0
			}, 1000);
			var oVBoxImagenGuiaDespacho = this.getView().byId("oVBoxImagenGuiaDespacho");
			oVBoxImagenGuiaDespacho.setVisible(false);
			oVBoxImagenGuiaDespacho.setHeight("30px");

			this.getView().byId("oTitleIdLPHI").setText("Posiciones (0)");
			this._wizard.previousStep();
			var oButtonComplete = this.getView().byId("oButtonComplete");
			oButtonComplete.setVisible(false);
			oButtonComplete.addStyleClass("sapMBtnDisabled");
			this.buttonDisabled = false;
			var oInputOC = this.getView().byId("oInputOC");
			oInputOC.setValue();
			oInputOC.setEditable(true);

			jQuery.sap.delayedCall(500, this, function () {
				oInputOC.focus();
			});

			var oButtonBuscar = this.getView().byId("oButtonBuscarId");
			oButtonBuscar.setEnabled(true);

			var arrPicker = [{
				id: "oDatePickerFD",
				type: "date"
			}, {
				id: "oDatePickerFC",
				type: "date"
			}];

			this.functionDisablePicker(arrPicker);

			var oDatePickerFD = this.getView().byId("oDatePickerFD");
			oDatePickerFD.setValue();
			//oDatePickerFD.setMaxDate(new Date());

			var oDatePickerFecha = this.getView().byId("oDatePickerFC");
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

			var oModeloPosicionesIngresoMercaderia = new JSONModel([]);
			this.getView().setModel(oModeloPosicionesIngresoMercaderia, "oModeloPosicionesIngresoMercaderia");

			this.getView().byId("oInputGuiaDespacho").setValue();
			this.getView().byId("oInputPatente").setValue();
			this.getView().byId("oTextAreaObservacion").setValue();
			this.restablecer = false;

		},

		onDetectEstructuraQR: function (oEvent) {

			var obj = oEvent.getSource();
			var value = obj.getValue();
			var valor = value;

			if (value.length > 5) {
				var primerCaracter = value.slice(0, 1);
				var ultimoCaracter = value.slice(value.length - 1);

				if (primerCaracter === "{" && ultimoCaracter === "}") {
					valor = JSON.parse(value);
					if (valor.CABECERA !== undefined) {
						if (valor.CABECERA.ORDEN_DE_COMPRA !== undefined) {
							valor = valor.CABECERA.ORDEN_DE_COMPRA;
						}
					}
				}
			}
			obj.setValue(valor);
		},

		openMenuBusqueda: function (oEvent) {

			this.dialogMenuBusqueda = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.menuBusqueda", this);
			this.getView().addDependent(this.dialogMenuBusqueda);

			this.dialogMenuBusqueda.attachAfterClose(function () {
				this.cerrarDialogoMenuBusqueda();
			}.bind(this));

			//this.dialogShowAdjuntos.setModel(this.getView().getModel("mainModel"));
			this.dialogMenuBusqueda.open();
		},

		cerrarDialogoMenuBusqueda: function () {
			this.onRestablecerBusqueda();
			this.dialogMenuBusqueda.destroy();
		},

		busquedaOrdenDeCompra: function (campo, dato) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var campoBusqueda = "";
					var tFilterIkey = new sap.ui.model.Filter({
						path: "Ikey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "1"
					});
					aFil.push(tFilterIkey);

					if (campo === "NRO_OC") {
						campoBusqueda = "IEbeln";
					} else if (campo === "NRO_MATERIAL") {
						campoBusqueda = "IMatnr";
					} else if (campo === "RUT_PROVEEDOR") {
						campoBusqueda = "IStcd1";
					}

					var tFilterCampoBusqueda = new sap.ui.model.Filter({
						path: campoBusqueda,
						operator: sap.ui.model.FilterOperator.EQ,
						value1: dato
					});
					aFil.push(tFilterCampoBusqueda);

					this.getView().getModel("oModeloSAPERP").read('/BuscarOrdenCompraSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							if (datos.length > 0) {
								if (datos[0].Mensaje.length > 0 && datos[0].Mensaje !== "Pedido liberado") {
									resolve({
										mensajeError: datos[0].Mensaje,
										datos: []
									});
								} else {
									resolve({
										mensajeError: "",
										datos: datos
									});
								}
							} else {
								resolve({
									mensajeError: "Documento sin posiciones para recepcionar",
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

		}

	});

});