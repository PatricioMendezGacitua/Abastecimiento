sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("com.gasco.Abastecimiento.controller.Outbound.Detail_Traslados", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("Traslados_Detail").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			var buttonMenu = this.getView().byId("buttonMenuId");
			var buttonMenu2 = this.getView().byId("buttonMenu2Id");

			buttonMenu.setVisible(false);
			buttonMenu2.setVisible(false);

			this.getView().byId("oPageDetailId").scrollTo(0, 0, 1000);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			var oArgs = oEvent.getParameter("arguments");

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			//if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
			this._oStorage.put("navegacion_IngresoMercaderia", null);
			this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
			this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");

			this.InputsViewTrasladar = [{
				"id": "oInputNroPedidoTraslado",
				"required": true,
				"type": "ip"
			}, {
				"id": "oInputCentroTraslado",
				"required": true,
				"type": "ip"
			}, {
				"id": "oInputAlmacenTraslado",
				"required": true,
				"type": "ip"
			}];

			this.pedidoTraslado = oArgs.pedidoTraslado;
			//this.getView().byId("tituloDetalleSolicitudView").setText("Detalle Pedido Traslado");

			if (!sap.ui.Device.system.desktop) {
				buttonMenu.setVisible(true);
				buttonMenu2.setVisible(true);
			}

			var oButtonRecepcionar = this.getView().byId("oButtonTrasladarId");
			oButtonRecepcionar.setVisible(true);

			this.iniciarView();

			//	} else {
			//		this.onBackMenu();
			//	}

		},

		iniciarView: function (idEstadoIngreso) {
			this.openBusyDialog();

			this.busquedaPedidoTraslado("IEbeln", this.pedidoTraslado).then(function (
				respuestaB) {
				var respuestaBusqueda = respuestaB.datos;
				if (respuestaBusqueda.length > 0) {

					var data = respuestaBusqueda[0];
					this.pedidoTraslado = data.Ebeln;
					this.codCetnro = data.Werks;
					this.codAlmacen = data.Lgort;

					var oInputNroPedidoTraslado = this.getView().byId("oInputNroPedidoTraslado");
					var oInputCentroTraslado = this.getView().byId("oInputCentroTraslado");
					var oInputAlmacenTraslado = this.getView().byId("oInputAlmacenTraslado");
					var oButtonRecepcionar = this.getView().byId("oButtonTrasladarId");
					oButtonRecepcionar.setEnabled(false);

					oInputNroPedidoTraslado.setValue(data.Ebeln);
					oInputCentroTraslado.setValue(data.Werks);
					oInputAlmacenTraslado.setValue(data.Lgort);
					oInputAlmacenTraslado.setEditable(false);

					if (data.Lgort !== null) {
						if (data.Lgort.trim().length === 0) {
							oInputAlmacenTraslado.setEditable(true);
						}
					}

					var countSeriado = 0,
						countLoteado = 0;

					respuestaBusqueda.forEach(function (element, index) {

						if (element.Sernp !== "") {
							countSeriado++;
							element.seriado = "si";
						}

						if (element.Charg !== "") {
							countLoteado++;
							element.loteado = "si";
						}

						if (respuestaBusqueda.length === (index + 1)) {
							if (countSeriado === 0) {
								oButtonRecepcionar.setEnabled(true);
							} else {
								MessageBox.information('El pedido de traslado N°' + this.pedidoTraslado +
									' cuenta con una o más posiciones de tipo "Seriado". \n Para recepcionar esté ingreso debe acceder desde el Portal Web.', {
										title: "Aviso",
										onClose: function (sAction) {}.bind(this)
									});
							}
						}
					}.bind(this));
					this.bindView(respuestaBusqueda);

					if (respuestaBusqueda.length === 0 && !respuestaB.resolve) {
						MessageToast.show("Encontramos algunos problemas al consultar la información, intente nuevamente.", {
							duration: 6000
						});
					}

				} else {
					this.BusyDialog.close();
					MessageToast.show("No se encontró información para el detalle del pedido.");
				}

			}.bind(this));

		},

		onValueHelpDialogCloseAlmacen: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oInputAlmacenTraslado = this.getView().byId("oInputAlmacenTraslado");
			oInputAlmacenTraslado.setValue();

			if (oSelectedItem) {
				oInputAlmacenTraslado.setValue(oSelectedItem.getTitle());
			}

		},

		openListAlmacenesCompleta: function (oEvent) {
			this.idAlmacen = oEvent.getSource().getId();
			if (!this._valueDialogListAlmacenesTraslados) {
				this._valueDialogListAlmacenesTraslados = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListAlmacenAll", this);
			}

			var numeroCentro = this.getView().byId("oInputCentroTraslado").getValue();
			var modelAlmacenes = new JSONModel([]);
			this._valueDialogListAlmacenesTraslados.setModel(modelAlmacenes, "modelAlmacenesC");
			this._valueDialogListAlmacenesTraslados.open();
			this._valueDialogListAlmacenesTraslados.setBusy(true);

			this.getAlmacenesERP(numeroCentro).then(function (resultado) {
				modelAlmacenes.setData(resultado);
				modelAlmacenes.refresh();
				if (resultado.length > 100) {
					modelAlmacenes.setSizeLimit(resultado.length);
				}
				this._valueDialogListAlmacenesTraslados.setTitle("Lista de Almacenes (" + modelAlmacenes.getData().length + ")");
				this._valueDialogListAlmacenesTraslados.setBusy(false);
			}.bind(this));

		},

		visibleLoteoTraslados: function (sValue) {
			var retorno = false;
			if (sValue !== undefined) {
				if (sValue === "si") {
					retorno = true;
				}
			} else {
				retorno = false;
			}
			return retorno;
		},

		fechaRevert: function (fecha) {
			var retorno = "";
			if (fecha !== null) {
				fecha = fecha.split("/");
				retorno = new Date(fecha[2] + "/" + fecha[1] + "/" + fecha[0]);
			}
			return retorno;
		},

		bindView: function (data) {

			var oModeloDataTraslados = new JSONModel([]);
			this.getView().setModel(oModeloDataTraslados, "oModeloDataTraslados");

			oModeloDataTraslados.setData(data);
			this.getView().byId("oTitlePosicionesIdTraslados").setText("Posiciones (" + data.length + ")");
			oModeloDataTraslados.refresh();
			this.BusyDialog.close();

		},

		onTrasladar: function () {
			var contenedor = this.getView().byId("oPageDetailId");
			this.validar(this.InputsViewTrasladar, "", contenedor).then(function (respuestaValidar) {
				if (!respuestaValidar) {

					this.validarTodasLasPosicionesSobreZero().then(function (respuesta) {
						if (respuesta) {
							MessageBox.information('¿Seguro que deseas trasladar el pedido?', {
								title: "Aviso",
								actions: ["Si", "No"],
								styleClass: "",
								onClose: function (sAction) {
									if (sAction === "Si") {
										this.trasladoTemporal();
									}
								}.bind(this)
							});
						} else {
							MessageToast.show("Ingresa cantidad de traslado para cada una de las posiciones.", {
								duration: 6000
							});
						}
					}.bind(this));
				} else {
					MessageToast.show("Completa los campos obligatorios para continuar.");
					jQuery.sap.delayedCall(3000, this, function () {
						this.quitarState(this.InputsViewTrasladar, "");
					}.bind(this));
				}
			}.bind(this));
		},

		trasladoTemporal: function () {

			this.openBusyDialog();
			var error = "";
			var nroPedido = this.getView().byId("oInputNroPedidoTraslado").getValue();
			var centro = this.getView().byId("oInputCentroTraslado").getValue();
			var almacen = this.getView().byId("oInputAlmacenTraslado").getValue();

			var recordDataTrasladoERP = {};

			recordDataTrasladoERP.Ikey = "1"; // Edm.String - MaxLength="1" 

			recordDataTrasladoERP.NavEjeTrasladoDoc = [];
			recordDataTrasladoERP.NavEjeTrasladoMen = [];
			recordDataTrasladoERP.NavEjeTrasladoSer = [];
			recordDataTrasladoERP.NavEjeTrasladoPos = [];

			var fecha = new Date();
			fecha.setHours(0);
			fecha.setMinutes(0);
			fecha.setSeconds(0);

			var dataTraslado = {
				ID_TRASLADO: 0,
				NRO_PEDIDO_TRASLADO: nroPedido,
				CENTRO: centro,
				ALMACEN: almacen,
				FECHA_TRASLADO: this.convertFechaXSJS(fecha),
				HORA_TRASLADO: this.horaXSJS(),
				USER_SCP_COD: this.userSCPCod,
				ID_ESTADO_TRASLADO: 5,
				NUMERO_TRASLADO_ERP: "",
				TEXTO_ERROR: ""
			};

			var creacionConError = 0;

			this.createTraslado(dataTraslado).then(function (respuestaIngreso) {
				if (respuestaIngreso.resolve) {
					var idTraslado = respuestaIngreso.idTraslado;
					var idList = this.getView().byId("idListTraslados");

					var posicionesSeleccionadas = idList.getItems();

					var recorrerPosiciones = function (element, index) {
						if (element.length === index) {

							if (creacionConError === 0) {

								this.createTrasladoERP(recordDataTrasladoERP).then(function (respuestaCreateTrasladoERP) {
									if (respuestaCreateTrasladoERP.resolve) {
										this.datosCreacion = {
											ID_AVISO: idTraslado,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivoTraslado(respuestaCreateTrasladoERP.nroDocumento, "2", idTraslado, "").then(function () {
											this.registrarLog("Traslado_Realizado", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialog.close();
												this.preocesoGenerarOCConExito(idTraslado, respuestaCreateTrasladoERP.nroDocumento);
											}.bind(this));
										}.bind(this));
									} else {
										var detail = null;

										if (respuestaCreateTrasladoERP.error.length > 0) {
											detail = respuestaCreateTrasladoERP.errorHtml;
											error = respuestaCreateTrasladoERP.error;
										}
										this.datosCreacion = {
											ID_AVISO: idTraslado,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivoTraslado("", "4", idTraslado, error).then(function () {
											this.registrarLog("Reprocesar_Traslado", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialog.close();
												this.errorAlRecepcionarOC(detail);
											}.bind(this));
										}.bind(this));

									}
								}.bind(this));
							} else {

								this.datosCreacion = {
									ID_AVISO: idTraslado,
									NUMERO_MATERIAL: ""
								};
								this.cambioEstadoMasivoTraslado("", "4", idTraslado, "").then(function () {
									this.registrarLog("Reprocesar_Traslado", this.datosCreacion).then(function (respuestaRegistrarLog) {
										this.BusyDialog.close();
										this.errorAlRecepcionarOC(null);
									}.bind(this));
								}.bind(this));
							}
						} else {
							var posModel = element[index].getBindingContext("oModeloDataTraslados").getObject();
							var pos1 = element[index].getContent()[0].getContent()[1].getContent();

							var cantPen = pos1[0].getItems()[1].getText();

							if (cantPen !== "0") {
								var step = pos1[2].getItems()[1].getValue().toString();
								var loteo = "";
								var vBoxLote = pos1[3];
								var idTipoPosicion = 1;

								if (vBoxLote.getVisible()) {
									loteo = vBoxLote.getItems()[1].getValue();
									idTipoPosicion = 2;
								}

								var dataPosiciones = {
									ID_DETALLE_TRASLADO: 0,
									ID_TRASLADO: idTraslado,
									NUMERO_POSICION: posModel.Ebelp,
									CODIGO_MATERIAL: posModel.Matnr,
									DESCRIPCION_MATERIAL: posModel.Txz01,
									CANTIDAD_MATERIAL_TOTAL: this.formatterInteger(posModel.MengeC).toString(),
									CANTIDAD_MATERIAL_INGRESADO: step,
									UNIDAD_DE_MEDIDA_MATERIAL: posModel.Meins,
									NUMERO_UBICACION: posModel.Lgpbe,
									NUMERO_LOTE: loteo,
									ID_TIPO_POSICION: Number(idTipoPosicion)
								};

								//#region
								var recordCrearDocMatItem = {};

								recordCrearDocMatItem.Ikey = "1"; //Edm.String" Nullable="false" MaxLength="1"
								recordCrearDocMatItem.Ebeln = nroPedido.slice(0, 10); //Edm.String" Nullable="false" MaxLength="10" sap:label="Doc.compras"
								recordCrearDocMatItem.Ebelp = posModel.Ebelp.slice(0, 5); //Edm.String" Nullable="false" MaxLength="5" sap:label="Posición"
								recordCrearDocMatItem.Matnr = posModel.Matnr.slice(0, 18); //Edm.String" Nullable="false" MaxLength="18" sap:label="Material"
								recordCrearDocMatItem.Txz01 = posModel.Txz01.slice(0, 40); //Edm.String" Nullable="false" MaxLength="40" sap:label="Txt.brv."
								recordCrearDocMatItem.Menge = this.formatterInteger(posModel.MengeC).toString().slice(0, 13); //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Cantidad pedido"
								recordCrearDocMatItem.Meins = posModel.Meins.slice(0, 3); //Edm.String" Nullable="false" MaxLength="3" sap:label="UM de pedido"
								recordCrearDocMatItem.Lgpbe = posModel.Lgpbe.slice(0, 16); //Edm.String" Nullable="false" MaxLength="16" sap:label="Denominación"
								recordCrearDocMatItem.Werks = centro.slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Centro"
								recordCrearDocMatItem.Lgort = almacen.slice(0, 4); //Edm.String" Nullable="false" MaxLength="4" sap:label="Almacén"

								if (loteo.length > 0) {
									loteo = loteo.slice(0, 10);
								}

								recordCrearDocMatItem.Charg = loteo; //Edm.String" Nullable="false" MaxLength="10" sap:label="Lote"
								recordCrearDocMatItem.Picking = step; //Edm.Decimal" Nullable="false" Precision="13" Scale="3" sap:label="Cantidad pedido"
								recordCrearDocMatItem.Sernp = ""; //Edm.String" Nullable="false" MaxLength="4" sap:label="Perfil de números de serie"
								recordCrearDocMatItem.Ledat = fecha; //Edm.DateTime" Nullable="false" Precision="7" sap:label="Fecha de creación de la entrega"

								recordDataTrasladoERP.NavEjeTrasladoPos.push(recordCrearDocMatItem);

								//#endregion	

								this.createPosicionTraslado(dataPosiciones).then(function (respuestaPosicionTraslado) {
									if (respuestaPosicionTraslado) {
										index++;
										recorrerPosiciones(element, index);
									} else {
										creacionConError++;
										index++;
										recorrerPosiciones(element, index);
									}
								}.bind(this));
							}

						}
					}.bind(this);
					recorrerPosiciones(posicionesSeleccionadas, 0);
				} else {
					this.BusyDialog.close();
					this.errorAlRecepcionarOC(null);
				}
			}.bind(this));

		},

		preocesoGenerarOCConExito: function (idIngreso, nroDoc) {
			MessageBox.success("El pedido fue trasladado correctamente. \n  \n El documento SAP asociado es el N°" +
				nroDoc + ".", {
					title: "Aviso",
					onClose: function (sAction) {
						this.resetMasterDetail();
					}.bind(this)
				});
		},

		errorAlRecepcionarOC: function (detail) {

			MessageBox.information(
				"No fue posible trasladar el pedido, intenta más tarde o comunícate con el área encargada.", {
					title: "Aviso",
					details: detail,
					contentWidth: "500px",
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
					actions: ["OK"],
					onClose: function (oAction) {
						this.registrarUsoIngreso().then(function () {
							this.resetMasterDetail();
						}.bind(this));
					}.bind(this)
				});

		},

		volverAlListMenu: function () {
			if (this.idEstadoIngreso === "1") {
				MessageBox.information('¿Seguro deseas salir?', {
					title: "Aviso",
					actions: ["Si", "No"],
					styleClass: "",
					onClose: function (sAction) {
						if (sAction === "Si") {
							this.resetMasterDetail();
						}
					}.bind(this)
				});
			} else {
				this.resetMasterDetail();
			}
		},

		resetMasterDetail: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo("Traslados_Master", {
				estadoIngreso: this.idEstadoIngreso
			});
		},

		validarTodasLasPosicionesSobreZero: function (nropedido) {
			return new Promise(
				function resolver(resolve) {

					var idList = this.getView().byId("idListTraslados").getItems();
					var countError = 0;

					var functionRecorrer = function (item, i) {
						if (item.length === i) {
							if (countError === 0) {
								resolve(true);
							} else {
								resolve(false);
							}
						} else {
							var StepInput = item[i].getContent()[0].getContent()[1].getContent()[2].getItems()[1];
							var cantidadPedido = item[i].getContent()[0].getContent()[1].getContent()[0].getItems()[1];
							
							if (StepInput.getValueState() === "Error") {
								countError++;
							}

							if (StepInput.getValue() === 0) {
								StepInput.setValueState("Error");
								countError++;
							}
							
							if (StepInput.getValue() > cantidadPedido) {
								StepInput.setValueState("Error");
								countError++;
							}

							i++;
							functionRecorrer(idList, i);
						}
					}.bind(this);

					if (idList.length > 0) {
						functionRecorrer(idList, 0);
					} else {
						resolve(false);
					}

				}.bind(this));

		},

		onExit: function () {

		}

	});

});