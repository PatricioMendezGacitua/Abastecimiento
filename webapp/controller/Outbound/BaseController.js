sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/TextArea",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/FilterOperator",
	"com/gasco/Abastecimiento/controller/consultaUsuario"
], function (
	Controller, History,
	Filter,
	Dialog,
	Button,
	TextArea,
	JSONModel,
	MessageToast,
	MessageBox,
	FilterOperator,
	consultaUsuario) {
	"use strict";
	return Controller.extend("com.gasco.Abastecimiento.controller.Outbound.BaseController", {

		busquedaNroPedido: function (nropedido) {
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

					/*	if (campo === "NRO_OC") {
							campoBusqueda = "IEbeln";
						} else if (campo === "NRO_MATERIAL") {
							campoBusqueda = "IMatnr";
						} else if (campo === "RUT_PROVEEDOR") {
							campoBusqueda = "IStcd1";
						}*/

					var tFilterCampoBusqueda = new sap.ui.model.Filter({
						path: "IEbeln",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: nropedido
					});
					aFil.push(tFilterCampoBusqueda);

					this.getView().getModel("oModelSAPERP").read('/BuscarPedidoSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							if (datos.length > 0) {

								resolve({
									mensajeError: "",
									datos: datos
								});

								/*if (datos[0].Mensaje.length > 0 && datos[0].Mensaje !== "Pedido liberado") {
									resolve({
										mensajeError: datos[0].Mensaje,
										datos: []
									});
								} else {
									resolve({
										mensajeError: "",
										datos: datos
									});
								}*/
							} else {
								resolve({
									mensajeError: "Número pedido sin posiciones para trasladar",
									datos: []
								});
							}
						}.bind(this),
						error: function (oError) {

							var err = JSON.parse(oError.responseText);

							resolve({
								mensajeError: "Error detectado: " + err.error.message.value,
								datos: []
							});
						}.bind(this)
					});

				}.bind(this));

		},

		busquedaPedidoTrasladoDetalle: function (campo, dato, datosHana) {
			return new Promise(
				function resolver(resolve) {

					if (datosHana.length > 0) {
						resolve({
							mensajeError: "",
							datos: datosHana,
							resolve: true
						});
					} else {
						this.busquedaPedidoTraslado(campo, dato).then(function (respuestaB) {
							resolve(respuestaB);
						}.bind(this));
					}

				}.bind(this));

		},

		busquedaPedidoTraslado: function (campo, dato) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var tFilterIkey = new sap.ui.model.Filter({
						path: "Ikey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "1"
					});
					aFil.push(tFilterIkey);

					var tFilterCampoBusqueda = new sap.ui.model.Filter({
						path: campo,
						operator: sap.ui.model.FilterOperator.EQ,
						value1: dato
					});
					aFil.push(tFilterCampoBusqueda);

					this.getView().getModel("oModelSAPERP").read('/BuscarPedidoTrasladoSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							if (datos.length > 0) {
								resolve({
									mensajeError: "",
									datos: datos,
									resolve: true
								});
							} else {
								resolve({
									mensajeError: "Documento sin posiciones para recepcionar",
									datos: [],
									resolve: true
								});
							}
						}.bind(this),
						error: function (oError) {
							resolve({
								mensajeError: "Intente más tarde",
								datos: [],
								resolve: false
							});
						}.bind(this)
					});

				}.bind(this));

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

				}.bind(this));
		},
		// funcion para cargar en hana 
		cargaHana: function (arrPos, tipo) {
			return new Promise(
				function resolver(resolve, reject) {
					var fecha = new Date();
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);
					var datos = {};
					datos.data = arrPos;

					datos.tipo = tipo;
					datos.FechaInventario = this.convertFechaXSJS(new Date(fecha));
					datos.horaInventario = this.horaXSJS();

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=cargaHana";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(datos),
						success: function (oResult) {
							var respuesta = oResult;
							if (respuesta === "OK") {

								resolve(true);
							} else {
								console.log(respuesta)

								resolve(false);
							}
							resolve(respuesta);
						}.bind(this),
						error: function (oError) {

							resolve(false);
						}.bind(this)
					});

				}.bind(this));
		},
		cargaDetalle: function (datos, reserva, dataPos) {
			var str = "<ul>";
			var cont = 0;
			var contPB = 0;
			this.GeneraDoc = false;
			return new Promise(
				function resolver(resolve, reject) {

					if (datos.length === 0) {
						this.strVerifica += "<li>Para la posición: " + dataPos.Rspos + " ha ocurrido el siguiente error: " + dataPos.Message +
							". </li>";
						resolve({
							resolve: true
								/*,
															detail: this.strVerifica*/

						});
					} else {

						var functionRecorrer = function recorrer(item, i) {

							if (i === item.length) {

								resolve({
									resolve: true,
									/*	detail: this.strVerifica,*/
									datosPosicion: dataPos
								});

								this.registrarLog(this.mensajeLog, this.datosCreacion).then(function (respuestaRegistrarLog) {
									resolve({
										resolve: true,
										datosPosicion: dataPos

									});
								}.bind(this));

							} else {
								if (item[i].Type === "I") {
									if (item[i].Rspos !== "0000") {

										if (dataPos[i].Estado === "EP") {
											this.strVerifica += "<li>Para la posición " + item[i].Rspos +
												" se ha generado la reserva con exito con el siguiente mensaje: " + item[
													i].Message + ". </li>";
											dataPos[i].DocSAP = item[i].Mblnr + "-" + item[i].Mjahr;
											this.docSAP = dataPos[i].DocSAP;
											dataPos[i].Resultado = true;
											this.GeneraDoc = true;

											this.strVerifica += "<p><strong>NRO DOCUMENTO SAP:" + this.docSAP + " </strong> </p>";

										} else {
											this.strVerifica += "<li>Para la posición " + item[i].Rspos + " se ha cambiado de estado a En Preparación. </li>";
											dataPos[i].DocSAP = " - ";
											dataPos[i].Resultado = false;
										}
									}

								} else {

									if (item[i].Rspos !== "0000") {

										this.strVerifica += "<li>Para la posición: " + item[i].Rspos + " ha ocurrido el siguiente error: " + item[i].Message +
											". </li>";
										dataPos[i].Resultado = false;
										dataPos[i].DocSAP = " - ";
										this.docSAP = " - ";
									}
								}
								i++;
								functionRecorrer(item, i);

							}

						}.bind(this);
						//eliminar reserva posicion 00000
						functionRecorrer(datos, 0);
					}
				}.bind(this));
		},

		enviaPorPosicion: function (datos, tipo) {

			return new Promise(
				function resolver(resolve, reject) {
					var functionRecorrer = function (item, i) {
						if (item.length === i) {

							this.strVerifica += "</ul>";

							resolve(true);

						} else {

							this.createReservaERP(item[i], tipo).then(function (respuestaReservaERP) {

								i++;
								functionRecorrer(item, i);

							}.bind(this));

						}

					}.bind(this);
					functionRecorrer(datos, 0)

				}.bind(this));

		},

		createReservaERP: function (datos, tipo) {
			return new Promise(
				function resolver(resolve, reject) {
					console.log(datos);

					var reserva = datos.NavGestReservaPos[0].Rsnum;
					var posicion = datos.NavGestReservaPos[0].Rspos;

					this.getView().getModel("oModelSAPERP").create('/GestReservaSet ', datos, {
						success: function (oResult) {
							console.log(oResult);
							var data = oResult.NavGestReservaDoc.results;
							var dataPos = oResult.NavGestReservaPos.results;

							if (data.length > 0) {

								this.cargaDetalle(data, reserva, dataPos).then(function (respuestaCargaDetalle) {

									this.cargaHana(respuestaCargaDetalle.datosPosicion, tipo).then(function (
										respuestacargaHana) {
										//respuestaCargaDetalle.detail += "</ul>";
										//	resolve: true,
										//	error: ""
										// });

									}.bind(this));

								}.bind(this));
							}

						}.bind(this),
						error: function (oError) {
							console.log(oError);
							var dataError = [];
							var mensaje = "";
							try {
								mensaje = oError.message;
								var record = {};
								record.Rspos = posicion;
								record.Message = mensaje;

								this.cargaDetalle(dataError, reserva, record).then(function (respuestaCargaDetalle) {
									respuestaCargaDetalle.detail += "</ul>";
									this.docSAP = " - ";
									resolve({

										resolve: true,
										detail: respuestaCargaDetalle.detail,
										error: ""
									});

								}.bind(this));

								resolve({

									error: mensaje,
									resolve: false
								});
							} catch (e) {
								resolve({

									error: e.message,
									resolve: false
								});
							}

						}.bind(this)
					});

				}.bind(this));
		},

		cargaPosiciones: function (data, idReserva, tipo) {
			return new Promise(
				function resolver(resolve) {
					var oModel = [];
					var arrayUbicaciones = [];
					var order = 1;

					for (var e = 0; e < data.length; e++) {

						if (data[e].Rsnum === idReserva) {
							/*	if (estado === data[e].Estado) {*/
							(data[e].Charg.length > 0) ? data[e].state = true: data[e].state = false;

							data[e].CantSolicitada = Number(data[e].CantSolicitada);
							data[e].CantPreparada = Number(data[e].CantPreparada);
							data[e].minData = 0;
							data[e].maxData = data[e].CantSolicitada - data[e].CantPreparada;
							data[e].value = 0;
							data[e].ckSelected = false;
							data[e].estadoPosicion = (data[e].Estado === "PB") ? "Preparación Bodega" : "En Preparación";
							(data[e].Lgpbe.length > 0) ? arrayUbicaciones.push(data[e].Lgpbe): "";
							data[e].order = order;
							order++;
							oModel.push(data[e]);

						}
						if (data.length === (e + 1)) {

							if (tipo === "Entrega") {
								resolve(oModel);

							} else {

								this.consultaConOrden(arrayUbicaciones, oModel).then(function (respuestaconsultaConOrden) {
									this.ordenarUbicaciones(respuestaconsultaConOrden, oModel).then(function (respuestaOrdenarUbicaciones) {
										resolve(respuestaOrdenarUbicaciones);
									}.bind(this));
								}.bind(this));
							}
						}
					}

				}.bind(this));
		},

		consultaConOrden: function (arrayUbicaciones, model) {
			return new Promise(
				function resolver(resolve) {
					var oFilters = [];

					var filterEstado = new Filter({
						path: "ID_ESTADO_TX",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: 1
					});

					arrayUbicaciones.forEach(function (element) {
						oFilters.push(new sap.ui.model.Filter({
							path: "CODIGO",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: element
						}));
					}.bind(this));

					var finalFilter = new sap.ui.model.Filter({
						filters: oFilters,
						and: false
					});

					var finalFinalFilter = new sap.ui.model.Filter({
						filters: [finalFilter, filterEstado],
						and: true
					});

					this.getView().getModel("oModeloHanaSalida").read("/PrioridadUbicacion", {
						filters: [finalFinalFilter],
						sorters: [
							new sap.ui.model.Sorter("ORDEN", false),
							new sap.ui.model.Sorter("CODIGO", false)
						],
						success: function (oResults) {
							resolve(oResults.results);
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});
				}.bind(this));
		},

		ordenarUbicaciones: function (arrayUbicacionesHana, oModel) {
			return new Promise(
				function resolver(resolve) {
					var arrayNuevo = [];
					var functionRecorrer = function (item, i) {
						var ultimoNumero = arrayUbicacionesHana[arrayUbicacionesHana.length - 1].ORDEN;
						if (item.length === i) {

							oModel.forEach(function (element2, index2) {

								if (element2.flagOrden !== "X") {
									ultimoNumero++;
									element2.order = ultimoNumero;
									arrayNuevo.push(element2);
								}

								if (oModel.length === (index2 + 1)) {
									resolve(arrayNuevo);
								}

							}.bind(this));

						} else {

							var pos = item[i];

							oModel.forEach(function (element, index) {

								if (pos.CODIGO === element.Lgpbe) {
									var record = element;
									record.order = pos.ORDEN;
									arrayNuevo.push(record);
									element.flagOrden = "X";

								}

								if (oModel.length === (index + 1)) {
									i++;
									functionRecorrer(item, i);
								}

							}.bind(this));

						}
					}.bind(this);
					if (arrayUbicacionesHana.length > 0) {
						functionRecorrer(arrayUbicacionesHana, 0);
					} else {
						resolve(oModel);
					}

				}.bind(this));
		},

		busquedaReserva: function (nroSAP, sValueTipo, tipo) {
			return new Promise(
				function resolver(resolve) {
					var aFil = [];
					var datosFinal = [];
					var datosF = [];
					var campoBusqueda = "";
					var tFilterIkey = new sap.ui.model.Filter({
						path: "Ikey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "1"
					});
					aFil.push(tFilterIkey);

					/*	if (campo === "NRO_OC") {
							campoBusqueda = "IEbeln";
						} else if (campo === "NRO_MATERIAL") {
							campoBusqueda = "IMatnr";
						} else if (campo === "RUT_PROVEEDOR") {
							campoBusqueda = "IStcd1";
						}*/

					var tFilterCampoBusqueda = new sap.ui.model.Filter({
						path: "IBodeguero",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: nroSAP
					});
					aFil.push(tFilterCampoBusqueda);

					var tFilterTipo = new sap.ui.model.Filter({
						path: "ITipo",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sValueTipo
					});
					aFil.push(tFilterTipo);

					this.getView().getModel("oModelSAPERP").read('/ConsReservaSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;
							var estado;
							if (tipo === "Reserva") {
								estado = "PB";
							} else {
								estado = "EP";
							}
							if (datos.length > 0) {
								console.log(datos);

								for (var e = 0; e < datos.length; e++) {
									var record = {};
									record.TIPO_DESPACHO = datos[e].TipoDespacho;
									record.DENOMINACION = datos[e].Maktx;
									record.CENTRO = datos[e].Werks;
									record.ALMACEN = datos[e].Lgort;
									record.MATERIAL = datos[e].Matnr;
									record.TEXTO_BREVE = datos[e].ItemText;
									record.EJECUTADO = datos[e].Uexnam;
									record.CANT_SOL = datos[e].CantSolicitada;
									record.FECHA_A_PRESENTAR = this.convertFechaXSJS(datos[e].Dexdat);
									record.HORA_A_PRESENTAR = this.getHora(datos[e].Texdat);
									record.NRORESERVA = datos[e].Rsnum;
									record.TITULO_ESTADO_INGRESO = (sValueTipo === "PEN") ? "Pendiente" : "Pend. Reserva";
									record.STATE_ESTADO_INGRESO = "Warning"; // (sValueTipo === "PEN") ? "Warning" : "Warning";
									datosFinal.push(record);
									/*if (datos[e].Estado === estado) {
										datosFinal.push(record);
									}*/
									if (datos.length === (e + 1)) {

										datosF = this.eliminaDuplicado(datosFinal, "NRORESERVA");

										var data = new JSONModel(datos);
										var tipoModelo = (tipo = "Reserva") ? "oModeloTemporalesReservaCore" : "oModeloTemporalesEntregaCore";
										sap.ui.getCore().setModel(data, tipoModelo);
										var model = sap.ui.getCore().getModel(tipoModelo).getData();

										resolve({
											mensajeError: "",
											datos: datosF
										});
									}
								}

								/*if (datos[0].Mensaje.length > 0 && datos[0].Mensaje !== "Pedido liberado") {
									resolve({
										mensajeError: datos[0].Mensaje,
										datos: []
									});
								} else {
									resolve({
										mensajeError: "",
										datos: datos
									});
								}*/
							} else {

								resolve({
									mensajeError: "Número pedido sin posiciones para trasladar",
									datos: []
								});
							}
						}.bind(this),
						error: function (oError) {

							var err = oError.message;

							resolve({
								mensajeError: "Error detectado: " + err.error.message.value,
								datos: []
							});
						}.bind(this)
					});

				}.bind(this));

		},

		openMoreOption: function (oEvent) {

			var oButton = oEvent.getSource();

			if (!this._menu) {
				this._menu = sap.ui.xmlfragment(
					"com.gasco.Abastecimiento.view.fragments.MenuItem",
					this
				);
				this.getView().addDependent(this._menu);
			}

			var eDock = sap.ui.core.Popup.Dock;
			this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

		},

		onUpperCase: function (oEvent) {
			var obj = oEvent.getSource();
			var retorno = obj.setValue(obj.getValue().replace(/[^-A-Za-z0-9]+/g, '').toUpperCase());
			return retorno;
		},

		onUpperCase2: function (oEvent) {
			var obj = oEvent.getSource();
			var retorno = obj.setValue(obj.getValue().replace(/[^ -ZA-za-z0-9]+/g, '').toUpperCase());
			return retorno;
		},

		onlyNumber: function (oEvent) {
			var obj = oEvent.getSource();
			var retorno = obj.setValue(obj.getValue().replace(/[^0-9]+/g, ''));
			return retorno;
		},

		onlyDecimal: function (oEvent) {
			var obj = oEvent.getSource();
			var retorno = obj.setValue(obj.getValue().replace(/[^,0-9]+/g, ''));
			return retorno;
		},

		formatterEditableZero: function (sValue) {
			var retorno = true;
			if (sValue !== null) {
				sValue = sValue.replace(/ /g, "");
			} else {
				retorno = false;
			}

			if (sValue === "0") {
				retorno = false;
			}

			return retorno;
		},

		formatterTextoAlmacen: function (sValue) {
			var retorno = "Asignar";
			if (sValue !== null) {
				if (sValue !== "") {
					retorno = sValue.replace(/ /g, "");
				}
			}

			return retorno;
		},

		formatterActiveAlmacen: function (sValue) {
			var retorno = false;
			if (sValue !== null) {
				if (sValue === "") {
					retorno = true;
				}
			}

			return retorno;
		},

		formatterInteger: function (sValue) {
			var retorno = 0;
			if (sValue !== undefined) {
				if (sValue !== null) {
					sValue = sValue.replace(/ /g, "");
					retorno = sValue.replace(/\./g, "");
				}
			}

			return Number(retorno);
		},

		visibleLoteo: function (sValue) {
			var retorno = true;
			if (sValue !== null) {
				sValue = sValue.replace(/ /g, "");
				if (sValue.length === 0) {
					retorno = false;
				}
			} else {
				retorno = false;
			}
			return retorno;
		},

		visibleTituloEstadoPosicion: function (sValue) {
			var retorno = true;
			if (sValue !== null) {

				if (sValue === "Recepción Terreno") {
					retorno = false;
				}
			} else {
				retorno = false;
			}
			return retorno;
		},

		enabledListItemEstadoPosicion: function (sValue) {
			var retorno = true;
			if (sValue !== null) {

				if (sValue === "Recepción Supervisor") {
					retorno = false;
				}
			} else {
				retorno = true;
			}
			return retorno;
		},

		formatterSelectedRecepcion: function (sValue) {
			var retorno = false;
			if (sValue !== null) {
				sValue = sValue.replace(/ /g, "");
			}
			if (sValue > 0) {
				retorno = true;
			}

			return retorno;
		},

		createIngreso: function (datos, idEstadoIngreso) {
			return new Promise(
				function resolver(resolve, reject) {

					var service = "NO";

					if (idEstadoIngreso === 4) {
						service = "SI";
						datos.ID_ESTADO_INGRESO = idEstadoIngreso;
					}
					datos.UPDATE = service;

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=ingresoDos";

					var json = datos;

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve({
								idIngreso: datos.ID_INGRESO,
								resolve: true
							});
						}.bind(this),
						error: function (oError) {
							resolve({
								idIngreso: datos.ID_INGRESO,
								resolve: false
							});
						}.bind(this)
					});

				}.bind(this));
		},

		createIngresoERP: function (datos) {
			return new Promise(
				function resolver(resolve, reject) {

					this.getView().getModel("oModeloSAPERP").create('/CrearDocMatSet', datos, {
						success: function (oResult) {

							var respuesta = oResult.navCrearDocMatDocumento.EMblnr + "-" + oResult.navCrearDocMatDocumento.EMjahr;

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

		createPosicionIngreso: function (datos, idEstadoIngreso) {
			return new Promise(
				function resolver(resolve, reject) {

					var service = "NO";

					if (idEstadoIngreso === 4) {
						service = "SI";
						datos.ID_ESTADO_POSICION = idEstadoIngreso;
					}
					datos.UPDATE = service;

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=posicionDos";

					var json = datos;

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve(true);
						}.bind(this),
						error: function (oError) {
							resolve(false);
						}.bind(this)
					});

				}.bind(this));
		},

		temporalesPorUsuarioConectado: function (user, idIngreso, idEstadoIngreso, detalle) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=temporalesPorUsuarioConectado";

					var json = {
						USER_SCP_COD: user,
						ID_INGRESO: idIngreso,
						ID_ESTADO_INGRESO: idEstadoIngreso,
						DETALLE: detalle
					};

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
		},

		cambioEstadoMasivo: function (nroDocuento, idEstadoIngreso, idIngreso, textoError) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=cambioEstadoMasivo";

					var json = {
						NUMERO_INGRESO_ERP: nroDocuento,
						ID_INGRESO: idIngreso,
						ID_ESTADO_INGRESO: idEstadoIngreso,
						TEXTO_ERROR: textoError
					};

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
		},

		changeEstadoTresIngreso: function (idIngreso) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=estadoTresIngreso";

					var json = {
						ID_INGRESO: idIngreso
					};

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve(respuesta);
						}.bind(this),
						error: function (oError) {
							console.log(oError);
							resolve([]);
						}.bind(this)
					});

				}.bind(this));
		},

		consultaIngresoTomado: function () {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=ingresoTomado";

					var json = {
						ID_INGRESO: this.idIngreso,
						USER_SCP_COD: this.userSCPCod
					};

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							if (respuesta.length > 0) {
								resolve({
									resolve: true,
									data: respuesta
								});
							} else {
								resolve({
									resolve: false,
									data: respuesta
								});
							}
						}.bind(this),
						error: function (oError) {
							console.log(oError);
							resolve({
								resolve: false,
								data: oError
							});
						}.bind(this)
					});

				}.bind(this));
		},

		/*registrarUsoIngreso: function () {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=registrarUsoIngreso";

					var fecha = new Date();
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);

					var json = {
						ID_INGRESO: this.idIngreso,
						USER_SCP_COD: this.userSCPCod,
						FECHA: this.formatterFechaXSJS(fecha),
						HORA: this.horaXSJS()
					};

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							resolve();
						}.bind(this),
						error: function (oError) {
							console.log(oError);
							resolve();
						}.bind(this)
					});

				}.bind(this));
		},*/

		consultaUser: function () {

			// FUNCIÓN DETECTA CUANDO UN USUARIO VUELVE A LA APLICACIÓN, Y SE CONSULTA SI EXISTE UN CAMBIO DE USUARIO.
			document.addEventListener('resume', function () {
				setTimeout(function () {
					this.consultaNuevoUsuario();
				}.bind(this), 0);
			}.bind(this));
		},

		consultaNuevoUsuario: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var correo_inst = this._oStorage.get("correo_IngresoMercaderia");
			this.openBusyDialogCargando();
			if (correo_inst !== null) {
				consultaUsuario.datosUsuario().then(function (respuesta) {

					if (respuesta.resolve) {
						if (respuesta.userMail !== correo_inst) {
							this.BusyDialogCargando.close();
							this.getOwnerComponent().getRouter().navTo("cargando");
						} else {
							this.BusyDialogCargando.close();
						}
					} else {
						this.BusyDialogCargando.close();
						this.getOwnerComponent().getRouter().navTo("cargando");
					}

				}.bind(this));
			} else {
				this.BusyDialogCargando.close();
				this.getOwnerComponent().getRouter().navTo("cargando");
			}

		},

		onLineOffLine: function (view) {
			window.addEventListener('online', function () {
				this.BusyReconectando.close();
			}.bind(this));
			window.addEventListener('offline', function () {
				this.openBusyReconectando();
			}.bind(this));
		},

		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		byId: function (id) {
			return this.getView().byId(id);
		},
		CbyId: function (id) {
			return sap.ui.getCore().byId(id);
		},

		getObjetId: function (sName) {
			return this.getView().byId(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		openBusyReconectando: function (oEvent) {

			if (!this.BusyReconectando) {
				this.BusyReconectando = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.BusyReconectando", this);
			}

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyReconectando);
			this.BusyReconectando.open();
		},

		openBusyDialog: function (oEvent) {

			if (!this.BusyDialog) {
				this.BusyDialog = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.BusyDialog", this);
			}

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyDialog);
			this.BusyDialog.open();
		},

		openBusyDialogCargando: function (oEvent) {

			if (!this.BusyDialogCargando) {
				this.BusyDialogCargando = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.BusyDialogCargando", this);
			}

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyDialogCargando);
			this.BusyDialogCargando.open();
		},

		onBackHome: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			MessageBox.information('¿Seguro deseas salir?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", null);
						this._route.navTo("cargando");
					}
				}.bind(this)
			});

		},

		_dialogActualizaDatos: function (oEvent) {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

			this._valueDialogActualizaDatos = sap.ui.xmlfragment(
				"com.gasco.Abastecimiento.view.fragments.dialogoActualizaDatos", this);

			this._valueDialogActualizaDatos.attachAfterClose(function () {
				this._valueDialogActualizaDatos.destroy();
			}.bind(this));

			var datos = this._oStorage.get("datos_user_IngresoMercaderia");
			var modelUser = new JSONModel(datos);
			this._valueDialogActualizaDatos.setModel(modelUser, "oModelUser");

			this._valueDialogActualizaDatos.open();

			var versionApp = "Versión v1.7.0";
			sap.ui.getCore().byId("versionAppId").setText(versionApp);

		},

		dialogActualizaDatosClose: function () {
			this._valueDialogActualizaDatos.destroy();
		},

		openListAlmacenesSupervisor: function (oEvent) {
			var obj = oEvent.getSource();
			var datos = obj.getBindingContext("oModeloDataTemporal").getObject();
			var numeroCentro = datos.CENTRO;
			this.seleccionAlmacen = obj.getText();
			this.openListAlmacenesBase(numeroCentro, obj);
		},

		openListAlmacenesInbound: function (oEvent) {
			var obj = oEvent.getSource();
			var datos = obj.getBindingContext("oModeloDataTemporalDetailReserva").getObject();
			var path = obj.getBindingContext("oModeloDataTemporalDetailReserva").getPath();
			path = path.slice(1, path.length);

			this.byId("idtableLPReserva").getItems()[path].getContent()[0].getItems()[0].getContent()[6].getItems()[1].setType("Ghost");

			var numeroCentro = datos.Werks;
			this.seleccionAlmacen = obj.getText();
			this.openListAlmacenesBase(numeroCentro, obj);

		},

		openListAlmacenesCompleta: function () {

			if (!this._valueDialogListAlmacenes) {
				this._valueDialogListAlmacenes = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListAlmacenes", this);
			}
			var modelAlmacenes = new JSONModel([]);
			this._valueDialogListAlmacenes.setModel(modelAlmacenes, "modelAlmacenes");
			this._valueDialogListAlmacenes.open();
			this._valueDialogListAlmacenes.setBusy(true);
			this.getAlmacenesERPCompleto().then(function (resultado) {
				modelAlmacenes.setData(resultado);
				modelAlmacenes.refresh();
				if (resultado.length > 100) {
					modelAlmacenes.setSizeLimit(resultado.length);
				}
				this._valueDialogListAlmacenes.setTitle("Lista de Almacenes (" + resultado.length + ")");
				this._valueDialogListAlmacenes.setBusy(false);
			}.bind(this));

		},
		openListAlmacenesBase: function (numeroCentro, obj) {
			this.buttonAsignarAlmacen = obj;
			if (!this._valueDialogListAlmacenes) {
				this._valueDialogListAlmacenes = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListAlmacenes", this);
			}

			var modelAlmacenes = new JSONModel([]);
			this._valueDialogListAlmacenes.setModel(modelAlmacenes, "modelAlmacenes");
			this._valueDialogListAlmacenes.open();
			this._valueDialogListAlmacenes.setBusy(true);
			this.getAlmacenesERP(numeroCentro).then(function (resultado) {
				modelAlmacenes.setData(resultado);
				modelAlmacenes.refresh();
				if (resultado.length > 100) {
					modelAlmacenes.setSizeLimit(resultado.length);
				}
				this._valueDialogListAlmacenes.setTitle("Lista de Almacenes (" + resultado.length + ")");
				this._valueDialogListAlmacenes.setBusy(false);
			}.bind(this));

		},

		dialogListAlmacenesClose: function () {
			this._valueDialogListAlmacenes.close();
		},

		onValueHelpDialogClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {
				this.seleccionAlmacen = oSelectedItem.getTitle();
			}
			this.buttonAsignarAlmacen.setText(this.seleccionAlmacen);
		},

		onSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var filterFinal = [];
			if (sValue.trim().length > 0) {
				var oFilterNumeroAlmacen = new Filter({
					path: "Lgort",
					operator: FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});
				var oFilterDenominacion = new Filter({
					path: "Lgobe",
					operator: FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});

				filterFinal = new Filter({
					filters: [oFilterNumeroAlmacen, oFilterDenominacion],
					and: false
				});
			}
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter(filterFinal);
		},

		getAlmacenesERP: function (numeroCentro) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var tFilterCentro = new sap.ui.model.Filter({
						path: "IWerks",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroCentro
					});
					aFil.push(tFilterCentro);

					this.getView().getModel("oModeloSAPERP").read('/ListaAlmacenSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								resolve(datos);
							} else {
								resolve([]);
							}
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));

		},

		getMaterialesPorCentroERP: function (numeroCentro) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var tFilterCentro = new sap.ui.model.Filter({
						path: "IWerks",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroCentro
					});
					aFil.push(tFilterCentro);

					if (this.numeroCentroSeleccion !== numeroCentro) {
						this.getView().getModel("oModelSAPERP").read('/BuscarMaterialSet', {
							filters: aFil,
							success: function (oResult) {
								var datos = oResult.results;
								this.numeroCentroSeleccion = numeroCentro;
								this.materialesPorCentro = datos;
								if (datos.length > 0) {
									resolve(datos);
								} else {
									resolve([]);
								}
							}.bind(this),
							error: function (oError) {
								this.materialesPorCentro = [];
								resolve([]);
							}.bind(this)
						});
					} else {
						resolve(this.materialesPorCentro);
					}

				}.bind(this));

		},

		getMaterialesPorCodigoMaterialCentroERP: function (numeroMaterial, numeroCentro) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var tFilterNumMat = new sap.ui.model.Filter({
						path: "IMatnr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroMaterial
					});
					aFil.push(tFilterNumMat);

					var tFilterCentro = new sap.ui.model.Filter({
						path: "IWerks",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroCentro
					});
					aFil.push(tFilterCentro);

					this.getView().getModel("oModelSAPERP").read('/BuscarMaterialSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								resolve(datos);
							} else {
								resolve([]);
							}
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));

		},

		getLoteMaterialesERP: function (numeroMaterial, numeroCentro) {
			return new Promise(
				function resolver(resolve) {

					var aFil = [];
					var tFilterNumMat = new sap.ui.model.Filter({
						path: "IMatnr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroMaterial
					});
					aFil.push(tFilterNumMat);

					var tFilterCentro = new sap.ui.model.Filter({
						path: "IWerks",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: numeroCentro
					});
					aFil.push(tFilterCentro);

					this.getView().getModel("oModelSAPERP").read('/ListaLoteSet', {
						filters: aFil,
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								resolve(datos);
							} else {
								resolve([]);
							}
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));

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

		getCentrosERP: function () {
			return new Promise(
				function resolver(resolve) {

					this.getView().getModel("oModelSAPERP").read('/ListaCentroSet', {
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								resolve(datos);
							} else {
								resolve([]);
							}
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));

		},

		onBackMenu: function () {
			this._oStorage.put("logeoIngresoMerecaderia", null);
			this._route.navTo("cargando");
		},

		eliminaDuplicado: function (tuArreglo, atributodetuArreglo) {
			var nuevoArreglo = [];
			var nuevoJson = {};

			for (var i in tuArreglo) {
				nuevoJson[tuArreglo[i][atributodetuArreglo]] = tuArreglo[i];
			}

			for (i in nuevoJson) {
				nuevoArreglo.push(nuevoJson[i]);
			}
			return nuevoArreglo;
		},

		validar: function (fields, accion, contenedor) {

			return new Promise(
				function resolver(resolve, reject) {
					var value;
					var error = false;
					var pagina = contenedor;

					var funcintionRecorrer = function (field, i) {

						if (field.length === i) {
							resolve(error);
						} else {
							var input = sap.ui.getCore().byId(field[i].id + accion) || this.getView().byId(field[i].id + accion);

							if (field[i].required) {
								if (input.getVisible()) {
									if (field[i].type === "ip") {
										value = input.getValue();
										if (value === "" || value.trim().length === 0) {
											error = true;
											pagina.scrollToElement(input, 500);
											input.setValueState("Error");
											jQuery.sap.delayedCall(500, this, function () {
												i++;
												funcintionRecorrer(field, i);
											});
										} else {
											i++;
											funcintionRecorrer(field, i);
										}
									} else if (field[i].type === "dt") {
										value = input.getDateValue();
										if (value === null) {
											error = true;
											pagina.scrollToElement(input, 500);
											input.setValueState("Error");
											jQuery.sap.delayedCall(500, this, function () {
												i++;
												funcintionRecorrer(field, i);
											});
										} else {
											i++;
											funcintionRecorrer(field, i);
										}

									} else if (fields[i].type === "txt" || fields[i].type === "txt3") {
										value = input.getText();
										if (value.length === 0) {
											MessageToast.show("Registra la firma para continuar");
											error = true;
											pagina.scrollToElement(input, 500);
											jQuery.sap.delayedCall(500, this, function () {
												i++;
												funcintionRecorrer(field, i);
											});
										} else {
											i++;
											funcintionRecorrer(field, i);
										}

									} else if (field[i].type === "chk") {
										value = input.getSelected();
										if (!value) {
											pagina.scrollToElement(input, 500);
											input.setValueState("Error");
											error = true;
											jQuery.sap.delayedCall(500, this, function () {
												i++;
												funcintionRecorrer(field, i);
											});
										} else {
											i++;
											funcintionRecorrer(field, i);
										}

									} else {
										value = input.getSelectedKey();
										if (value.length === 0) {
											error = true;
											pagina.scrollToElement(input, 500);
											input.setValueState("Error");
											jQuery.sap.delayedCall(500, this, function () {
												i++;
												funcintionRecorrer(field, i);
											});
										} else {
											i++;
											funcintionRecorrer(field, i);
										}

									}
								} else {
									i++;
									funcintionRecorrer(field, i);
								}
							} else {
								i++;
								funcintionRecorrer(field, i);
							}

						}

					}.bind(this);
					funcintionRecorrer(fields, 0);
				}.bind(this));

		},

		validarALoMenosUnoSeleccionado: function () {

			return new Promise(
				function resolver(resolve, reject) {
					var countError = 0;
					var idList = this.getView().byId("idtableLPHIRecepcion");

					var funcintionRecorrer = function (field, i) {

						if (field.length === i) {
							if (countError > 0) {
								resolve(false);
							} else {
								resolve(true);
							}
						} else {
							var pos0 = field[i].getContent()[0].getContent()[0].getContent();
							var pos1 = field[i].getContent()[0].getContent()[1].getContent();
							var cantPen = pos1[4].getItems()[1].getText();

							if (pos1[6].getItems()[1].getEnabled() && pos1[6].getItems()[1].getValue() === 0) {
								countError++;
							}

							if (pos1[7].getItems()[0].getEnabled() && !pos1[7].getItems()[0].getSelected()) {
								countError++;
							}

							if (pos1[8].getVisible() && pos1[8].getItems()[1].getValue().length === 0) {
								countError++;
							}
							i++;
							funcintionRecorrer(field, i);
						}

					}.bind(this);
					funcintionRecorrer(idList.getItems(), 0);
				}.bind(this));

		},

		validarALoMenosUnoSeleccionadoSupervisor: function () {

			return new Promise(
				function resolver(resolve, reject) {
					var countErrorSelected = 0;
					var countErrorZero = 0;
					var countErrorAlmacen = 0;
					var idList = this.getView().byId("idtableLPHIRecepcion");

					var funcintionRecorrer = function (field, i) {

						if (field.length === i) {
							if (countErrorSelected === idList.getItems().length || countErrorZero > 0 || countErrorAlmacen > 0) {
								resolve(false);
							} else {
								resolve(true);
							}
						} else {
							var pos0 = field[i].getContent()[0].getContent()[0].getContent();
							var pos1 = field[i].getContent()[0].getContent()[1].getContent();
							var cantPen = pos1[4].getItems()[1].getText();
							var almacen = pos1[2].getItems()[1].getText();

							if ((pos1[7].getItems()[0].getEnabled() && pos1[7].getItems()[0].getSelected()) && pos1[6].getItems()[1].getEnabled() && pos1[
									6].getItems()[1].getValue() === 0 && almacen === "Asignar") {
								countErrorZero++;
							}

							if ((pos1[7].getItems()[0].getEnabled() && pos1[7].getItems()[0].getSelected()) && pos1[6].getItems()[1].getEnabled() &&
								almacen === "Asignar") {
								countErrorAlmacen++;
							}

							if (pos1[7].getItems()[0].getEnabled() && !pos1[7].getItems()[0].getSelected()) {
								countErrorSelected++;
							}

							i++;
							funcintionRecorrer(field, i);
						}

					}.bind(this);
					funcintionRecorrer(idList.getItems(), 0);
				}.bind(this));

		},

		vaciar: function (fields, accion) {

			return new Promise(
				function resolver(resolve, reject) {

					var funcintionRecorrer = function (field, i) {

						if (field.length === i) {
							resolve();
						} else {
							var input = sap.ui.getCore().byId(field[i].id + accion) || this.getView().byId(field[i].id + accion);

							if (field[i].type === "ip" || field[i].type === "dt") {
								input.setValue();
								input.setValueState("None");
								i++;
								funcintionRecorrer(field, i);
							} else if (field[i].type === "txt") {
								input.setText();
								input.getParent().getItems()[2].getItems()[0].setSrc();
								i++;
								funcintionRecorrer(field, i);
							} else if (field[i].type === "txt3") {
								input.setText();
								input.getParent().getItems()[2].getContent()[1].getItems()[0].setSrc();
								i++;
								funcintionRecorrer(field, i);
							} else if (field[i].type === "chk") {
								input.setSelected();
								input.setValueState("None");
								i++;
								funcintionRecorrer(field, i);
							} else {
								input.setSelectedKey();
								input.setValueState("None");
								i++;
								funcintionRecorrer(field, i);
							}
						}
					}.bind(this);
					funcintionRecorrer(fields, 0);
				}.bind(this));
		},

		quitarState: function (fields, accion) {
			var error = false;

			for (var i = 0; i < fields.length; i++) {
				var input = sap.ui.getCore().byId(fields[i].id + accion) || this.getView().byId(fields[i].id + accion);
				if (fields[i].type !== "txt" || fields[i].type !== "txt3") {
					input.setValueState("None");
				}
			}
			return error;
		},

		functionDisablePicker: function (arr) {

			for (var i = 0; i < arr.length; i++) {
				var oDatePicker = this.getView().byId(arr[i].id);

				if (arr[i].type === "dateMin") {
					oDatePicker.setMinDate(new Date());
				} else if (arr[i].type === "dateMax") {
					oDatePicker.setMaxDate(new Date());
				}
				oDatePicker.setValue();

				oDatePicker.addEventDelegate({
					onAfterRendering: function () {
						var oDateInner = this.$().find('.sapMInputBaseInner');
						var oID = oDateInner[0].id;
						$('#' + oID).attr("disabled", "disabled");
					}
				}, oDatePicker);
			}

		},

		hora: function () {
			var fecha = new Date();
			var seconds = fecha.getSeconds();
			var minutes = fecha.getMinutes();
			var hour = fecha.getHours();
			var hora = "PT" + hour + "H" + minutes + "M" + seconds + "S";
			hora = hora.replace(/\:/g, "");
			return hora;
		},

		horaXSJS: function () {
			var fecha = new Date();
			var seconds = fecha.getSeconds();
			var minutes = fecha.getMinutes();
			var hour = fecha.getHours();
			var hora = (hour < 10 ? "0" + hour : hour) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds :
				seconds);
			return hora;
		},

		formatterFechaXSJS: function () {

			var fecha1 = new Date();
			var year = fecha1.getFullYear();
			var mes = (fecha1.getMonth() < 10) ? "0" + (fecha1.getMonth() + 1) : (fecha1.getMonth() + 1);
			var dia = (fecha1.getDate() < 10) ? "0" + fecha1.getDate() : fecha1.getDate();
			var fechaFinal1 = year + "-" + mes + "-" + dia;

			var result = fechaFinal1;

			return result;

		},

		createPosicionIngresoXSODATA: function (datos) {
			return new Promise(function t(resolve, reject) {
				this.getView().getModel("oModeloHanaIngresoMercaderia").createEntry("Posicion", {
					properties: datos,
					success: function (oResult) {
						resolve(true);
					}.bind(this),
					error: function (oError) {
						resolve(false);
					}.bind(this)
				});
				this.getView().getModel("oModeloHanaIngresoMercaderia").submitChanges({
					success: function () {}.bind(this),
					error: function () {}.bind(this)
				});
			}.bind(this));
		},

		createIngresoXSODATA: function (datos) {
			return new Promise(function t(resolve, reject) {
				this.getView().getModel("oModeloHanaIngresoMercaderia").createEntry("Ingreso", {
					properties: datos,
					success: function (oResult) {
						resolve({
							idIngreso: oResult.ID_INGRESO,
							resolve: true
						});
					}.bind(this),
					error: function (oError) {
						resolve({
							idIngreso: null,
							resolve: false
						});
					}.bind(this)
				});
				this.getView().getModel("oModeloHanaIngresoMercaderia").submitChanges({
					success: function () {}.bind(this),
					error: function () {}.bind(this)
				});
			}.bind(this));
		},

		convertFechaXSJS: function (fecha) {

			var fecha1 = fecha;
			var year = fecha1.getFullYear();
			var mes = (fecha1.getMonth() < 9) ? "0" + (fecha1.getMonth() + 1) : (fecha1.getMonth() + 1);
			var dia = (fecha1.getDate() < 9) ? "0" + fecha1.getDate() : fecha1.getDate();
			var fechaFinal1 = dia + "." + mes + "." + year;

			var result = fechaFinal1;

			return result;

		},

		logOutApp: function () {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this._oStorage.put("logeoIngresoMerecaderia", null);
			sap.hybrid.kapsel.doDeleteRegistration();
			navigator.app.exitApp();
		},

		//   R E G I S T R O   L O G   Y   A L E R T A S

		registrarLog: function (actividad, datos) {
			return new Promise(
				function resolver(resolve, reject) {

					this.fecha = new Date();
					this.fecha.setHours(0);
					this.fecha.setMinutes(0);
					this.fecha.setSeconds(0);

					if (actividad === "Traspaso_Realizado") {
						this.contenido =
							"La actividad que se acaba de realizar corresponde a la realización de un traspaso con el número de documento sap " + datos.NRO_DOCUMENTO_SAP +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Inventario_Realizado") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la realización de un inventario" +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Tarea_Finalizada") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la finalización de la tarea N°" + datos.ID_TAREA +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Paso_reserva_corralito") {
						this.contenido = "La posición " + datos.Rspos + " de la Reserva N° " + datos.reserva +
							" enviada a corralito con número documento sap " + datos.NRO_DOCUMENTO_SAP + ", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Cambio_estado_reserva") {
						this.contenido = "La posición " + datos.Rspos + " de la Reserva N° " + datos.reserva +
							"  cambiada de estado a En preparación, acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Entrega_realizada") {
						this.contenido = "Reserva N° " + datos.reserva + " fue entregada con exito, acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Traslado_Realizado") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la realización del traslado del pedido N° " + datos.NRO_PEDIDO_TRASLADO + " con el número de documento sap  " + datos.NUMERO_DOCUMENTO + ", acción realizada por el usuario " + this.userSCPCod;
					}

					this.contenidoLog = {
						ID_LOG: 0,
						TX: datos.TX,
						ID_ACTIVIDAD: actividad,
						FECHA: this.fecha,
						HORA: this.hora(),
						USER_SCP_COD: this.userSCPCod,
						DESCRIPCION: this.contenido + " - " + this.userSCPName + "."
					};

					this.getView().getModel("oModeloHanaIngresoMercaderia").createEntry('Log', {
						properties: this.contenidoLog
					});

					this.getView().getModel("oModeloHanaIngresoMercaderia").submitChanges({
						success: function (oResultado) {

							this.consultaAlertas(actividad).then(function (respuestaConsultaAlertas) {

								if (respuestaConsultaAlertas) {
									resolve(true);
								}

							}.bind(this));

						}.bind(this),
						error: function (oError) {

						}.bind(this)
					});

				}.bind(this));

		},

		consultaAlertas: function (actividad) {

			return new Promise(
				function resolver(resolve, reject) {

					var aFil = [];
					var tFilter = new sap.ui.model.Filter({
						path: "ID_ACTIVIDAD",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: actividad
					});
					aFil.push(tFilter);
					var tFilterEstado = new sap.ui.model.Filter({
						path: "ID_ESTADO_TX",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: 1
					});
					aFil.push(tFilterEstado);
					this.getView().getModel("oModeloHanaIngresoMercaderia").read('/Alerta', {
						filters: aFil,
						urlParameters: {
							"$expand": ["AlertaToGrupo", "AlertaToGrupo/GrupoAlertaToGrupoAlertaUsuario"]
						},
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								var functionRecorrer = function (item, i) {
									if (item.length === i) {
										resolve(true);
									} else {
										var grupoAlerta = item[i].AlertaToGrupo.results;
										if (grupoAlerta.length > 0) {
											var destinatariosAlerta = grupoAlerta[0].GrupoAlertaToGrupoAlertaUsuario.results;
											if (destinatariosAlerta.length > 0) {
												this.prepareSendMailAlerta(destinatariosAlerta, item[i].ASUNTO, item[i].CONTENIDO).then(function (
													respuestaPrepareSendMailAlerta) {
													if (respuestaPrepareSendMailAlerta) {
														i++;
														functionRecorrer(item, i);
													}
												}.bind(this));
											} else {
												i++;
												functionRecorrer(item, i);
											}
										} else {
											i++;
											functionRecorrer(item, i);
										}
									}
								}.bind(this);
								functionRecorrer(datos, 0);
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

		prepareSendMailAlerta: function (datos, asunto, contenido) {

			return new Promise(
				function resolver(resolve) {

					var arregloCorreo = [];
					var functionSendAlertas = function (data, pos) {
						if (data.length === pos) {
							this.sendMailAlerta(arregloCorreo, asunto, contenido).then(function (res) {
								resolve(true);
							}.bind(this));
						} else {
							var record = {};
							record.NOMBRE = data[pos].NOMBRE;
							record.CORREO = data[pos].CORREO;
							arregloCorreo.push(record);
							pos++;
							functionSendAlertas(data, pos);
						}
					}.bind(this);
					functionSendAlertas(datos, 0);

				}.bind(this));

		},

		reverHora: function (hxsjs) {
			var hora = "00:00:00";
			var res = hxsjs.split("PT")[1];
			var h = res.split("H")[0];
			var m = res.split("H")[1].split("M")[0];
			var s = res.split("H")[1].split("M")[1].replace("S", "");
			hora = (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);

			return hora;
		},

		formatterFecha: function (sValue) {
			var dateFormatted = "";
			if (sValue !== null) {
				var fecha = new Date(sValue);
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					style: 'medium',
					UTC: 'true',
					pattern: 'dd/MM/yyyy'
				});
				dateFormatted = dateFormat.format(fecha);

			}
			return dateFormatted;
		},

		getHora: function (date) {

			var d = new Date(date.ms * 1000);
			var hora = (d.getHours() == 0) ? 23 : d.getHours() - 1;
			hora = (hora <= 9) ? "0" + hora : hora;
			var minutos = (d.getMinutes() <= 9) ? "0" + d.getMinutes() : d.getMinutes();
			var segundos = (d.getSeconds() <= 9) ? "0" + d.getSeconds() : d.getSeconds();

			var result = hora + ":" + minutos + ":" + segundos;
			return result;

		},
		getHourERP: function (date) {

			var d = new Date(date.ms * 1000);
			var hora = (d.getHours() == 0) ? 23 : d.getHours() - 1;
			hora = (hora <= 9) ? "0" + hora : hora;
			var minutos = (d.getMinutes() <= 9) ? "0" + d.getMinutes() : d.getMinutes();
			var segundos = (d.getSeconds() <= 9) ? "0" + d.getSeconds() : d.getSeconds();

			var result = "PT" + hora + "H" + minutos + "M" + segundos + "S";
			return result;

		},

		/*getFecha: function(date){
			var fecha;
			if(date!== null){
				var fecha1= new Date(date);
				var 
			}
		},*/

		sendMailAlerta: function (datosAlerta, asunto, contenido) {
			return new Promise(
				function resolver(resolve) {
					var contenidoLog = this.contenidoLog;
					var destinatario = JSON.stringify(datosAlerta);

					var json = {
						ID_ACTIVIDAD: contenidoLog.ID_ACTIVIDAD,
						FECHA: this.formatterFecha(contenidoLog.FECHA),
						HORA: this.reverHora(contenidoLog.HORA),
						DATO_TRANSACCIONAL: contenidoLog.TX,
						CONTENIDO_LOG: contenidoLog.DESCRIPCION,
						DESTINATARIOS: destinatario,
						COPIAS: JSON.stringify([]),
						CONTENIDO_ALERTA: contenido,
						ASUNTO: asunto
					};

					var url = "/HANA/INGRESO_MERCADERIA/correo.xsjs?accion=alertas-sistema";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							resolve(true);
						}.bind(this),
						error: function (oError) {
							resolve(true);
						}.bind(this)
					});

				}.bind(this));

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

		createTrasladoERP: function (datos) {
			return new Promise(
				function resolver(resolve, reject) {

					this.getView().getModel("oModelSAPERP").create('/EjeTrasladoSet', datos, {
						success: function (oResult) {
							console.log(oResult);
							var respuestaMen = oResult.NavEjeTrasladoMen.results;
							if (respuestaMen.length > 0) {
								var conteoError = 0;
								var mensajeErrorConcat = "";
								var mensajeErrorConcatHtml = "";
								respuestaMen.forEach(function (element, index) {

									if (element.Type === "E") {
										conteoError++;
										if (index === 0) {
											mensajeErrorConcat += "- " + element.Message;
											mensajeErrorConcatHtml += "- " + element.Message;
										} else {
											mensajeErrorConcat += " \n \n - " + element.Message;
											mensajeErrorConcatHtml += " <br> <br> - " + element.Message;
										}
									}

									if (respuestaMen.length === (index + 1)) {
										if (conteoError > 0) {
											resolve({
												nroDocumento: "",
												resolve: false,
												error: mensajeErrorConcat,
												errorHtml: mensajeErrorConcatHtml
											});
										} else {
											var respuestaDoc = oResult.NavEjeTrasladoDoc.results;

											if (respuestaDoc.length > 0) {
												resolve({
													nroDocumento: respuestaDoc[0].Vbeln,
													resolve: true,
													error: ""
												});
											}

										}
									}
								}.bind(this));

							} else {
								resolve({
									nroDocumento: "",
									resolve: false,
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
									errorHtml: mensaje,
									resolve: false
								});
							} catch (e) {
								resolve({
									nroDocumento: "",
									error: mensaje,
									errorHtml: mensaje,
									resolve: false
								});
							}

						}.bind(this)
					});

				}.bind(this));
		},

		createTraslado: function (datos, idEstadoTraslado) {
			return new Promise(
				function resolver(resolve, reject) {

					var service = "NO";

					if (idEstadoTraslado === 4) {
						service = "SI";
						datos.ID_ESTADO_TRASLADO = 5;
					}
					datos.UPDATE = service;

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=trasladoDos";

					var json = datos;

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve({
								idTraslado: respuesta,
								resolve: true
							});
						}.bind(this),
						error: function (oError) {
							resolve({
								idTraslado: null,
								resolve: false
							});
						}.bind(this)
					});

				}.bind(this));
		},

		createPosicionTraslado: function (datos, idEstadoTraslado) {
			return new Promise(
				function resolver(resolve, reject) {

					var service = "NO";

					if (idEstadoTraslado === 4) {
						service = "SI";
					}

					datos.UPDATE = service;

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=posicionDos";

					var json = datos;

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							resolve(true);
						}.bind(this),
						error: function (oError) {
							resolve(false);
						}.bind(this)
					});

				}.bind(this));
		},

		cambioEstadoMasivoTraslado: function (nroDocuento, idEstadoTraslado, idTraslado, textoError) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=cambioEstadoMasivoTraslado";

					var json = {
						NUMERO_TRASLADO_ERP: nroDocuento,
						ID_TRASLADO: idTraslado,
						ID_ESTADO_TRASLADO: idEstadoTraslado,
						TEXTO_ERROR: textoError
					};

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
		},
		
		busquedaPedidoTrasladoHana: function (pedidoTraslado, detalle) {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=trasladosTemporales";

					var json = {
						NRO_PEDIDO_TRASLADO: pedidoTraslado,
						DETALLE: detalle
					};

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
		},

	});

});