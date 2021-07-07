/*global history */
/* global JSZip:true */
/* global saveAs:true */
/* global JSZipUtils:true*/
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
	return Controller.extend("com.gasco.Abastecimiento.controller.Inbound.BaseController", {

		returnContenidoNoDisponible: function () {

			var base64 =
				"data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABGAAD/4QNxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MDI4MDExNzQwNzIwNjgxMTgwODNENzdGMEQ3OTVBQkMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzY0OTNEODgyN0I2MTFFNEI5RDFDRUMwNzdFMDlCQzYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzY0OTNEODcyN0I2MTFFNEI5RDFDRUMwNzdFMDlCQzYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjA0ODAxMTc0MDcyMDY4MTE4MDgzRDc3RjBENzk1QUJDIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAyODAxMTc0MDcyMDY4MTE4MDgzRDc3RjBENzk1QUJDIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwv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6IC88EcOZ3DW35GJnWVWWW3drF0OUo9Xqxjy9aMeXkAs4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//Z";

			return base64;

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
			if (sValue !== null) {
				sValue = sValue.replace(/ /g, "");
				retorno = sValue.replace(/\./g, "");
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

		registrarUsoIngreso: function () {
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
		},

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

		openListAlmacenesSupervisor: function (oEvent) {
			var obj = oEvent.getSource();
			var datos = obj.getBindingContext("oModeloDataTemporal").getObject();
			var numeroCentro = datos.CENTRO;
			this.seleccionAlmacen = obj.getText();
			this.openListAlmacenesBase(numeroCentro, obj);
		},

		openListAlmacenesInbound: function (oEvent) {
			var obj = oEvent.getSource();
			var datos = obj.getBindingContext("oModeloPosicionesIngresoMercaderia").getObject();
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

		formatterFechaXSJS: function (fecha) {

			var fecha1 = new Date();
			var year = fecha1.getFullYear();
			var mes = (fecha1.getMonth() < 9) ? "0" + (fecha1.getMonth() + 1) : (fecha1.getMonth() + 1);
			var dia = (fecha1.getDate() < 9) ? "0" + fecha1.getDate() : fecha1.getDate();
			var fechaFinal1 = dia + "." + mes + "." + year;

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

					if (actividad === "Genera_Ingreso_Temporal") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la creación del ingreso temporal N°" + datos.ID_AVISO +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Reprocesar_Ingreso_Temporal") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la falla de la recepción del ingreso temporal N°" + datos
							.ID_AVISO +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Ingreso_Temportal_En_Proceso") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la creación en segundo plano del ingreso temporal N°" +
							datos.ID_AVISO +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Ingreso_Temporal_Recepcionado") {
						this.contenido = "La actividad que se acaba de realizar corresponde a la recepción exitosa del ingreso temporal N°" + datos.ID_AVISO +
							", acción realizada por el usuario " + this.userSCPCod;
					} else if (actividad === "Stock_Cero_Material") {
						this.contenido = "La actividad que se acaba de realizar corresponde al aviso de quiebre de stock para el número de material" +
							datos.NUMERO_MATERIAL +
							" en el ingreso temportal N°" + datos.ID_AVISO + ", acción detectada por el usuario " + this.userSCPCod;
					}

					this.contenidoLog = {
						ID_LOG: 0,
						TX: "Aviso Temporal N°" + datos.ID_AVISO,
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

		getMymeTypeDoc: function (extension) {
			return new Promise(
				function resolver(resolve) {

					var json = {
						EXTENSION: "." + extension
					};

					var url = "/HANA/GESTOR_DOCUMENTAL/services.xsjs?cmd=mymeType";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							resolve(oResult);
						}.bind(this),
						error: function (oError) {
							resolve({
								"MYMETYPE": ""
							});
						}.bind(this)
					});

				}.bind(this));

		},

		adjuntoSharepoint: function (url) {
			var https = "https://";
			var l = "gascoglp.sharepoint.com/";
			var linkSharePoint = https + l;
			var cond = false;

			if (url !== null) {
				if (url.indexOf(linkSharePoint) > -1) {
					cond = true;
				}
			} else {
				cond = true;
			}

			return cond;
		},

		functionCallBase64oDescarga: function (object, accion) {
			return new Promise(
				function resolver(resolve, reject) {

					var arrUrls = object;
					var cantUrls = object.length;
					var zip = new JSZip();
					var url = "/HANA/GESTOR_DOCUMENTAL/XSJS/servicesTubo.xsjs?cmd=getFile";
					var ojsonModel = new sap.ui.model.json.JSONModel();
					ojsonModel.attachRequestCompleted(function (oEvents) {
						var respuesta = oEvents.getSource().getData();
						if (respuesta === false) {
							MessageToast.show('No se pudo conectar con el repositorio de documentos');
							return;
						} else {
							this.sToken = respuesta;
						}

					}.bind(this));
					ojsonModel.loadData(url, null, false);
					this.onSeturl(arrUrls, 0, cantUrls, accion).then(function (arrIms) {

						if (accion === "Descarga") {
							this.onSeturlData(arrIms, 0, arrIms.length, zip).then(function (respZip) {

								respZip.generateAsync({
										type: "blob"
									})
									.then(function (content) {
										// see FileSaver.js
										saveAs(content, "ListaArchivos.zip");
									});
								resolve();
							}.bind(this));
						} else {
							resolve(arrIms);
						}

					}.bind(this));

				}.bind(this));
		},

		onSeturl: function (array, j, total, accion) {
			var arrBlob = [];
			var stoken = this.sToken;
			return new Promise(function (resolve, reject) {
				var recursiva = function (arr, i, lengths) {
					if (i === lengths) {
						resolve(arrBlob);
					} else {

						var sUrl = arr[i].URL;
						if (sUrl !== null) {
							var filename = sUrl.replace(/.*\//g, "");

							var encodeUrl = decodeURI(sUrl);
							var sValue = encodeUrl.replace("https://gascoglp.sharepoint.com/", "");

							var sValueUrl = "https://gascoglp.sharepoint.com/sites/GDG/_api/web/GetFileByServerRelativeUrl('/";
							var vAux = sValue.split("/");
							var sIndex = vAux.length - 1;
							var sTitle = vAux[sIndex];
							var mTipo = arr[i].MIMETYPE;
							var url = sValueUrl + decodeURI(sValue) + "')/openbinarystream";
							var xhr = new window.XMLHttpRequest();
							xhr.open("GET", url, true);
							xhr.setRequestHeader("authorization", "Bearer " + stoken);

							xhr.responseType = 'arraybuffer';
							xhr.addEventListener('load', function () {
								if (xhr.status === 200) {
									var sampleBytes = new Uint8Array(xhr.response);
									saveByteArray(sampleBytes, sTitle, mTipo);
								} else {
									var record = {};
									record.name = "contenido_no_disponible";
									record.url = this.returnContenidoNoDisponible();
									arrBlob.push(record);
									i++;
									recursiva(arr, i, lengths);
								}
							}.bind(this))
							xhr.send();
							var saveByteArray = (function () {
								var a = document.createElement("a");
								document.body.appendChild(a);
								a.style = "display: none";
								return function (data, name, tipo) {

									if (accion === "Descarga") {
										tipo = "octet/stream";
									}

									var blob = new Blob([data], {
										type: tipo
									});
									var record = {};
									var url2;
									record.name = filename;

									if (accion === "Descarga") {
										url2 = window.URL.createObjectURL(blob);
										record.url = url2;
										arrBlob.push(record);
										i++;
										recursiva(arr, i, lengths);
									} else {
										var reader = new FileReader();
										reader.readAsDataURL(blob);
										reader.onloadend = function () {
											var base64String = reader.result;
											record.url = base64String;

											arrBlob.push(record);
											i++;
											recursiva(arr, i, lengths);
										};

									}
								}.bind(this);
							}().bind(this));
						} else {
							var record = {};
							record.name = "contenido_no_disponible";
							record.url = this.returnContenidoNoDisponible();
							arrBlob.push(record);
							i++;
							recursiva(arr, i, lengths);
						}
					}
				}.bind(this);

				recursiva(array, j, total);

			}.bind(this));
		},

		urlToPromise: function (url) {
			return new Promise(function (resolve, reject) {
				JSZipUtils.getBinaryContent(url, function (err, data) {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			});
		},

		onSeturlData: function (array, j, total, zip) {

			return new Promise(function (resolve, reject) {
				var recursiva = function (arr, i, lengths, sZip) {
					if (i === lengths) {

						resolve(sZip);
					} else {
						/*this.urlToPromise(arr[i].url).then(function (resp) {

							sZip.file(arr[i].name, resp, {
								binary: true
							});*/
						window.location.assign(arr[i].url);
						i++;
						recursiva(arr, i, lengths, sZip);

						//}.bind(this));

					}
				}.bind(this);

				recursiva(array, j, total, zip);

			}.bind(this));
		}

	});

});