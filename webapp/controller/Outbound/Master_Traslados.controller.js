sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
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
	var eventoTraslado;

	return BaseController.extend("com.gasco.Abastecimiento.controller.Outbound.Master_Traslados", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("Traslados_Master").attachMatched(this._onRouteMatched, this);
			this._route.getRoute("Traslados_Master_Dos").attachMatched(this._onRouteMatched, this);
			//this._route.getRoute("Traslados_Detail").attachMatched(this._onRouteMatchedDetail, this);

		},

		buscarAutocompletar: function (oEvent) {

			var oSearchFieldBuscar = this.getView().byId("oSearchFieldBuscarId");
			var value = "X";
			if (oSearchFieldBuscar.getValue().trim().length > 0) {
				value = oSearchFieldBuscar.getValue().trim();
			}

			var clear = oEvent.getParameter("clearButtonPressed");
			var refresh = oEvent.getParameter("refreshButtonPressed");

			if (clear) {
				this.iniciarView("X", this.filtroDePantallaSeleccionado);
			} else if (refresh) {
				this.iniciarView(value, this.filtroDePantallaSeleccionado);
			} else {
				if (value.length > 0) {
					this.iniciarView(value, this.filtroDePantallaSeleccionado);
				}
			}

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
			
			this.getView().byId("idPageMaster").setShowFooter(false);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			var oArgs = oEvent.getParameter("arguments");
			this.rootViewName = oEvent.getParameter("name");
			this.idEstadoIngreso = oArgs.estadoIngreso;

			if (oArgs.estadoIngreso == "4") {
				this.idEstadoIngreso = "1";
			}

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
				this.filtroDePantallaSeleccionado = this.idEstadoIngreso;
				this.openBusyDialog();
				this.iniciarView();
			} else {
				this.onBackMenu();
			}

		},

		onAnulaOC: function (oEvent) {

			var objectO = oEvent.getParameters().listItem.getBindingContext("oModeloTraslados").getObject();
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
						this.openBusyDialog();
						this.changeEstadoTresIngreso(idIngreso).then(function () {
							this.BusyDialog.close();
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
			var toggle = this.getView().byId("oToggleButtonAnularOCId");

			var visible = false;
			this.filtroDePantallaSeleccionado = idEstadoIngreso;

			if (idEstadoIngreso === "1") {
				visible = true;
			}

			toggle.setPressed(false);
			toggle.setVisible(visible);
			this.onToggleAnularOrdenBase(false);

			var name = "Traslados_Master";
			if (this.rootViewName === "Traslados_Master") {
				name = "Traslados_Master_Dos";
			}

			this.changeView(name, idEstadoIngreso);

		},

		changeView: function (param, idEstadoIngreso) {

			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo(param, {
				estadoIngreso: idEstadoIngreso
			});

		},

		onToggleAnularOrden: function () {
			var toggle = this.getView().byId("oToggleButtonAnularOCId");
			this.onToggleAnularOrdenBase(toggle.getPressed());
		},

		onToggleAnularOrdenBase: function (pressed) {

			var list = this.getView().byId("idList");
			var mode = "SingleSelectMaster";
			if (pressed) {
				mode = "Delete";
			}
			list.setMode(mode);

		},

		onChangeTipoBusqueda: function (oEvent) {

			this.onPressRestablecerModel();
			var oSelectTipoBusqueda = this.getView().byId("oSelectTipoBusquedaId");

			var oInputNroPedido = this.getView().byId("oInputNroPedido");
			var oInputCentroTra = this.getView().byId("oInputCentroTra");

			var oVBoxCentro = this.getView().byId("oVBoxCentroId");
			var oVBoxNroPedido = this.getView().byId("oVBoxNroPedidoId");

			oVBoxCentro.setVisible(false);
			oVBoxNroPedido.setVisible(false);

			if (oSelectTipoBusqueda.getSelectedKey() === "centro") {
				oVBoxCentro.setVisible(true);
			} else {
				oVBoxNroPedido.setVisible(true);
			}

			oInputNroPedido.setValue();
			oInputCentroTra.setValue();
		},

		onPressRestablecer: function () {
			this.onPressRestablecerModel();
			var oInputNroPedido = this.getView().byId("oInputNroPedido");
			var oInputCentroTra = this.getView().byId("oInputCentroTra");

			var oPanelId = this.getView().byId("oPanelId");
			var oVBoxCentro = this.getView().byId("oVBoxCentroId");
			var oVBoxNroPedido = this.getView().byId("oVBoxNroPedidoId");
			this.getView().byId("oSelectTipoBusquedaId").setSelectedKey("centro");

			oVBoxNroPedido.setVisible(false);
			oVBoxCentro.setVisible(true);
			oInputNroPedido.setValue();
			oInputCentroTra.setValue();
			oPanelId.setExpanded(true);
		},

		onPressRestablecerModel: function () {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemTableTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.setModel(oViewModel, "mainView");

			var oModeloTraslados = new JSONModel([]);
			this.getView().setModel(oModeloTraslados, "oModeloTraslados");

			this.finishedEvent([]);
			this._feedFacetFilter([]);
		},

		preOnlyNumber: function (e) {
			this.onPressRestablecerModel();
			this.onlyNumber(e);
		},

		openListCentrosCompleta: function (oEvent) {
			this.onPressRestablecerModel();
			this.idCentro = oEvent.getSource().getId();
			if (!this._valueDialogListCentrosTraslados) {
				this._valueDialogListCentrosTraslados = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListCentroAll", this);
			}

			var modelCentro = new JSONModel([]);
			this._valueDialogListCentrosTraslados.setModel(modelCentro, "modelCentroC");
			this._valueDialogListCentrosTraslados.open();

			var oInputCentroTra = this.getView().byId("oInputCentroTra");
			oInputCentroTra.setValue();

			this._valueDialogListCentrosTraslados.setBusy(true);

			this.getCentrosERP().then(function (resultado) {
				modelCentro.setData(resultado);
				modelCentro.refresh();
				if (resultado.length > 100) {
					modelCentro.setSizeLimit(resultado.length);
				}

				this._valueDialogListCentrosTraslados.setTitle("Lista de Centros (" + modelCentro.getData().length + ")");
				this._valueDialogListCentrosTraslados.setBusy(false);

				if (resultado.length === 0) {
					MessageToast.show("Encontramos algunos problemas al consultar la información, intente nuevamente.", {
						duration: 6000
					});
				}

			}.bind(this));

		},

		onValueHelpDialogCloseCentro: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var oInputCentroTra = this.getView().byId("oInputCentroTra");
			oInputCentroTra.setValue();
			if (oSelectedItem) {
				oInputCentroTra.setValue(oSelectedItem.getTitle());
			}

		},

		iniciarView: function () {
			this.getView().byId("idPageMaster").scrollTo(0, 0, 1000);
			this.onPressRestablecer();
		},

		onSearchBusquedaPedidoTraslado: function () {
			var oSelectTipoBusqueda = this.getView().byId("oSelectTipoBusquedaId");
			var idObj = "oInputNroPedido";
			var campo = "IEbeln";

			if (oSelectTipoBusqueda.getSelectedKey() === "centro") {
				idObj = "oInputCentroTra";
				campo = "IWerks";
			}

			var inputBusqueda = this.getView().byId(idObj);

			if (inputBusqueda.getValue().trim().length > 0) {
				this.openBusyDialog();
				this.busquedaPedidoTraslado(campo, inputBusqueda.getValue().trim()).then(function (
					respuestaB) {

					var respuestaBusqueda = this.eliminaDuplicado(respuestaB.datos, "Ebeln");

					respuestaBusqueda.forEach(function (element) {
						element.TITULO_ESTADO_TRASLADO = "Pendiente";
						element.STATE_ESTADO_TRASLADO = "Warning";
					}.bind(this));
					var nroPedidoERPPendientes = [];

					if (respuestaBusqueda.length > 0) {

						var functionRecorrer = function (item, i) {
							if (item.length === i) {

								if (oSelectTipoBusqueda.getSelectedKey() === "centro") {
									this.busquedaNroPedidoHana(nroPedidoERPPendientes, inputBusqueda.getValue().trim()).then(function (
										respuestaBusquedaNroPedidoHana) {

										if (respuestaBusquedaNroPedidoHana.length > 0) {

											respuestaBusquedaNroPedidoHana.forEach(function (element2, index2) {
												respuestaBusqueda.push(element2);

												if (respuestaBusquedaNroPedidoHana.length === (index2 + 1)) {

													respuestaBusqueda.sort(function (a, b) {
														if (a.TITULO_ESTADO_TRASLADO > b.TITULO_ESTADO_TRASLADO)
															return 1;
														else if (a.TITULO_ESTADO_TRASLADO < b.TITULO_ESTADO_TRASLADO)
															return -1;

														return 0;
													});

													this.bindItemsList(respuestaBusqueda);
												}
											}.bind(this));

										} else {
											this.bindItemsList(respuestaBusqueda);
											if (respuestaBusqueda.length === 0) {
												MessageToast.show("No encontramos resultados para el tipo de búsqueda seleccionado.", {
													duration: 5000
												});
											}
										}

									}.bind(this));
								} else {
									this.bindItemsList(respuestaBusqueda);
									if (respuestaBusqueda.length === 0) {
										MessageToast.show("No encontramos resultados para el tipo de búsqueda seleccionado.", {
											duration: 5000
										});
									}
								}

							} else {

								nroPedidoERPPendientes.push(new sap.ui.model.Filter({
									path: "NRO_PEDIDO_TRASLADO",
									operator: sap.ui.model.FilterOperator.NE,
									value1: item[i].Ebeln
								}));

								this.busquedaPedidoTrasladoHana(item[i].Ebeln, true).then(function (respuestaHana) {
									if (respuestaHana.length > 0) {
										item[i].TITULO_ESTADO_TRASLADO = respuestaHana[0].TITULO_ESTADO_TRASLADO;
										item[i].STATE_ESTADO_TRASLADO = respuestaHana[0].STATE_ESTADO_TRASLADO;
										item[i].Ebeln = respuestaHana[0].Ebeln;
										item[i].Werks = respuestaHana[0].Werks;
										item[i].Lgort = respuestaHana[0].Lgort;
									}
									i++;
									functionRecorrer(respuestaBusqueda, i);
								}.bind(this));
							}
						}.bind(this);
						functionRecorrer(respuestaBusqueda, 0);

					} else {

						if (oSelectTipoBusqueda.getSelectedKey() === "centro") {
							this.busquedaNroPedidoHana(nroPedidoERPPendientes, inputBusqueda.getValue().trim()).then(function (
								respuestaBusquedaNroPedidoHana) {

								if (respuestaBusquedaNroPedidoHana.length > 0) {

									respuestaBusquedaNroPedidoHana.forEach(function (element2, index2) {
										respuestaBusqueda.push(element2);

										if (respuestaBusquedaNroPedidoHana.length === (index2 + 1)) {

											respuestaBusqueda.sort(function (a, b) {
												if (a.TITULO_ESTADO_TRASLADO > b.TITULO_ESTADO_TRASLADO)
													return 1;
												else if (a.TITULO_ESTADO_TRASLADO < b.TITULO_ESTADO_TRASLADO)
													return -1;

												return 0;
											});

											this.bindItemsList(respuestaBusqueda);
										}
									}.bind(this));

								} else {
									this.bindItemsList(respuestaBusqueda);
									if (respuestaBusqueda.length === 0) {
										MessageToast.show("No encontramos resultados para el tipo de búsqueda seleccionado.", {
											duration: 5000
										});
									}
								}

							}.bind(this));
						} else {
							if (respuestaB.datos.length === 0 && !respuestaB.resolve) {
								MessageToast.show("Encontramos algunos problemas al consultar la información, intente nuevamente.", {
									duration: 6000
								});
							} else if (respuestaB.datos.length === 0) {
								MessageToast.show("No encontramos resultados para el tipo de búsqueda seleccionado.", {
									duration: 5000
								});
							}
							this.BusyDialog.close();
						}

					}

				}.bind(this));

			} else {
				inputBusqueda.setValueState("Error");
				MessageToast.show("Ingrese un valor para la búsqueda");
				jQuery.sap.delayedCall(3000, this, function () {
					inputBusqueda.setValueState("None");
				}.bind(this));
			}

		},

		busquedaNroPedidoHana: function (oFilters, centro) {
			return new Promise(
				function resolver(resolve) {

					var filterEstado = new Filter({
						path: "ID_ESTADO_TRASLADO",
						operator: sap.ui.model.FilterOperator.NE,
						value1: 2
					});

					var filterCentro = new Filter({
						path: "CENTRO",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: centro
					});

					var finalFilter = new sap.ui.model.Filter({
						filters: oFilters,
						and: true
					});

					var finalFinalFilter = new sap.ui.model.Filter({
						filters: [finalFilter, filterEstado, filterCentro],
						and: true
					});

					this.getView().getModel("oModeloHanaSalida").read('/Traslado', {
						filters: [finalFinalFilter],
						success: function (oResult) {
							var datos = oResult.results;

							if (datos.length > 0) {
								datos.forEach(function (element) {

									var textEstadoIngreso = "Pendiente";
									var stateEstadoIngreso = "Warning";

									if (element.ID_ESTADO_TRASLADO === 4) {
										textEstadoIngreso = "Reprocesar ⚠";
										stateEstadoIngreso = "None";
									} else if (element.ID_ESTADO_TRASLADO === 5) {
										textEstadoIngreso = "En Proceso ↻";
										stateEstadoIngreso = "Information";
									}

									element.TITULO_ESTADO_TRASLADO = textEstadoIngreso;
									element.STATE_ESTADO_TRASLADO = stateEstadoIngreso;
									element.Ebeln = element.NRO_PEDIDO_TRASLADO;
									element.Werks = element.CENTRO;
									element.Lgort = element.ALMACEN;

								}.bind(this));
							}

							resolve(datos);
						}.bind(this),
						error: function (oError) {
							resolve([]);
						}.bind(this)
					});

				}.bind(this));

		},

		desLista: function () {

			var traerListaProyectos = this.getView().byId("idList");
			var aPreguntar = traerListaProyectos.getSelectedItem();

			if (aPreguntar !== null) {
				aPreguntar.setSelected(false);
			}

		},

		bindItemsList: function (traslados) {

			var oModeloTraslados = this.getView().getModel("oModeloTraslados");

			if (traslados.length > 100) {
				oModeloTraslados.setSizeLimit(traslados.length);
			}

			oModeloTraslados.setData(traslados);
			oModeloTraslados.refresh();
			this.finishedEvent(traslados);
			this._feedFacetFilter(traslados);

		},

		finishedEvent: function (traslados) {
			var facetFilter = this.getView().byId("idFacetFilter");
			this.getView().byId("oTitleIdLPHI").setText("Resultados (" + traslados.length + ")");
			var cond = true;

			if (traslados.length === 0) {
				cond = false;
			}

			facetFilter.setVisible(cond);
			this.desLista();
			this.BusyDialog.close();
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
			eventoTraslado = oEvent.getParameter("listItem") || oEvent.getSource();
			this.navDetailSolicitud();
		},

		openSelectedFilter: function (oEvent) {

			var oButton = oEvent.getSource();

			if (!this._menuFilter) {
				this._menuFilter = sap.ui.xmlfragment(
					"com.gasco.Abastecimiento.view.fragments.MenuFilter",
					this
				);
				this.getView().addDependent(this._menuFilter);
			}

			var eDock = sap.ui.core.Popup.Dock;
			this._menuFilter.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

		},

		navDetailSolicitud: function () {
			var base = eventoTraslado;
			var paths = base.getBindingContext("oModeloTraslados").getPath();
			var pedidoTraslado = base.getBindingContext("oModeloTraslados").getProperty(paths).Ebeln;
			
			this.getView().byId("idPageMaster").setShowFooter(true);
			
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo("Traslados_Detail", {
				pedidoTraslado: pedidoTraslado
			});
		},

		handleFilterReset: function (oEvent) {
			var oFacetFilter = this.byId("idFacetFilter");
			var aFacetFilterLists = oFacetFilter.getLists();
			for (var i = 0; i < aFacetFilterLists.length; i++) {
				aFacetFilterLists[i].setActive(false);
				aFacetFilterLists[i].setSelectedKeys();
			}

			oFacetFilter.setVisible(false);
			jQuery.sap.delayedCall(200, this, function () {
				oFacetFilter.setVisible(true);
				this._applyFilter(this.filterEstado);
			}.bind(this));
		},

		_applyFilter: function (oFilter) {
			var oTable = this.byId("idList");
			oTable.getBinding("items").filter(oFilter);
		},

		_feedFacetFilter: function (datos) {
			//Declarar los objetos y los filtros  
			var filternNROPEDIDO = new Array(),
				filternCENTRO = new Array(),
				filternALMACEN = new Array();
			var filters = [];
			filters.push({
				title: "Número de Pedido",
				type: "Ebeln",
				values: []
			});
			filters.push({
				title: "Centro",
				type: "Werks",
				values: []
			});
			filters.push({
				title: "Almacén",
				type: "Lgort",
				values: []
			});

			jQuery.each(datos, function (key, value) {
				var modelo = this.getView().getModel();
				var valor = value;
				var nNROPEDIDO = valor.Ebeln;
				if (filternNROPEDIDO.indexOf(nNROPEDIDO) === -1) {
					filters[0].values.push({
						text: nNROPEDIDO,
						key: nNROPEDIDO
					});
					filternNROPEDIDO.push(nNROPEDIDO);
				}

				var nCENTRO = valor.Werks;
				if (filternCENTRO.indexOf(nCENTRO) === -1) {
					filters[1].values.push({
						text: nCENTRO,
						key: nCENTRO
					});
					filternCENTRO.push(nCENTRO);
				}

				var nALMACEN = valor.Lgort;
				if (filternALMACEN.indexOf(nALMACEN) === -1) {
					filters[2].values.push({
						text: nALMACEN,
						key: nALMACEN
					});
					filternALMACEN.push(nALMACEN);
				}

			}.bind(this));
			this.getModel("mainView").setProperty("/Filters", filters);
		},

		handleFacetFilterConfirm: function (oEvent) {
			var oFacetFilter = oEvent.getSource();
			var mFacetFilterLists = oFacetFilter.getLists().filter(function (oList) {
				return oList.getSelectedItems().length;
			});
			if (mFacetFilterLists.length) {
				var oFilter = new Filter(mFacetFilterLists.map(function (oList) {
					return new Filter(oList.getSelectedItems().map(function (oItem) {
						return new Filter(oList.getKey(), "EQ", oItem.getKey());
					}), false);
				}), false);
				this._applyFilter(oFilter);
			} else {
				this._applyFilter([]);
			}
		}

	});

});