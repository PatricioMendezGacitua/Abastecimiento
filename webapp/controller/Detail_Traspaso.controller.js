sap.ui.define([
			"com/gasco/Inbound/controller/BaseController",
			"sap/m/MessageToast",
			"sap/ui/model/json/JSONModel",
			"sap/m/MessageBox",
			"sap/ndc/BarcodeScanner"
		], function (BaseController, MessageToast, JSONModel, MessageBox, BarcodeScanner) {

			return BaseController.extend("com.gasco.Inbound.controller.Detail_Traspaso", {

				onInit: function () {
					this.getOwnerComponent().getRouter().getRoute("traspaso").attachMatched(this._onRouteMatched, this);
				},

				_onRouteMatched: function () {
					var oComponent = this.getOwnerComponent();
					this._route = oComponent.getRouter();
                    this.valuePos = 0;
					this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
					this.flagIngresoPos = false;
					this.objectFragment = [{
						"id": "idPosTraspasoCodMat",
						"required": true,
						"type": "ip"
					}/*, {
						"id": "idPosTraspasoPosicion",
						"required": true,
						"type": "ip"
					}, {
						"id": "idPosTraspasoDenMat",
						"required": true,
						"type": "ip"
					}, {
						"id": "idPosTraspasoUbicacion",
						"required": true,
						"type": "ip"
					}, {
						"id": "idPosTraspasoUnMedida",
						"required": true,
						"type": "ip"
					}*/, {
						"id": "idPosTraspasoAlmacen",
						"required": true,
						"type": "ip"
					}];
					this.InputsViewCabeceraTraslado = [{
						"id": "oInputCentroCTraspaso",
						"required": true,
						"type": "ip"
					}, {
						"id": "oInputAlmacenCTraspaso",
						"required": true,
						"type": "ip"
					}, {
						"id": "oDatePickerFCTraspaso",
						"required": true,
						"type": "dt"
					}, {
						"id": "oDatePickerFDTraspaso",
						"required": true,
						"type": "dt"
					}, {
						"id": "oInputGuiaDespachoTraspaso",
						"required": true,
						"type": "ip"
					}, {
						"id": "oTextAreaObservacion",
						"required": false,
						"type": "ip"
					}];
					this.modeloPosTraspaso = new JSONModel([]);
					this.getView().setModel(this.modeloPosTraspaso, "oModelPosTraslado");

					/*if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
						this._oStorage.put("navegacion_IngresoMercaderia", null);
						this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
						this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
			

						this.InputsViewCabeceraTraslado = [{
							"id": "oInputCentroCTraspaso",
							"required": true,
							"type": "ip"
						},
						{
							"id": "oInputAlmacenCTraspaso",
							"required": true,
							"type": "ip"
						},
						{
							"id": "oDatePickerFC",
							"required": true,
							"type": "dt"
						}, {
							"id": "oDatePickerFDTraspaso",
							"required": true,
							"type": "dt"
						}, {
							"id": "oInputGuiaDespachoTraspaso",
							"required": true,
							"type": "ip"
						}, {
							"id": "oTextAreaObservacion",
							"required": false,
							"type": "ip"
						}];
			
					} else {
						this.onBackMenu();
					}*/

				},
				countTitleLPTraspaso: function (oEvent) {

					//Actualiza el numero de registros

					this.getView().byId("oTitleIdLPHI").setText("Posiciones Traspaso(" + this.getView().byId("idtableLPTraspaso").getItems().length + ")");

				},
				onAddPositionTraspaso: function () {
					if (!this._oViewAddPosTraspasoDialog) {
						this._oViewAddPosTraspasoDialog = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.addPosTraspaso", this);
						this.getView().addDependent(this._oViewAddPosTraspasoDialog);
						//	this._oViewAddPosTraspasoDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					}
					
					this._oViewAddPosTraspasoDialog.open();
					//	this.vaciar(this.objectDialog, "Crear");

				},

				onInsertarPosTraspasoClose: function (oEvent) {
					this.cerrar(this.objectFragment, "Ingresar");

					this._oViewAddPosTraspasoDialog.close();
				},
				quitarState: function (fields, accion, vista) {
					var error = false;
					for (var i = 0; i < fields.length; i++) {
						var input;
						if (vista === "vista") {
							input = this.getView().byId(fields[i].id + accion);
						} else {
							input = sap.ui.getCore().byId(fields[i].id + accion);
						}
						input.setValueState("None");
					}
					return error;
				},
				onBuscarFrag : function(){
					 this.denMaterial="";
                     this.ubicacion="";
                     this.unidad="";
                     sap.ui.getCore().byId("idVboxFrag").setVisible(true);
                         if(!this.flagIngresoPos){
                         	this.denMaterial = "Conector Codo macho 6 mm";
                         	sap.ui.getCore().byId("idPosTraspasoDenMatIngresar").setText(this.denMaterial);
                         	this.ubicacion = "1134";
                         	sap.ui.getCore().byId("idPosTraspasoUbicacionIngresar").setText(this.ubicacion);
                         	this.unidad = "C/U";
                         	sap.ui.getCore().byId("idPosTraspasoUnMedidaIngresar").setText(this.unidad);
                         	this.flagIngresoPos= true;
                         }else{
                         	
                         	this.denMaterial = "Union Tee 4 mm";
                         	sap.ui.getCore().byId("idPosTraspasoDenMatIngresar").setText(this.denMaterial);
                         	this.ubicacion = "1185";
                         	sap.ui.getCore().byId("idPosTraspasoUbicacionIngresar").setText(this.ubicacion);
                         	this.unidad = "C/U";
                         	sap.ui.getCore().byId("idPosTraspasoUnMedidaIngresar").setText(this.unidad);
                         }
                         
					
				}
				
				
				,
				onInsertarPosTraspasoAdd: function (oEvent) {
					if (!this.validar(this.objectFragment, "Ingresar", "")) {
						//	var value = sap.ui.getCore().byId("slValueCrear").getValue();
                         this.valuePos  =  this.valuePos + 10;
                        
                         
						//this.openBusyDialog();
						var arrPosTraspaso = {
							"codMaterial": sap.ui.getCore().byId("idPosTraspasoCodMatIngresar").getValue(),
							"pos": this.valuePos,
							"denMaterial": this.denMaterial,
							"ubicacion": this.ubicacion,
							"uni_medida": this.unidad,
							"almacen": sap.ui.getCore().byId("idPosTraspasoAlmacenIngresar").getValue()
						};

						var model =	this.getView().getModel( "oModelPosTraslado");
						model.getData().push(arrPosTraspaso);
						model.refresh();
					
						/*  var model = new JSONModel(this.modeloPosTraspaso.getData());*/
						// this.getView().setModel(model,"oModelPosTraslado")
						
						sap.ui.getCore().byId("idVboxFrag").setVisible(false);
						
						
						
						
						/*this.getView().getModel("oModelPosTraslado").setData(this.modeloPosTraspaso.getData());
						this.getView().getModel("oModelPosTraslado").refresh();*/
						this.onInsertarPosTraspasoClose();

					} else {
						MessageToast.show("Complete los datos obligatorios.");
						jQuery.sap.delayedCall(3000, this, function () {

							this.quitarState(this.objectFragment, "Ingresar");
						}.bind(this));
					}
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

								this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");

								this._route.navTo("outbound");
							}
						}.bind(this)
					});

				},
				openListAlmacenesCompleta: function (oEvent) {
					this.idAlmacen = oEvent.getSource().getId();
					if (!this._valueDialogListAlmacenes) {
						this._valueDialogListAlmacenes = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.dialogoListAlmacenAll", this);
					}
					var arrAlmacen = [{
						"titulo": 1112,
						"descripcion": "Mat.con reservas"
					},{
						"titulo": 1130,
						"descripcion": "Materiales"
					},{
						"titulo": 1131,
						"descripcion": "Bod. Excluidos"
					},{
						"titulo": 1138,
						"descripcion": "Fabrica"
					}];
					var modelAlmacenes = new JSONModel(arrAlmacen);
					this._valueDialogListAlmacenes.setModel(modelAlmacenes, "modelAlmacenesC");
					this._valueDialogListAlmacenes.open();

				},

				openListCentrosCompleta: function (oEvent) {

					this.idCentro = oEvent.getSource().getId();
					if (!this._valueDialogListCentros) {
						this._valueDialogListCentros = sap.ui.xmlfragment("com.gasco.Inbound.view.fragments.dialogoListCentroAll", this);
					}
					var arrAlmacen = [{
						"titulo": 7110,
						"descripcion": "Maipú"
					}];
					var modelCentro = new JSONModel(arrAlmacen);
					this._valueDialogListCentros.setModel(modelCentro, "modelCentroC");
					this._valueDialogListCentros.open();

				},

				onValueHelpDialogCloseAlmacen: function (oEvent) {
					var oSelectedItem = oEvent.getParameter("selectedItem");

					if (oSelectedItem) {
						if (this.idAlmacen === "idPosTraspasoAlmacenIngresar") {
							sap.ui.getCore().byId(this.idAlmacen).setValue(oSelectedItem.getTitle());

						} else {
							this.getView().byId(this.idAlmacen).setValue(oSelectedItem.getTitle());
						}
					}
					//this.buttonAsignarAlmacen.setText(this.seleccionAlmacen);
				},
				onValueHelpDialogCloseCentro: function (oEvent) {
					var oSelectedItem = oEvent.getParameter("selectedItem");

					if (oSelectedItem) {

						this.getView().byId("oInputCentroCTraspaso").setValue(oSelectedItem.getTitle());

					}
					//this.buttonAsignarAlmacen.setText(this.seleccionAlmacen);
				},
				validar: function (fields, accion, v) {
					var error = false;
					for (var i = 0; i < fields.length; i++) {
						var input = (v === "vista") ? this.getView().byId(fields[i].id + accion) : sap.ui.getCore().byId(fields[i].id + accion);
						if (fields[i].type === "ip") {
							var value = input.getValue();
							if (value === "" || value.trim().length === 0) {
								input.setValueState("Error");
								error = true;
							}
						} else if (fields[i].type === "dt") {
							var value = input.getDateValue();
							if (value === null) {
								input.setValueState("Error");
								error = true;
							}
						} else {
							var value = input.getSelectedKey();
							if (value === null || value.length === 0) {
								input.setValueState("Error");
								error = true;
							}
						}

					}
					return error;
				},

				cerrar: function (fields, accion, v) {
					var error = false;
					for (var i = 0; i < fields.length; i++) {
						var input;
						if (v === "vista") {
							input = this.getView().byId(fields[i].id + accion);

						} else {
							input = sap.ui.getCore().byId(fields[i].id + accion);
						}

						if (fields[i].type === "ip") {
							input.setValue();
						} else if (fields[i].type === "dt") {
							input.setValue();
						} else {
							input.setSelectedKey();
						}
					}
					return error;
				},
				cerrarVista: function (fields, accion) {
					var error = false;
					for (var i = 0; i < fields.length; i++) {
						var input = this.getView().byId(fields[i].id + accion);
						if (fields[i].type === "ip") {
							input.setValue();
						} else if (fields[i].type === "dt") {
							input.setValue();
						} else {
							input.setSelectedKey();
						}
					}
					return error;
				},

				btnReestablecerTraspaso: function () {

					this.cerrarVista(this.InputsViewCabeceraTraslado, "");
				},
				btnAceptarTraspaso: function () {

					this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
					var oComponent = this.getOwnerComponent();
					this._route = oComponent.getRouter();

					MessageBox.information('¿Seguro deseas traspasar?', {
							title: "Aviso",
							actions: ["Si", "No"],
							styleClass: "",
							onClose: function (sAction) {
								if (sAction === "Si") {
									this._oStorage.put("logeoIngresoMerecaderia", "Si");
									if (!this.validar(this.InputsViewCabeceraTraslado, "", "vista")) {

										MessageToast.show("Traspaso Efectuado");
										jQuery.sap.delayedCall(3000, this, function () {

											this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");
											this.modeloPosTraspaso = new JSONModel([]);
											this.getView().setModel(this.modeloPosTraspaso, "oModelPosTraslado");
											this.getView().getModel().refresh();
											this._route.navTo("outbound");
										}.bind(this));

									} else {
										MessageToast.show("Complete los datos obligatorios.");
										jQuery.sap.delayedCall(3000, this, function () {
											this.cerrar(this.InputsViewCabeceraTraslado, "", "vista");
											this.quitarState(this.InputsViewCabeceraTraslado, "", "vista");
										}.bind(this));
									}
									

									
								}
							}.bind(this)

					
				});
					},

			});

});