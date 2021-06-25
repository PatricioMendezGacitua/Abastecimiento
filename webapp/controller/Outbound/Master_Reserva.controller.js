sap.ui.define([
	"com/gasco/Inbound/controller/Outbound/BaseController",
	"sap/ui/model/Filter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/TextArea",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/FilterOperator",
	"sap/m/ColumnListItem",
	"sap/m/GroupHeaderListItem"
], function (BaseController,
	Filter,
	Dialog,
	Button,
	TextArea,
	JSONModel,
	MessageToast,
	MessageBox,
	FilterOperator,
	ColumnListItem,
	GroupHeaderListItem) {
	var evento;

	return BaseController.extend("com.gasco.Inbound.controller.Outbound.Master_Reserva", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("reserva_master").attachMatched(this._onRouteMatched, this);
			this._route.getRoute("reserva_master_Dos").attachMatched(this._onRouteMatched, this);

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
		handleRefresh: function (evt) {
			jQuery.sap.delayedCall(1000, this, function () {
				this.getView().byId("oSearchFieldBuscarId").setValue();
				this.getView().byId("pullToRefresh").hide();
				this.iniciarView("X", this.filtroDePantallaSeleccionado);
			}.bind(this));

		},
		
		
		

		buscarAutocompletarReserva: function (oEvent) {
			
			var sValue = oEvent.getSource().getValue();
			var filterFinal = [];
			if (sValue.trim().length > 0) {
				var oFilterNombre = new Filter({
					path: "NRORESERVA",
					operator: FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});
				var oFilterApellido = new Filter({
					path: "ALMACEN",
					operator: FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});
				
				filterFinal = new Filter({
					filters: [oFilterNombre, oFilterApellido],
					and: false
				});
			}

			var oList = this.byId("idList");
			var oBinding = oList.getBinding("items");
		
			oBinding.filter(filterFinal, "Application");
			},

		onlyNumber: function (oEvent) {
			var obj = oEvent.getSource();

			var value = obj.getValue().toString();
			if (value.trim().length > 0) {
				value = value.toString().replace(/[^0-9\_]/g, '');
				obj.setValue(Number(value));
			}

		},

		onlyNumberChart: function (oEvent) {
			var obj = oEvent.getSource();

			var value = obj.getValue().toString();
			if (value.trim().length > 0) {
				value = value.toString().replace(/[^0-9 A-Z a-z\_]/g, '');
				obj.setValue(value.toUpperCase());
			}

		},

		_onRouteMatched: function (oEvent) {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			var oArgs = oEvent.getParameter("arguments");
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

			this.rootViewName = oEvent.getParameter("name");
			this.texto = "Pendiente";
			this.state = "Warning";
			if (this.rootViewName === "reserva_master_Dos") {
				if (oArgs.estadoReserva === "Reservar") {
					this.texto = "Preparado";
					this.state = "Success";
				}

			}

			this.idEstadoIngreso = oArgs.estadoIngreso;

			if (oArgs.estadoIngreso == "4") {
				this.idEstadoIngreso = "1";
			}
            this.getView().byId("oSearchFieldBuscarReservaId").setValue();
			//this.iniciarView("X", this.idEstadoIngreso);
            var sValueNroSAP = "ADGCONSULTIN";
            var sValueTipo = "PEN";
          
			this.busquedaReserva(sValueNroSAP,sValueTipo, "Reserva").then(function (respuestabusquedaReserva) {
				
				this.getView().byId("idPageMaster").scrollTo(0, 0, 1000);
			this.openBusyDialogCargando();

			

			this.bindItemsList(respuestabusquedaReserva.datos);
				
				
				
				
				
				
			}.bind(this));

			/*	this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
					this._oStorage.put("navegacion_IngresoMercaderia", null);
					this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
					this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
					this.filtroDePantallaSeleccionado = this.idEstadoIngreso;
					this.setearTextoMenuButton();
					this.iniciarView("X", this.idEstadoIngreso);
				} else {
					this.onBackMenu();
				}*/

		},

		onAnulaOC: function (oEvent) {

			var objectO = oEvent.getParameters().listItem.getBindingContext("oModeloTemporales").getObject();
			var idIngreso = objectO.ID_INGRESO;

			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

			MessageBox.show("¿Seguro desea anular el ingreso N°" + idIngreso + "?", {
				icon: sap.m.MessageBox.Icon.QUESTION,
				title: "Eliminar",
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				actions: ["Aceptar", "Cancelar"],
				onClose: function (sAction) {
					if (sAction === 'Cancelar') {
						return;
					} else {
						this.openBusyDialogCargando();
						this.changeEstadoTresIngreso(idIngreso).then(function () {
							this.BusyDialogCargando.close();
							this.cambioDeEstadoBase(this.filtroDePantallaSeleccionado);
							MessageToast.show("Ingreso anulado correctamente.");
						}.bind(this));
					}
				}.bind(this)
			});

		},

		cambioDeEstadoUno: function () {
			this.cambioDeEstadoBase("1");
		},

		cambioDeEstadoDos: function () {
			this.cambioDeEstadoBase("2");
		},

		cambioDeEstadoTres: function () {
			this.cambioDeEstadoBase("3");
		},

		cambioDeEstadoBase: function (idEstadoIngreso) {
			/*var toggle = this.getView().byId("oToggleButtonAnularOCId");

			var visible = false;*/
			this.filtroDePantallaSeleccionado = idEstadoIngreso;
			this.setearTextoMenuButton();

			if (idEstadoIngreso === "1") {
				visible = true;
			}

			toggle.setPressed(false);
			toggle.setVisible(visible);
			this.onToggleAnularOrdenBase(false);

			var name = "Recepciones_Master";
			if (this.rootViewName === "Recepciones_Master") {
				name = "Recepciones_Master_Dos";
			}

			this.changeView(name, idEstadoIngreso);

		},

		changeView: function (param, idEstadoIngreso) {

			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo(param, {
				estadoIngreso: idEstadoIngreso
			});

		},

		setearTextoMenuButton: function () {
			var oMenuButtonFilter = this.getView().byId("oMenuButtonFilterId");
			var text = "Pendientes";
			if (this.filtroDePantallaSeleccionado === "2") {
				text = "Recepcionadas";
			} else if (this.filtroDePantallaSeleccionado === "3") {
				text = "Anuladas";
			}
			oMenuButtonFilter.setText(text);
		},

		onToggleAnularOrden: function () {
			/*var toggle = this.getView().byId("oToggleButtonAnularOCId");
			this.onToggleAnularOrdenBase(toggle.getPressed());*/
		},

		onToggleAnularOrdenBase: function (pressed) {

			var list = this.getView().byId("idList");
			var mode = "SingleSelectMaster";
			if (pressed) {
				mode = "Delete";
			}
			list.setMode(mode);

		},

		iniciarView: function (idIngreso, idEstadoIngreso) {
			this.getView().byId("idPageMaster").scrollTo(0, 0, 1000);
			this.openBusyDialogCargando();

		/*	var temporales = [{
				"ID_RESERVA": 718915,
				"TITULO_ESTADO_INGRESO": this.texto,
				"STATE_ESTADO_INGRESO": this.state,
				"POSICION": 1,
				"TIPO_DESPACHO": "DE",
				"DENOMINACION": "DESPACHO",
				"CENTRO": 7110,
				"ALMACEN": 1130,
				"MATERIAL": "MED_ACTARISG1.6GLP",
				"TEXTO_BREVE": "MEDIDOR RESIDENCIAL G1.6 Mcal/hr GLP",
				"EJECUTADO": "CJARA",
				"CANT_SOL": 3,
				"FECHA_A_PRESENTAR": "11.03.2021",
				"HORA_A_PRESENTAR": "12:57:23",
				"ID_ESTADO_INGRESO": 1

			}, {
				"ID_RESERVA": 718930,
				"TITULO_ESTADO_INGRESO": "Pendiente",
				"STATE_ESTADO_INGRESO": "Warning",
				"POSICION": 1,
				"TIPO_DESPACHO": "RE",
				"DENOMINACION": "RETIRO",
				"CENTRO": 7110,
				"ALMACEN": 1130,
				"MATERIAL": "GO_ALI",
				"TEXTO_BREVE": "GOLILLA ACRILONITRILO 23",
				"EJECUTADO": "CJARA",
				"CANT_SOL": 3,
				"FECHA_A_PRESENTAR": "27.03.2021",
				"HORA_A_PRESENTAR": "17:57:23",
				"ID_ESTADO_INGRESO": 1

			}];

			this.bindItemsList(temporales);*/

			/*this.temporalesPorUsuarioConectado(this.userSCPCod, idIngreso, idEstadoIngreso, false).then(function (
				respuestaTemporalesPorUsuarioConectado) {
				var temporales = respuestaTemporalesPorUsuarioConectado;
				
				this.bindItemsList(temporales);
			}.bind(this));*/

		},

	/*	eliminaDuplicado: function (tuArreglo, atributodetuArreglo) {
			var nuevoArreglo = [];
			var nuevoJson = {};

			for (var i in tuArreglo) {
				if (tuArreglo[i].ID_ESTADO_INGRESO === 4) {
					nuevoJson[tuArreglo[i][atributodetuArreglo]] = tuArreglo[i];
				}
			}

			for (i in nuevoJson) {
				nuevoArreglo.push(nuevoJson[i]);
			}

			nuevoJson = {};

			for (var e in nuevoArreglo) {
				for (var a in tuArreglo) {
					if (tuArreglo[a].ID_INGRESO !== nuevoArreglo[e].ID_INGRESO && tuArreglo[a].ID_ESTADO_INGRESO !== 4) {
						nuevoJson[tuArreglo[a][atributodetuArreglo]] = tuArreglo[a];
					}
				}
			}

			for (e in nuevoJson) {
				nuevoArreglo.push(nuevoJson[e]);
			}
			return nuevoArreglo;
		},*/

		desLista: function () {

			var traerListaProyectos = this.getView().byId("idList");
			var aPreguntar = traerListaProyectos.getSelectedItem();

			if (aPreguntar !== null) {
				aPreguntar.setSelected(false);
			}

		},

		bindItemsList: function (temporales) {

		/*	var toggle = this.getView().byId("oToggleButtonAnularOCId");
			toggle.setEnabled(true);*/
		var oModeloTemporales = new JSONModel([]);
			this.getView().setModel(oModeloTemporales, "oModeloTemporalesReserva");
			

			if (temporales.length > 100) {
				temporales.setSizeLimit(temporales.length);
			}

			if (temporales.length === 0) {
				
			}

			oModeloTemporales.setData(temporales);
			oModeloTemporales.refresh();
			this.finishedEvent(temporales);

		},

		finishedEvent: function (temporales) {
			this.getView().byId("idPagina").setText("Reservas (" + temporales.length + ")");
			this.desLista();
			this.BusyDialogCargando.close();
		},

		formatterStatus: function (estado) {
			var valor = "None";

			if (estado === "Rechazado") {
				valor = "Error";
			} else if (estado === "Aprobado") {
				valor = "Success";
			} else if (estado === "Pendiente") {
				valor = "Warning";
			} else {
				valor = "None";
			}

			return valor;
		},

		onListItemPressed: function (oEvent) {
			evento = oEvent.getParameter("listItem") || oEvent.getSource();
			this.navDetailSolicitud();
		},

		openSelectedFilter: function (oEvent) {

			var oButton = oEvent.getSource();

			if (!this._menuFilter) {
				this._menuFilter = sap.ui.xmlfragment(
					"com.gasco.Inbound.view.fragments.MenuFilter",
					this
				);
				this.getView().addDependent(this._menuFilter);
			}

			var eDock = sap.ui.core.Popup.Dock;
			this._menuFilter.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

		},

		navDetailSolicitud: function () {
			var base = evento;
			var paths = base.getBindingContext("oModeloTemporalesReserva").getPath();

			var idReserva = base.getBindingContext("oModeloTemporalesReserva").getProperty(paths).NRORESERVA;
			var idEstadoIngreso = 1;// base.getBindingContext("oModeloTemporalesReserva").getProperty(paths).ID_ESTADO_INGRESO;

			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo("Reserva_Detail", {
				idReserva: idReserva,
				ingreso: idEstadoIngreso
			});
		}

	});

});