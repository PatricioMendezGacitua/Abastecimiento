sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	'sap/ui/model/Filter',
	"com/gasco/Inbound/controller/consultaUsuario"
], function (Controller, JSONModel, MessageToast, MessageBox, History, Filter, consultaUsuario) {

	return Controller.extend("com.gasco.Inbound.controller.cargando", {

		consultaUsuario: consultaUsuario,

		onInit: function () {

			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCTmJ-VtMJmjKDlygmSzr52SXAk5AQ-kmU&libraries=drawing,places';
			document.body.appendChild(script);

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this.getOwnerComponent().getRouter().getRoute("cargando").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function () {

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

			consultaUsuario.datosUsuario().then(function (respuesta) {
				if (respuesta.resolve) {
					this.llamadaServicio(respuesta.userMail);
				} else {
					this._router.navTo("error");
				}

			}.bind(this));

		},

		llamadaServicio: function (userMail) {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

			this.consultaRoles(userMail).then(function (respuestaConsultaRoles) {
				jQuery.sap.delayedCall(1500, this, function () {
					if (respuestaConsultaRoles) {
						this._oStorage.put("logeoIngresoMerecaderia", "IngresoMerecaderia");
						this._router.navTo("Menu");
					} else {
						this._router.navTo("error");
					}
				}.bind(this));
			}.bind(this));
		},

		consultaRoles: function (correo) {
			return new Promise(
				function resolver(resolve, reject) {
					this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

					var jsonDataUser = {
						APELLIDO: "",
						CORREO: correo,
						ES_ADMNISTRADOR: false,
						ES_BODEGUERO: false,
						ES_BODEGUERO_OUT: false,
						ES_JEFE_SUPERVISOR: false,
						ES_SUPERVISOR: false,
						FECHA: "",
						HORA: "",
						ID_ESTADO_TX: 1,
						ID_PUBLICO_SCP: "",
						NOMBRE: "",
						NOMBRE_COMPLETO: "",
						USER_SCP_COD: "",
						ES_USUARIO: false 
					};

					this._oStorage.put("user_code_IngresoMercaderia", "");
					this._oStorage.put("correo_IngresoMercaderia", "");
					this._oStorage.put("user_name_IngresoMercaderia", "");
					this._oStorage.put("datos_user_IngresoMercaderia", jsonDataUser);

					var json = {
						CORREO: correo
					};

					var url = "/HANA/INGRESO_MERCADERIA/services.xsjs?accion=datosUserAppMovil";

					$.ajax({
						url: url,
						method: "POST",
						data: JSON.stringify(json),
						success: function (oResult) {
							var respuesta = oResult;
							if (respuesta.length === 0) {
								resolve(true);
							} else {
								var data = respuesta[0];

								if (data.USER_SCP_COD !== undefined) {
									data.ES_USUARIO = true;
									this._oStorage.put("user_code_IngresoMercaderia", data.USER_SCP_COD);
									this._oStorage.put("correo_IngresoMercaderia", data.CORREO);
									this._oStorage.put("user_name_IngresoMercaderia", data.NOMBRE + " " + data.APELLIDO);
									this._oStorage.put("datos_user_IngresoMercaderia", data);
								} else {
									this.ocurrioUnError();
								}
								resolve(true);
							}
						}.bind(this),
						error: function (oError) {
							console.log(oError);
							this.ocurrioUnError();
							resolve(true);
						}.bind(this)
					});

				}.bind(this));
		},

		ocurrioUnError: function () {
			MessageBox.information("Ocurrió un error, intente más tarde o comuníquese con el área encargada.", {
				title: "Aviso",
				actions: ["Aceptar"],
				onClose: function (oAction) {
					if (oAction === "Aceptar") {
						this.logOutApp();
					}
				}.bind(this)
			});

		},

		logOutApp: function () {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this._oStorage.put("logeo", null);
			sap.hybrid.kapsel.doDeleteRegistration();
			navigator.app.exitApp();
		}

	});

});