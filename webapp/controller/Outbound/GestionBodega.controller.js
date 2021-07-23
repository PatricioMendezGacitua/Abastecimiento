sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ndc/BarcodeScanner"
], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

	return BaseController.extend("com.gasco.Abastecimiento.controller.Outbound.GestionBodega", {

		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("gestion_bodega").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function () {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");

				this.actualizarPantalla();
			} else {
				this.onBackMenu();
			}

		},

		ordenarUbicacionesGB: function (arrayUbicacionesHana, oModel) {
			return new Promise(
				function resolver(resolve) {
					var arrayNuevo = [];
					var functionRecorrer = function (item, i) {
						var ultimoNumero = arrayUbicacionesHana[arrayUbicacionesHana.length - 1].ORDEN;
						if (item.length === i) {

							oModel.POSICIONES.sort(function (a, b) {
								if (a.UBICACION < b.UBICACION) {
									return 1;
								} else if (a.UBICACION > b.UBICACION) {
									return -1;
								}
								return 0;
							});
							
							oModel.POSICIONES.forEach(function (element2, index2) {

								if (element2.flagOrden !== "X") {
									ultimoNumero++;
									element2.order = ultimoNumero;
									arrayNuevo.push(element2);
								}

								if (oModel.POSICIONES.length === (index2 + 1)) {
									resolve(arrayNuevo);
								}

							}.bind(this));

						} else {

							var pos = item[i];

							oModel.POSICIONES.forEach(function (element, index) {

								if (pos.CODIGO === element.Lgpbe) {
									var record = element;
									record.order = pos.ORDEN;
									arrayNuevo.push(record);
									element.flagOrden = "X";

								}

								if (oModel.POSICIONES.length === (index + 1)) {
									i++;
									functionRecorrer(item, i);
								}

							}.bind(this));

						}
					}.bind(this);
					if (arrayUbicacionesHana.length > 0) {
						functionRecorrer(arrayUbicacionesHana, 0);
					} else {
						resolve(oModel.POSICIONES);
					}

				}.bind(this));
		},

		actualizarPantalla: function () {
			this.getView().byId("oPageGestionBodegaId").scrollTo(0, 0);
			var oModelGestionBodega = new JSONModel([]);
			this.getView().setModel(oModelGestionBodega, "oModelGestionBodega");
			this.getView().setBusy(true);

			var oButtonResGestionBodega = this.getView().byId("oButtonResGestionBodegaId");
			var oButtonIGestionBodega = this.getView().byId("oButtonIGestionBodegaId");
			oButtonResGestionBodega.setEnabled(false);
			oButtonIGestionBodega.setEnabled(false);
			
			this.tareasBodegaDiariaEnHANA().then(function (respuesta) {
				if (respuesta.length > 0) {
					this.actualizarTareaBodegaEnHANA(respuesta[0], 2).then(function (respuestaIHANA) {
						oModelGestionBodega.setData(respuesta[0]);
						this.idTarea = respuesta[0].ID_TAREA;
						oModelGestionBodega.refresh();
						var arrayUbicaciones = [];
						oModelGestionBodega.getData().POSICIONES.forEach(function (element) {
							arrayUbicaciones.push(element.UBICACION);
						}.bind(this));

						this.consultaConOrden(arrayUbicaciones, oModelGestionBodega.getData()).then(function (respuestaconsultaConOrden) {
							this.ordenarUbicacionesGB(respuestaconsultaConOrden, oModelGestionBodega.getData()).then(function (
								respuestaOrdenarUbicaciones) {
								oModelGestionBodega.getData().POSICIONES = respuestaOrdenarUbicaciones;
								oModelGestionBodega.refresh();
								oButtonResGestionBodega.setEnabled(true);
								oButtonIGestionBodega.setEnabled(true);
								this.getView().setBusy(false);
							}.bind(this));
						}.bind(this));

					}.bind(this));
				} else {
					this.getView().setBusy(false);
					MessageBox.information('No se encontraron tareas pendientes.', {
						title: "Aviso",
						actions: ["OK"],
						styleClass: "",
						onClose: function (sAction) {
							this._oStorage.put("logeoIngresoMerecaderia", "Si");
							this._route.navTo("Menu");
						}.bind(this)
					});
				}

			}.bind(this));

		},

		btnReestablecerGestionBodega: function (oEvent) {
			this.getView().byId("oPageGestionBodegaId").scrollTo(0, 0);
			var oModelGestionBodega = this.getView().getModel("oModelGestionBodega");
			oModelGestionBodega.getData().POSICIONES.forEach(function (element) {
				element.STOCK_FISICO = 0;
			}.bind(this));
			oModelGestionBodega.refresh();
		},

		countTitleLPGestionBodega: function (oEvent) {

			this.getView().byId("oTitleIdLGestionBodega").setText("Posiciones (" + this.getView().byId("idtableLPGestionBodega").getItems().length +
				")");

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
						this._route.navTo("Menu");
					}
				}.bind(this)
			});

		},

		tareasBodegaDiariaEnHANA: function () {
			return new Promise(
				function resolver(resolve, reject) {

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=tareaBodegaDiaria";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify({}),
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

		actualizarTareaBodegaEnHANA: function (json, estado) {
			return new Promise(
				function resolver(resolve, reject) {

					var fecha = new Date();
					fecha.setHours(0);
					fecha.setMinutes(0);
					fecha.setSeconds(0);

					var soloEstado = "cambioEstado";

					if (estado === 3) {
						soloEstado = "";
					}

					json.SOLO_ESTADO = soloEstado;
					json.ESTADO = estado;
					json.FECHA_TERMINO_TAREA = this.convertFechaXSJS(new Date(fecha));
					json.HORA_TERMINO_TAREA = this.horaXSJS();
					json.USER_SCP_COD = this.userSCPCod;

					var url = "/HANA/EGRESO_MERCADERIA/services.xsjs?accion=actualizaTareaBodegaDiaria";

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

		btnAceptarGestionBodega: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();

			MessageBox.information('¿Seguro deseas finalizar?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {
						this._oStorage.put("logeoIngresoMerecaderia", "Si");
						var oList = this.getView().byId("idtableLPGestionBodega");
						var cantidadItems = oList.getItems().length;

						if (cantidadItems > 0) {

							this.getView().setBusy(true);
							var listGestionBodega = this.getView().byId("idtableLPGestionBodega").getItems();
							var oModelGestionBodega = this.getView().getModel("oModelGestionBodega");
							oModelGestionBodega.refresh();

							var functionRecorrer = function (item, i) {
								if (item.length === i) {
									oModelGestionBodega.refresh();
									this.actualizarTareaBodegaEnHANA(oModelGestionBodega.getData(), 3).then(function (respuestaIHANA) {
										this.datosCreacion = {
											ID_TAREA: this.idTarea,
											TX: "Aplicación Móvil Abastecimiento > Gestión Bodega"
										};

										this.registrarLog("Tarea_Finalizada", this.datosCreacion).then(function (respuestaRegistrarLog) {
											MessageToast.show("Tarea Finalizada");
											jQuery.sap.delayedCall(3000, this, function () {
												this.getView().setBusy(false);
												this.actualizarPantalla();
											}.bind(this));
										}.bind(this));

									}.bind(this));
								} else {

									var obj = item[i].getBindingContext("oModelGestionBodega").getObject();
									var pos = item[i].getContent()[0].getContent()[4].getItems()[1];

									obj.STOCK_FISICO = pos.getValue().length === 0 ? "0" : pos.getValue();

									i++;
									functionRecorrer(listGestionBodega, i);
								}
							}.bind(this);

							functionRecorrer(listGestionBodega, 0);

						} else {
							MessageToast.show("Ingresa al menos una posición para traspasar");
						}

					}
				}.bind(this)

			});

		}

	});

});