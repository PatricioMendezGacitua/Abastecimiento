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
	"com/gasco/Inbound/controller/consultaUsuario"
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
	var sessionTime = new Date();
	var session;
	return Controller.extend("com.gasco.Inbound.controller.BaseController", {

		initBaseController: function () {
			$(document.body).click(function () {
				sessionTime = new Date();

			}.bind(this));

			$(document.body).keyup(function () {
				sessionTime = new Date();

			}.bind(this));

			session = setInterval(function () {
				var startMsec = new Date();
				var elapsed = startMsec.getTime() - sessionTime.getTime();
				if (elapsed >= 600000) {
					clearInterval(session);
					MessageBox.warning(
						"La sesión del navegador ha expirado. Es necesario recargar la página. \n Pulse OK para recargar la página actual.", {
							title: "Sesión de navegador ha expirado",
							actions: [sap.m.MessageBox.Action.OK],
							styleClass: "",
							onClose: function (sAction) {
								var myLocation = location;
								myLocation.reload();
							}
						});
				}
			}, 600000);
		}(),

		openMoreOption: function (oEvent) {

			var oButton = oEvent.getSource();

			if (!this._menu) {
				this._menu = sap.ui.xmlfragment(
					"com.gasco.Inbound.view.fragments.MenuItem",
					this
				);
				this.getView().addDependent(this._menu);
			}

			var eDock = sap.ui.core.Popup.Dock;
			this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

		},
		
		_dialogActualizaDatos: function (oEvent) {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

			this._valueDialogActualizaDatos = sap.ui.xmlfragment(
				"com.gasco.Inbound.view.fragments.dialogoActualizaDatos", this);

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
				this.BusyReconectando = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.BusyReconectando", this);
			}

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyReconectando);
			this.BusyReconectando.open();
		},

		openBusyDialog: function (oEvent) {

			if (!this.BusyDialog) {
				this.BusyDialog = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.BusyDialog", this);
			}

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyDialog);
			this.BusyDialog.open();
		},

		openBusyDialogCargando: function (oEvent) {

			if (!this.BusyDialogCargando) {
				this.BusyDialogCargando = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.BusyDialogCargando", this);
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

		logOutApp: function () {
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this._oStorage.put("logeoIngresoMerecaderia", null);
			sap.hybrid.kapsel.doDeleteRegistration();
			navigator.app.exitApp();
		},

	});

});