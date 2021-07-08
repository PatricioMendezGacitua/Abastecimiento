sap.ui.define([
	"com/gasco/Abastecimiento/controller/Outbound/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/gasco/Abastecimiento/model/apiBibliotecaDigital_Outbound"
], function (Controller, JSONModel, MessageToast, MessageBox, apiBibliotecaDigital) {
	"use strict";

	return Controller.extend("com.gasco.Abastecimiento.controller.Outbound.Detail_Entrega", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("Entrega_Detail").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			this.corre = 1;

			var oArgs = oEvent.getParameter("arguments");
			this.idIngreso = oArgs.idReserva;
			this.idEstadoIngreso = oArgs.ingreso;
			this.flagSelectAll = false;
			this.getView().byId("tituloDetalleSolicitudView").setText("Detalle Reserva N°" + this.idIngreso);
			this.getView().byId("oPageDetailId").scrollTo(0, 0);
			this.getView().setModel(new JSONModel([]), "oModelImage");
			this.byId("mensajeFoto").setVisible(false);
			this.byId("UploadCollection").setVisible(false);
			this.getView().setModel(model, "oModeloDataTemporalDetailEntrega");
			this.idGrund = "";
			this.idItemText = "";
			this.docSAP = " - ";

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
			if (this._oStorage.get("navegacion_IngresoMercaderia") === "si") {
				this._oStorage.put("navegacion_IngresoMercaderia", "no");

				var model = sap.ui.getCore().getModel("oModeloTemporalesReservaCore").getData();
				this.openBusyDialogCargando();

				this.getView().byId("tituloDetalleSolicitudView").setText("Detalle Reserva N°" + this.idIngreso);
				this.cargaPosiciones(model, this.idIngreso, "Entrega").then(function (respuestacargaPosiciones) {
					var oModel = new JSONModel(respuestacargaPosiciones);

					this.getView().setModel(oModel, "oModeloDataTemporalDetailEntrega");
					this.BusyDialogCargando.close();

				}.bind(this));
			} else {
				this.resetMasterDetail();
			}

		},
		upPage: function (oEvent) {
			this.getView().byId("oPageDetailId").scrollTo(0, 0);
		},
		downPage: function (oEvent) {

			var h = $(window).height();
			this.getView().byId("oPageDetailId").scrollTo(h * 1000, 0);

		},

		getMotivosERP: function () {
			return new Promise(
				function resolver(resolve) {
					var aFil = [];

					var tFilterIkey = new sap.ui.model.Filter({
						path: "Ikey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "1"
					});
					aFil.push(tFilterIkey);

					this.getView().getModel("oModelSAPERP").read('/ListaMotivoSet', {
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

		openListMotivoFilter: function (oEvent) {

			if (!this._valueDialogListMotivosEntrega) {
				this._valueDialogListMotivosEntrega = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.dialogoListMotivosEntrega", this);
			}

			var modelMotivos = new JSONModel([]);
			this._valueDialogListMotivosEntrega.setModel(modelMotivos, "modelMotivos");
			this._valueDialogListMotivosEntrega.open();
			this._valueDialogListMotivosEntrega.setBusy(true);
			var modelMotivos = this._valueDialogListMotivosEntrega.getModel("modelMotivos");

			this.getMotivosERP().then(function (resultado) {
				/*var resultadoF = [];
				resultadoF.push(element);
				resultado.forEach(function (element) {
					
						resultadoF.push(element);
					
				}.bind(this));*/
				modelMotivos.setData(resultado);
				modelMotivos.refresh();
				if (resultado.length > 100) {
					modelMotivos.setSizeLimit(resultado.length);
				}
				this._valueDialogListMotivosEntrega.setTitle("Lista de Motivos (" + modelMotivos.getData().length + ")");
				this._valueDialogListMotivosEntrega.setBusy(false);
			}.bind(this));

		},

		onSearchMotivos: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var filterFinal = [];
			if (sValue.trim().length > 0) {
				var oFilterNumeroAlmacen = new sap.ui.model.Filter({
					path: "Grund",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: sValue,
					caseSensitive: false
				});

				filterFinal = new sap.ui.model.Filter({
					filters: [oFilterNumeroAlmacen],
					and: false
				});
			}
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter(filterFinal);
		},

		onValueHelpDialogCloseMotivo: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {

				this.CbyId("idAddMotivoAyuda").setValue(oSelectedItem.getTitle());
				this.idGrund = oSelectedItem.getTitle();
				if (this.CbyId("idAddMotivoTexto").getValue().length > 0) {
					this.CbyId("btIngresarPosTraspaso").setEnabled(true);
				}

			}
		},

		controlLength: function (oEvent) {
			var textMax = this.CbyId("idAddMotivoTexto").getValue().length;
			var texto = textMax + "/50";
			this.CbyId("lbMaxTexto").setText(texto);
			this.idItemText = this.CbyId("idAddMotivoTexto").getValue();
			if (this.CbyId("idAddMotivoAyuda").getValue().length > 0) {
				this.CbyId("btIngresarPosTraspaso").setEnabled(true);
			}

		},

		onSelectChangeAll: function (oEvent) {
			var id = this.byId("chkEntrega");

			(!this.flagSelectAll) ? id.setText("Deseleccionar Todos"): id.setText("Seleccionar Todos");

			var obj = this.byId("idtableLPEntrega").getItems();
			obj.forEach(function (element, index) {
				element.getContent()[0].getItems()[0].getContent()[0].getItems()[0].setSelected(!this.flagSelectAll);
				element.getContent()[0].getItems()[0].getContent()[0].getItems()[0].setValueState("None");

			}.bind(this));
			this.flagSelectAll = !this.flagSelectAll;
		},
		onSelectChangeItem: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("oModeloDataTemporalDetailEntrega").getPath();
			path = path.slice(1, path.length);

			this.byId("idtableLPEntrega").getItems()[path].getContent()[0].getItems()[0].getContent()[0].getItems()[0].setValueState("None");
		},
		getFormatType: function (type) {
			var sValue = "";
			switch (type) {
			case "application/acad":
				sValue = "dwg";
				break;
			case "image/vnd.dwg":
				sValue = "dwg";
				break;
			case "text/plain":
				sValue = "txt";
				break;
			case "image/x-dwg":
				sValue = "dwg";
				break;
			case "application/dxf":
				sValue = "dxf";
				break;
			case "application/vnd.google-earth.kmz":
				sValue = "kmz";
				break;
			case "image/tiff":
				sValue = "tiff";
				break;
			case "image/bmp":
				sValue = "bmp";
				break;
			case "image/tif":
				sValue = "tif";
				break;
			case "application/pdf":
				sValue = "pdf";
				break;
			case "image/jpeg":
				sValue = "jpg";
				break;
			case "image/png":
				sValue = "png";
				break;
			case "video/ogg":
				sValue = "mp4";
				break;
			case "application/msword":
				sValue = "doc";
				break;
			case "application/vnd.ms-excel":
				sValue = "xls";
				break;
			case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
				sValue = "xlsx";
				break;
			case "application/vnd.ms-powerpoint":
				sValue = "ppt";
				break;
			case "application/x-rar-compressed":
				sValue = "rar";
				break;
			case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
				sValue = "pptx";
				break;
			case "application/vnd.ms-word.template.macroEnabled.12":
				sValue = "dotm";
				break;
			case "application/vnd.ms-word.document.macroEnabled.12":
				sValue = "docm";
				break;
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.template":
				sValue = "dotx";
				break;
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				sValue = "docx";
				break;
			}
			return sValue;

		},
		getBase64Upload: function (file, tipo) {

			return new Promise(
				function resolver(resolve, reject) {

					var reader = new FileReader();
					reader.onload = function (e) {

						var base64 = e.target.result;
						resolve(base64);
					}.bind(this);
					if (tipo === "Upload") {
						reader.readAsDataURL(file);
					} else {
						reader.readAsBinaryString(file[0].url);
					}

				}.bind(this));
		},
		convertBase64: function (items, destination) {
			var nameModel = "";
			this.sArrayArchivos = [];
			var recorrerPermitidos = function (item, i) {

				if (item.length === i) {
					this.getView().setModel(new JSONModel([]), "oModelListaAdjuntos");

					var oJsonModelAdjuntos = this.getView().getModel("oModelListaAdjuntos");

					this.sArrayArchivos.forEach(function (element) {
						oJsonModelAdjuntos.getData().push(element);
					});
					oJsonModelAdjuntos.refresh();
					this.byId("UploadCollection").setVisible(true);
					this.BusyDialogCargando.close();

				} else {

					if (item[i].Carga === false) {

						this.getBase64Upload(item[i].URL_ADJUNTO, "Upload").then(function (respuestaGetBase64Upload) {

							var json = {
								URL_ADJUNTO: respuestaGetBase64Upload.split(",")[1],
								TITULO: items[i].TITULO,
								VISIBLE: this._outPutVisible,
								ID_DOC_OBL: null,
								SIZE: parseFloat(items[i].SIZE),
								TYPE: items[i].TYPE,
								BASE64: respuestaGetBase64Upload,
								TIPO: "Documento"
							};

							this.sArrayArchivos.push(json);
							item[i].URL_ADJUNTO = respuestaGetBase64Upload.split(",")[1];
							item[i].BASE64 = respuestaGetBase64Upload;
							item[i].Carga = true;
							this._arrUrlImagen.push(item[i].URL_ADJUNTO);
							i++;
							recorrerPermitidos(items, i);
						}.bind(this));
					} else {
						i++;
						recorrerPermitidos(items, i);

					}

				}
			}.bind(this);
			recorrerPermitidos(items, 0);

		},
		onSavefileUploadColection: function (oEvent) {
			this._arrTituloArc = [];
			var arrayPermitidos = [];
			this._arrUrlImagen = [];
			var destinationModel;
			destinationModel = "ARCHIVO";

			this.openBusyDialogCargando();
			//
			var uploadColection = oEvent.getParameters();

			var url = "/HANA/GESTOR_DOCUMENTAL/XSJS/getFormatoPermitidos.xsjs?cmd=get&categoria=0&tipoDocumento=2801";
			var oModelDetalle = new JSONModel();
			oModelDetalle.loadData(url, null, false);

			var oModelFPermitidos = new JSONModel(oModelDetalle.getData());
			this.getView().setModel(oModelFPermitidos, "oModelFormatosPermitidos");
			var oModelFormatos = this.getView().getModel("oModelFormatosPermitidos").getData();
			var items = uploadColection.files;

			if (items.length <= 3) {

				var countPesoCero = 0;

				var functionRecorrerFiles = function (item, i) {

					if (item.length === i) {
						this.convertBase64(arrayPermitidos, destinationModel);
						var mjs = "No fue posible cargar algunos archivos, su peso no es superior a 0.";
						if (countPesoCero > 0) {
							if (countPesoCero === 1) {
								mjs = "No fue posible cargar un archivo, su peso no es superior a 0.";
							}
							MessageToast.show(mjs, {
								duration: 5000
							});
						}
					} else {
						var filePreview = item[i];
						var fileTypereview = filePreview.type;
						var _typeArch = this.getFormatType(fileTypereview);
						var filesize = filePreview.size;
						if (filesize > 0) {
							var sizeMax = filePreview.size / 1000000;
							var textFileSize = sizeMax.toFixed(3) + " MB";
							this._sSizeFile = sizeMax.toFixed(3);
							var div = filePreview.name.split(".");
							var nameArch = "." + div[(div.length - 1)];

							var functionRecorrerFormatosPermitidos = function (itemFormatoPermitido, b, entro, textFormatosPermitdos) {

								if (itemFormatoPermitido.length === b) {
									if (entro) {
										i++;
										functionRecorrerFiles(items, i);
									} else {
										MessageBox.information("Formato no soportado.", {
											title: "Aviso",
											actions: [sap.m.MessageBox.Action.CLOSE],
											details: '<p><strong>El formato del archivo no es permitido.</strong></p>',
											styleClass: "",
											contentWidth: "100px"
										});
										this.busyGlobal(false);
									}

								} else {
									var lengthMax = itemFormatoPermitido.length - 1;
									var formatoPermitido = itemFormatoPermitido[b].EXTENSION;
									var sizePermitido = itemFormatoPermitido[b].SIZE * 1000000;
									var textSizePermitido = itemFormatoPermitido[b].SIZE + " MB"
									var textFormatosPermitdos = itemFormatoPermitido[lengthMax].TEXTO;

									//	textFormatosPermitdos = textFormatosPermitdos.slice(0, textFormatosPermitdos.length-1);

									if (nameArch === formatoPermitido) {
										entro = true;
										if (filesize <= sizePermitido) {
											this.jsonCarga = {
												URL_ADJUNTO: items[i],
												TITULO: items[i].name,
												Carga: false,
												TYPE: _typeArch,
												SIZE: filesize,
												BASE64: items[i]
											};
											arrayPermitidos.push(this.jsonCarga);
										} else {
											entro = true;
											MessageBox.information("Tamaño no soportado.", {
												title: "Aviso",
												actions: [sap.m.MessageBox.Action.CLOSE],
												details: '<p><strong>El Tamaño máximo del archivo desigando es de ' + textSizePermitido + ' y el archivo pesa: ' +
													textFileSize + '</strong></p>',
												styleClass: "",
												contentWidth: "100px"
											});
										}
									}
									b++;
									functionRecorrerFormatosPermitidos(oModelFormatos, b, entro, textFormatosPermitdos);
								}
							}.bind(this);
							functionRecorrerFormatosPermitidos(oModelFormatos, 0, false, ' ');
						} else {
							countPesoCero++;
							i++;
							functionRecorrerFiles(items, i);
						}
					}
				}.bind(this);
				functionRecorrerFiles(items, 0);
			} else {
				this.BusyDialogCargando.close();
				MessageToast.show("Solo puedes cargar máximo 3 documentos", {
					duration: 6000
				});
			}
		},

		countTitleLPEntrega: function (oEvent) {

			//Actualiza el numero de registros

			this.getView().byId("oTitleIdLEntregaDetail").setText("Posiciones Entrega(" + this.getView().byId("idtableLPEntrega").getItems().length +
				")");

		},

		enabledObjectView: function (cond) {
			var oVBoxRecepcion = this.getView().byId("oVBoxRecepcionId");
			//var oInputOCRecepcion = this.getView().byId("oInputOCRecepcion");
			var oDatePickerFCRecepcion = this.getView().byId("oDatePickerFCRecepcion");
			var oInputPatenteRecepcion = this.getView().byId("oInputPatenteRecepcion");
			var oInputGuiaDespachoRecepcion = this.getView().byId("oInputGuiaDespachoRecepcion");
			var oDatePickerFDRecepcion = this.getView().byId("oDatePickerFDRecepcion");
			var oTextAreaObservacionRecepcion = this.getView().byId("oTextAreaObservacionRecepcion");

			//oInputOCRecepcion.setEnabled(cond);
			oDatePickerFCRecepcion.setEnabled(cond);
			oInputPatenteRecepcion.setEnabled(cond);
			oInputGuiaDespachoRecepcion.setEnabled(cond);
			oDatePickerFDRecepcion.setEnabled(cond);
			oTextAreaObservacionRecepcion.setEnabled(cond);
			oVBoxRecepcion.setEnabled(cond);
		},

		iniciarView: function (idEstadoIngreso) {
			//	this.openBusyDialogCargando();

			var data = [{
				"TITULO_ESTADO_POSICION": "Preparando"
			}];

			this.bindView(data);

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

			var oModeloDataTemporal = new JSONModel([]);
			this.getView().setModel(oModeloDataTemporal, "oModeloDataTemporal");

			oModeloDataTemporal.setData(data);
			this.getView().byId("oTitlePosicionesIdRecepcion").setText("Posiciones (" + data.POSICIONES.length + ")");
			oModeloDataTemporal.refresh();
			this.BusyDialogCargando.close();

		},

		onRecepcionarIngresoPorSupervisor: function () {
			var contenedor = this.getView().byId("oPageDetailId");
			this.validar(this.InputsViewRecepcionar, "", contenedor).then(function (respuestaValidar) {
				if (!respuestaValidar) {

					this.validarALoMenosUnoSeleccionadoSupervisor().then(function (respuesta) {
						if (respuesta) {
							MessageBox.information('¿Seguro que deseas recepcionar el trabajo realizado?', {
								title: "Aviso",
								actions: ["Si", "No"],
								styleClass: "",
								onClose: function (sAction) {
									if (sAction === "Si") {

										//this.openBusyDialogCargando();

										this.consultaIngresoTomado().then(function (respuestaIngresoTomado) {
											if (!respuestaIngresoTomado.resolve) {
												this.recepcionarComoSupervisor();
											} else {
												this.BusyDialogCargando.close();
												MessageBox.information("Este ingreso está siendo tratado actualmente por otro usuario, ¿Desea continuar?", {
													title: "Aviso",
													details: "<p><strong>Datos de acceso:</strong></p>\n" +
														"<ul>" +
														"<li><strong> > Nombre:</strong> " + respuestaIngresoTomado.data[0].NOMBRE_COMPLETO + "</li>" +
														"<li><strong> > Fecha:</strong> " + respuestaIngresoTomado.data[0].FECHA + "</li>" +
														"<li><strong> > Hora:</strong> " + respuestaIngresoTomado.data[0].HORA + "</li>" +
														"</ul>",
													contentWidth: "100px",
													styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
													actions: ["Si", "No"],
													emphasizedAction: "Si",
													onClose: function (oAction) {
														if (oAction === "Si") {
															//this.openBusyDialogCargando();
															this.recepcionarComoSupervisor();
														} else {
															this.volverAlListMenu();
														}
													}.bind(this),
												});
											}
										}.bind(this));

									}
								}.bind(this)
							});
						} else {
							MessageToast.show("Ingresa cantidad, asigna almacén y/o selecciona a lo menos una posición para continuar.", {
								duration: 6000
							});
						}
					}.bind(this));
				} else {
					this._wizard.goToStep(this.getView().byId("CabeceraStep"));
					MessageToast.show("Completa los campos obligatorios para continuar.");

					jQuery.sap.delayedCall(3000, this, function () {
						this.quitarState(this.InputsView, "");
					}.bind(this));
				}
			}.bind(this));
		},

		btnReestablecerEntrega: function (oEvent) {

			MessageBox.information('¿Seguro deseas cancelar?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {

					if (sAction === "Si") {

						this.byId("chkEntrega").setSelected(false);
						this.byId("chkEntrega").setText("Seleccionar Todos");
						var listItems = this.byId("idtableLPEntrega").getItems();

						listItems.forEach(function (element, index) {

							element.getContent()[0].getItems()[0].getContent()[0].getItems()[0].setSelected(false);
							element.getContent()[0].getItems()[0].getContent()[0].getItems()[0].setValueState("None");

						}.bind(this));

						this.resetMasterDetail();

					}
				}.bind(this)

			});
		},
		capturePhoto: function (oEvent) {

			var oNav = navigator.camera;
			oNav.getPicture(this.onPhotoDataSuccess.bind(this), this.onFail, {
				quality: 25,
				destinationType: oNav.DestinationType.DATA_URL
			});

		},

		onPhotoDataSuccess: function (imageData) {

			var imagen = "data:image/png;base64," + imageData;
			//var carousel = this.getView().byId("oModelImage");
			var oModelImages = this.getView().getModel("oModelImage");
			var json = {
				BASE64: imagen,
				VISIBLE: true,
				TIPO: "Imagen"
			};
			this.byId("mensajeFoto").setVisible(true);
			var cant = oModelImages.getData().length;

			if (cant <= 2) {
				oModelImages.getData().unshift(json);
				oModelImages.refresh();
			} else {
				MessageToast.show("Solo puedes cargar máximo 3 fotos", {
					duration: 6000
				});
			}

			this.corre++;

		},
		deleteImage: function (oEvent) {

			var path = oEvent.getSource().getBindingContext("oModelImage").getPath().slice(1);
			var oModelImages = this.getView().getModel("oModelImage");
			oModelImages.getData().splice(Number(path), 1);
			oModelImages.refresh();

		},
		onDeleteFile: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("oModelListaAdjuntos").getPath().slice(1);
			var oModelImages = this.getView().getModel("oModelListaAdjuntos");
			oModelImages.getData().splice(Number(path), 1);
			oModelImages.refresh();

		},
		onFail: function () {},

		verificaEntrega: function (datos) {
			var contSeleccion = false;
			var posicionInicial = 0;
			var flagPos = true;
			var msg = "";
			return new Promise(
				function resolver(resolve, reject) {
					var functionRecorrer = function recorrer(item, i) {
						if (datos.length === i) {
							if (!contSeleccion) {
								resolve({
									resultado: false,
									detail: "Debe seleccionar al menos 1 posición para iniciar la entrega."
								});
							} else {
								if (!flagPos) {
									resolve({
										resultado: false,
										detail: msg
									});

								} else {
									resolve({
										resultado: true,
										detail: ""
									});
								}

							}

						} else {
							var seleccion = item[i].getContent()[0].getItems()[0].getContent()[0].getItems()[0].getSelected();
							if (seleccion) {
								contSeleccion = true;
								var pos = item[i].getContent()[0].getItems()[0].getContent()[2].getItems()[1].getText();

								if (pos === posicionInicial) {
									flagPos = false;
									msg = "No puede seleccionar 2 posiciones iguales para la reserva.";
									item[i].getContent()[0].getItems()[0].getContent()[0].getItems()[0].setValueState("Error");
									posicionInicial = pos;
								} else {
									posicionInicial = pos;
								}

							}
							i++;
							functionRecorrer(item, i);
						}

					}.bind(this);
					functionRecorrer(datos, 0);

				}.bind(this));
		},

		cerraraddMotivoReserva: function () {
			//this.onRestablecerBusqueda();
			this.addMotivoReserva.destroy();
		},

		nameFileAbastecimiento: function (reserva) {

			var fecha = new Date();
			fecha = fecha.toString().replace(/\ /g, "_").replace(/\:/g, "-");
			fecha = fecha.split("GMT")[0];
			var name = "imagen_reserva_" + reserva + "_" + fecha;

			return name;
		},

		cargaImagenesBiblioteca: function (datos, reserva, nro_material) {
			return new Promise(
				function resolver(resolve, reject) {
						
							
					var functionRecorrer = function recorrer(item, i) {
					
						if (i === item.length) {
							resolve(true);
						} else {

							if (item[i].BASE64 !== undefined) {
								if (item[i].BASE64.length > 0) {

									var record = {};
									record.NOMBRE_USUARIO = this.userSCPName;
									record.BASE64 = item[i].BASE64;
									record.PERIODO = new Date().getFullYear().toString();
									record.NUMERO_MATERIAL = nro_material;
									record.DOCUMENTO_SALIDA = this.docSAP;
									record.NUMERO_RESERVA = reserva;
									
									if(item[i].TIPO === "Imagen"){
										record.NOMBRE_ARCHIVO = this.nameFileAbastecimiento(reserva);
									}else{
										record.NOMBRE_ARCHIVO = item[i].TITULO;
									}
									
									
									
									
									
									
									/*var jsonData = [];
									jsonData.push(record);*/

									apiBibliotecaDigital.consultaIds(record).then(function (retorno) {
										var idApp = retorno[0];
										var idPro = retorno[1];
										var metadataManual = retorno[2];

										if (idApp !== null && idPro !== null) {

											apiBibliotecaDigital.cargarArchivo(idApp, idPro, record, metadataManual).then(function (res) {
												i++;
												functionRecorrer(item, i);

											}.bind(this));
										} else {
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
							i++;
							functionRecorrer(item, i);
						}

					}.bind(this);
					//eliminar reserva posicion 00000
					functionRecorrer(datos, 0);
				}.bind(this));
		},

		cargaDetalleEntrega: function (datos, reserva, dataPos) {
			var str = "<ul>";
       var cargaB = false
			return new Promise(
				function resolver(resolve, reject) {

					if (datos.length === 0) {
						resolve({
							resolve: true,
							detail: str

						});
					} else {

						var functionRecorrer = function recorrer(item, i) {

							if (i === item.length) {
								str += "</ul>";
								resolve({
									resolve: true,
									detail: str,
									datosPosicion: dataPos
 
								});

							} else {
								if (item[i].Type === "I") {

									dataPos[i].DocSAP = item[i].Mblnr + "-" + item[i].Mjahr;
									this.docSAP = dataPos[i].DocSAP;
									dataPos[i].Resultado = true;
									cargaB = true;
									str += "<li>La entrega se ha gestionado  satisfactoriamente con el siguiente mensaje: " +
										item[i].Message + ". </li>";

								} else {
									dataPos[i].Resultado = false;
									dataPos[i].DocSAP = " - ";
									this.docSAP = " - ";
									str += "<li>La entrega ha arrojado el siguiente error: " + item[i].Message + ". </li>";
									

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
		gestionEntregaReserva: function (datos, tipo) {
			return new Promise(
				function resolver(resolve, reject) {
					console.log(datos);

					var reserva = datos.NavEntrReservaPos[0].Rsnum;
					var posicion = datos.NavEntrReservaPos[0].Rspos;

					this.getView().getModel("oModelSAPERP").create('/EntrReservaSet ', datos, {
						success: function (oResult) {
							console.log(oResult);
							var data = oResult.NavEntrReservaDoc.results;
							var dataPos = oResult.NavEntrReservaPos.results;

							if (data.length > 0) {

								this.cargaDetalleEntrega(data, reserva, dataPos).then(function (respuestaCargaDetalle) {

									this.cargaHana(respuestaCargaDetalle.datosPosicion, tipo).then(function (
										respuestacargaHana) {

										var valor = 0;
										var arrImage = this.getView().getModel("oModelImage").getData();
										var arrDoc = this.getView().getModel("oModelListaAdjuntos").getData();
										valor = Number(arrImage.length) + Number(arrDoc.length);
										//colocar condicion si resultado exitoso
										if (valor > 0) {
											var model = new JSONModel([]);
											this.getView().setModel(model, "oModelEvidencia");
											var oModelEvidencias = this.getView().getModel("oModelEvidencia").getData();
											arrImage.forEach(function (elementt, indexx) {
												oModelEvidencias.push(elementt);
											}.bind(this));
											arrDoc.forEach(function (elementt, indexx) {
												oModelEvidencias.push(elementt);
											}.bind(this));

											var reserva = dataPos[0].Rsnum;
											var nro_material = dataPos[0].Matnr;

											this.cargaImagenesBiblioteca(oModelEvidencias, reserva, nro_material).then(function (respCargaHana) {
												respuestaCargaDetalle.detail += "</ul>";
												resolve({

													resolve: true,
													detail: respuestaCargaDetalle.detail,
													error: ""
												});

											}.bind(this));

										} else {
											respuestaCargaDetalle.detail += "</ul>";
											resolve({

												resolve: true,
												detail: respuestaCargaDetalle.detail,
												error: ""
											});
										}
									}.bind(this));

								}.bind(this));
							}

						}.bind(this),
						error: function (oError) {

							var dataError = [];
							var mensaje = "";
							try {
								mensaje = JSON.parse(oError.responseText).error.message.value;
								var record = {};
								record.Rspos = posicion;
								record.Message = mensaje;

								this.cargaDetalleEntrega(dataError, reserva, record).then(function (respuestaCargaDetalle) {
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

		listaPosiciones: function (datos) {
			var generaReserva = {};
			generaReserva.NavEntrReservaPos = [];
			generaReserva.NavEntrReservaDoc = [];

			return new Promise(
				function resolver(resolve, reject) {
					var functionRecorrer = function recorrer(item, i) {
						if (datos.length === i) {
							var str = "<ul>";
							var cont = generaReserva.NavEntrReservaPos.length
							if (cont === 1) {
								str += "<li> Se gestionará " + cont + " posición.</li>";
							} else {
								str += "<li> Se gestionarán " + cont + " posiciones.</li>";
							}

							resolve({
								detail: str,
								datos: generaReserva
							});

						} else {
							var seleccionado = item[i].getContent()[0].getItems()[0].getContent()[0].getItems()[0].getSelected();

							if (seleccionado) {
								var elementt = item[i];
								generaReserva.Ikey = "1";
								var recordNavPos = {};
								recordNavPos.Ikey = "1";
								var obj = elementt.getBindingContext("oModeloDataTemporalDetailEntrega").getObject();
								recordNavPos.Rsnum = this.idIngreso;
								recordNavPos.Rspos = obj.Rspos; //Edm.String" MaxLength="4" "Posición"/>
								recordNavPos.TipoDespacho = obj.TipoDespacho; //Edm.String" MaxLength="2" "Tipo Despacho"/>
								recordNavPos.DescTipoDespacho = obj.DescTipoDespacho; //Edm.String" MaxLength="50" "Descripción"/>
								recordNavPos.Bdter = obj.Bdter; //Edm.DateTime" Precision="7" "Fecha necesidad"/>
								recordNavPos.Matnr = obj.Matnr; //Edm.String" MaxLength="18" "Material"/>
								recordNavPos.Maktx = obj.Maktx; //Edm.String" MaxLength="40" "Denominación"/>
								recordNavPos.Estado = obj.Estado; //Edm.String" MaxLength="3" "Estado Reserva"/>
								recordNavPos.Uexnam = obj.Uexnam; //Edm.String" MaxLength="12" "Ejecutado por"/>
								recordNavPos.Dexdat = obj.Dexdat; //Edm.DateTime" Precision="7" "Fecha ejecución"/>
								recordNavPos.Texdat = this.getHourERP(obj.Texdat); //Edm.Time" Precision="0" "Hora ejecución"/>
								recordNavPos.CantSolicitada = parseFloat(obj.CantSolicitada).toFixed(2); //Edm.Decimal" Precision="13" Scale="3" "Cantidad"/>
								recordNavPos.CantEnviada = parseFloat(obj.CantEnviada).toFixed(2); //Edm.Decimal" Precision="13" Scale="3" "Cantidad"/>
								recordNavPos.CantEnviar = parseFloat(obj.CantEnviar).toFixed(2); //Edm.Decimal" Precision="13" Scale="3" "Cantidad"/>
								recordNavPos.CantPreparada = parseFloat(obj.CantPreparada).toFixed(2); //Edm.Decimal" Precision="13" Scale="3" "Cantidad"/>
								recordNavPos.Meins = obj.Meins; //Edm.String" MaxLength="3" 
								recordNavPos.Ekgrp = obj.Ekgrp; //Edm.String" MaxLength="3" "Grupo compras"/>
								recordNavPos.Bodeguero = obj.Bodeguero; //Edm.String" MaxLength="12" "Usuario"/>
								recordNavPos.Supervisor = obj.Supervisor; //Edm.String" MaxLength="12" "Usuario"/>
								recordNavPos.Creador = obj.Creador; //Edm.String" MaxLength="12" "Usuario"/>
								recordNavPos.Werks = obj.Werks; //Edm.String" MaxLength="4" "Centro"/>
								recordNavPos.Lgort = obj.Lgort; //Edm.String" MaxLength="4" "Almacén"/>
								recordNavPos.Charg = obj.Charg; //Edm.String" MaxLength="10" "Lote"/>
								recordNavPos.Lgpbe = obj.Lgpbe; //Edm.String" MaxLength="10" "Ubicación"/>
								recordNavPos.Integracion = obj.Integracion; //Edm.String" MaxLength="100" "Integración"/>
								recordNavPos.Grund = this.idGrund; //Edm.String" MaxLength="4" "Motivo del mov."/>
								recordNavPos.ItemText = this.idItemText; //Edm.String" MaxLength="50" "Texto"/>
								generaReserva.NavEntrReservaPos.push(recordNavPos);

							}

							i++;
							functionRecorrer(item, i);
						}

					}.bind(this);
					functionRecorrer(datos, 0);

				}.bind(this));

		},

		onInsertarMotivo: function (oEvent) {
			var listItems = this.getView().byId("idtableLPEntrega").getItems();
			this.cerraraddMotivoReserva();
			this.openBusyDialogCargando();

			this.listaPosiciones(listItems).then(function (respGestionEntrega) {
				console.log(respGestionEntrega)
				this.BusyDialogCargando.close();
				MessageBox.information("¿Seguro deseas gestionar la reserva N° " + this.idIngreso + "?", {
					title: "Aviso",
					details: respGestionEntrega.detail,
					actions: ["Si", "No"],
					styleClass: "",
					onClose: function (sAction) {
						if (sAction === "Si") {
							this.openBusyDialogCargando();
							this.gestionEntregaReserva(respGestionEntrega.datos, "Entrega").then(function (respuestagestionEntregaReserva) {

								if (this.docSAP !== " - ") {
									respuestagestionEntregaReserva.detail += "<p><strong>NRO DOCUMENTO SAP:" + this.docSAP + " </strong>";
								}

								MessageBox.information("Gestión Reserva N° " + this.idIngreso, {
									title: "Aviso",
									details: respuestagestionEntregaReserva.detail,
									onClose: function (sAction) {

										this.BusyDialogCargando.close();
										this.resetMasterDetail();
									}.bind(this)
								});

							}.bind(this));
						}
					}.bind(this)

				});

			}.bind(this));

		},

		onEntregar: function (oEvent) {
			var listItems = this.getView().byId("idtableLPEntrega").getItems();
			this.openBusyDialogCargando();
			this.verificaEntrega(listItems).then(function (respVerificaE) {
				if (!respVerificaE.resultado) {
					MessageToast.show(respVerificaE.detail, {
						duration: 6000
					});
					this.BusyDialogCargando.close();
				} else {
					this.BusyDialogCargando.close();
					this.addMotivoReserva = sap.ui.xmlfragment("com.gasco.Abastecimiento.view.fragments.addMotivoReserva", this);
					this.getView().addDependent(this.addMotivoReserva);

					this.addMotivoReserva.attachAfterClose(function () {
						this.cerraraddMotivoReserva();
					}.bind(this));

					//this.dialogShowAdjuntos.setModel(this.getView().getModel("mainModel"));
					this.addMotivoReserva.open();

				}

			}.bind(this));

			/*MessageBox.information('¿Seguro deseas Entregar?', {
				title: "Aviso",
				actions: ["Si", "No"],
				styleClass: "",
				onClose: function (sAction) {
					if (sAction === "Si") {}
				}.bind(this)

			});*/

		},

		recepcionarComoSupervisor: function () {

			var error = "";
			var ot = this.getView().byId("oInputOCRecepcion").getValue();
			var guiDespacho = this.getView().byId("oInputGuiaDespachoRecepcion").getValue();

			var fechaConta = this.getView().byId("oDatePickerFCRecepcion").getDateValue();
			var patente = this.getView().byId("oInputPatenteRecepcion").getValue();
			var fechaGuia = this.getView().byId("oDatePickerFDRecepcion").getDateValue();
			var observacion = this.getView().byId("oTextAreaObservacionRecepcion").getValue();

			var recordDataIngresoERP = {};

			recordDataIngresoERP.Ikey = "1"; // Edm.String - MaxLength="1" 
			recordDataIngresoERP.IGmCode = "01"; // Edm.String - MaxLength="2" - sap:label="GM_Code" SIEMPRE 01 EN DURO
			recordDataIngresoERP.IPstngDate = fechaConta; // Edm.DateTime - sap:label="Fecha contab." INGRESO > FECHA_CONTABILIZACION
			recordDataIngresoERP.IDocDate = fechaGuia; // Edm.DateTime - sap:label="Fecha documento" INGRESO > FECHA_GUIA_DESPACHO
			recordDataIngresoERP.RefDocNo = guiDespacho.slice(0, 16); // Edm.String - MaxLength="16" - sap:label="Referencia" INGRESO > GUIA_DESPACHO
			recordDataIngresoERP.BillOfLading = patente.slice(0, 16); // Edm.String - MaxLength="16" - sap:label="Carta" INGRESO > PATENTE

			var obs = observacion;
			if (obs.length > 25) {
				obs = observacion.slice(0, 22) + "...";
			}

			recordDataIngresoERP.HeaderTxt = obs; // Edm.String - MaxLength="25" - sap:label="Texto" INGRESO > FECHA_CONTABILIZACION

			//CrearDocMatItem
			recordDataIngresoERP.NavCrearDocMatItem = [];

			//CrearDocMatSerial
			recordDataIngresoERP.NavCrearDocMatSerial = [];
			/*var recordCrearDocMatSerial = {};

			recordCrearDocMatSerial.Ikey = "1"; //Edm.String" - MaxLength="1"/>
			recordCrearDocMatSerial.MatdocItm = ""; //Edm.String" - MaxLength="4" - sap:label="Posición DocMat"/> POSICION > NUMERO_POSICION
			recordCrearDocMatSerial.Serialno = ""; //Edm.String" - MaxLength="8" - sap:label="Número de serie"/> SERIE_POSICION > NUMERO_SERIE
			recordCrearDocMatSerial.Uii = ""; //Edm.String" - MaxLength="72" - sap:label="UII"/> ?

			recordDataIngresoERP.CrearDocMatSerial.push(recordCrearDocMatSerial);*/

			//CrearDocMatDocumento
			var recordCrearDocMatDocumento = {};
			recordDataIngresoERP.navCrearDocMatDocumento = recordCrearDocMatDocumento;

			recordCrearDocMatDocumento.Ikey = "1"; //Edm.String" - MaxLength="1"/>
			recordCrearDocMatDocumento.EMblnr = ""; //Edm.String" - MaxLength="10" - sap:label="Doc.material"/>
			recordCrearDocMatDocumento.EMjahr = ""; //Edm.String" - MaxLength="4" - sap:label="Ejerc.doc.mat."/>

			var fecha = new Date();
			fecha.setHours(0);
			fecha.setMinutes(0);
			fecha.setSeconds(0);

			var dataIngreso = {
				ID_INGRESO: Number(this.idIngreso),
				ID_OC: this.idOC,
				ID_ESTADO_INGRESO: 2,
				FECHA_CONTABILIZACION: this.convertFechaXSJS(fechaConta),
				GUIA_DESPACHO: guiDespacho,
				FECHA_GUIA_DESPACHO: this.convertFechaXSJS(fechaGuia),
				PATENTE: patente,
				OBSERVACION: observacion,
				FECHA_RECEPCION: this.convertFechaXSJS(fecha),
				HORA_RECEPCION: this.horaXSJS(),
				USER_SCP_COD_RECEPCION: this.userSCPCod,
				FECHA_INBOUND: null,
				HORA_INBOUND: null,
				NUMERO_INGRESO_ERP: null,
				USER_SCP_COD_INBOUND: null
			};

			var creacionConError = 0;

			this.createIngreso(dataIngreso, this.idEstadoIngresoFull).then(function (respuestaIngreso) {
				if (respuestaIngreso.resolve) {
					var idIngreso = respuestaIngreso.idIngreso;
					var idList = this.getView().byId("idtableLPHIRecepcion");

					var posicionesSeleccionadas = [];

					var recorrerPosiciones = function (element, index) {
						if (element.length === index) {

							if (creacionConError === 0) {

								this.createIngresoERP(recordDataIngresoERP).then(function (respuestaCreateIngresoERP) {
									if (respuestaCreateIngresoERP.resolve) {
										this.datosCreacion = {
											ID_AVISO: idIngreso,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivo(respuestaCreateIngresoERP.nroDocumento, "2", idIngreso, "").then(function () {
											this.registrarLog("Ingreso_Temporal_Recepcionado", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialogCargando.close();
												this.preocesoGenerarOCConExito(idIngreso, respuestaCreateIngresoERP.nroDocumento);
											}.bind(this));
										}.bind(this));
									} else {
										var detail = null;

										if (respuestaCreateIngresoERP.error.length > 0) {
											detail = respuestaCreateIngresoERP.error;
											error = respuestaCreateIngresoERP.error;
										}
										this.datosCreacion = {
											ID_AVISO: idIngreso,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivo("", "4", idIngreso, error).then(function () {
											this.registrarLog("Reprocesar_Ingreso_Temporal", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialogCargando.close();
												this.errorAlRecepcionarOC(detail);
											}.bind(this));
										}.bind(this));

									}
								}.bind(this));
							} else {

								this.datosCreacion = {
									ID_AVISO: idIngreso,
									NUMERO_MATERIAL: ""
								};
								this.cambioEstadoMasivo("", "4", idIngreso, "").then(function () {
									this.registrarLog("Reprocesar_Ingreso_Temporal", this.datosCreacion).then(function (respuestaRegistrarLog) {
										this.BusyDialogCargando.close();
										this.errorAlRecepcionarOC(null);
									}.bind(this));
								}.bind(this));
							}
						} else {

							var pos0 = element[index].getContent()[0].getContent()[0].getContent();
							var pos1 = element[index].getContent()[0].getContent()[1].getContent();

							var cantPen = pos1[4].getItems()[1].getText();
							//var cantPenNum = Number(pos1[4].getItems()[1].getText().replace(/\./g, ""));
							if (cantPen !== "0") {
								var codMaterial = pos0[1].getItems()[1].getText();
								var position = pos0[3].getItems()[1].getText();
								var denomination = pos0[4].getItems()[1].getText();

								var ubicacion = pos1[0].getItems()[1].getItems()[0].getText();
								var centro = pos1[1].getItems()[1].getItems()[0].getText();
								var almacen = pos1[2].getItems()[1].getText();
								var cantTotal = pos1[3].getItems()[1].getText();
								var unidadMedida = pos1[5].getItems()[1].getText();
								var step = pos1[6].getItems()[1].getValue().toString();
								//var check = pos1[7].getItems()[0].getSelected();

								var loteo = "";
								var vBoxLote = pos1[8];

								if (vBoxLote.getVisible()) {
									loteo = vBoxLote.getItems()[1].getValue();
								}

								var stockZero = pos1[9].getItems()[1].getText();
								var idPosicion = pos1[10].getItems()[1].getText();
								var codigoSAPProveedor = pos1[11].getItems()[1].getText();
								var idTipoPosicion = pos1[12].getItems()[1].getText();

								if (almacen === "Asignar") {
									almacen = "";
								}

								var dataPosiciones = {
									ID_POSICION: Number(idPosicion),
									ID_INGRESO: idIngreso,
									ID_ESTADO_POSICION: 2,
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
									ID_TIPO_POSICION: Number(idTipoPosicion),
									STOCK_MATERIAL: stockZero,
									CODIGO_SAP_PROVEEDOR: codigoSAPProveedor
								};

								//#region DATOS PARA RECEPCIONAR EN EL ERP
								var recordCrearDocMatItem = {};

								recordCrearDocMatItem.Ikey = "1"; //Edm.String" - MaxLength="1"/> 
								recordCrearDocMatItem.Material = codMaterial.slice(0, 18); //Edm.String" - MaxLength="18" - sap:label="Material"/> POSICION > CODIGO_MATERIAL
								recordCrearDocMatItem.Plant = centro.slice(0, 4); //Edm.String" - MaxLength="4" - sap:label="Centro"/>  POSICION > CENTRO
								recordCrearDocMatItem.StgeLoc = almacen.slice(0, 4); //Edm.String" - MaxLength="4" - sap:label="Almacén"/> POSICION > ALMACEN
								recordCrearDocMatItem.MoveType = "101"; //Edm.String" - MaxLength="3" - sap:label="Cl.movimiento"/> POSICION > SIEMPRE 101 EN DURO
								recordCrearDocMatItem.EntryQnt = step; //Edm.Decimal" - Precision="13" Scale="3" - sap:label="Ctd.en UME"/> POSICION > CANTIDAD_MATERIAL_INGRESADO
								recordCrearDocMatItem.EntryUom = unidadMedida.slice(0, 3); //Edm.String" - MaxLength="3" - sap:label="UM entrada"/> POSICION > UNIDAD_DE_MEDIDA_MATERIAL
								recordCrearDocMatItem.PoNumber = this.ordenDeCompra.slice(0, 10); //Edm.String" - MaxLength="10" - sap:label="Pedido"/> ORDEN_DE_COMPRA > ORDEN_DE_COMPRA
								recordCrearDocMatItem.PoItem = position.slice(0, 5); //Edm.String" - MaxLength="5" - sap:label="Posición"/> POSICION > NUMERO_POSICION
								recordCrearDocMatItem.StgeBin = ubicacion.slice(0, 10); //Edm.String" - MaxLength="10" - sap:label="Ubicación"/> POSICION > NUMERO_UBICACION
								recordCrearDocMatItem.Vendor = codigoSAPProveedor.slice(0, 10); //Type="Edm.String" - MaxLength="10" - sap:label="Proveedor"/>
								recordCrearDocMatItem.Batch = loteo.slice(0, 10); //Type="Edm.String" - MaxLength="10" - sap:label="Número de lote"/>

								recordDataIngresoERP.NavCrearDocMatItem.push(recordCrearDocMatItem);

								//#endregion	

								this.createPosicionIngreso(dataPosiciones, this.idEstadoIngresoFull).then(function (respuestaPosicionIngreso) {
									if (respuestaPosicionIngreso) {
										if (stockZero === "0") {
											this.datosCreacion = {
												ID_AVISO: idIngreso,
												NUMERO_MATERIAL: codMaterial
											};
											this.registrarLog("Stock_Cero_Material", this.datosCreacion).then(function (respuestaRegistrarLog) {
												index++;
												recorrerPosiciones(element, index);
											}.bind(this));
										} else {
											index++;
											recorrerPosiciones(element, index);
										}
									} else {
										creacionConError++;
										index++;
										recorrerPosiciones(element, index);
									}
								}.bind(this));
							}

						}
					}.bind(this);

					idList.getItems().forEach(function (elementt, indexx) {
						var pos1 = elementt.getContent()[0].getContent()[1].getContent();
						var check = pos1[7].getItems()[0].getSelected();
						if (check) {
							posicionesSeleccionadas.push(elementt);
						}

						if (idList.getItems().length === indexx + 1) {
							recorrerPosiciones(posicionesSeleccionadas, 0);
						}
					}.bind(this));

				} else {
					this.BusyDialogCargando.close();
					this.errorAlRecepcionarOC(null);
				}
			}.bind(this));

		},

		preocesoGenerarOCConExito: function (idIngreso, nroDoc) {
			MessageBox.success("Ingreso temporal N°" + idIngreso + " fue recepcionado con éxito. \n  \n El documento SAP asociado es el N°" +
				nroDoc + ".", {
					title: "Aviso",
					onClose: function (sAction) {
						this.resetMasterDetail();
					}.bind(this)
				});
		},

		errorAlRecepcionarOC: function (detail) {

			MessageBox.information(
				"No fue posible recepcionar el ingreso de la Orden de Compra, intenta más tarde o comunícate con el área encargada.", {
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
			this.getOwnerComponent().getRouter().navTo("Entrega_master_Dos", {
				estadoReserva: this.idEstadoIngreso,
				idreserva: this.idIngreso
			});

		},

		onExit: function () {
			var oFooterPage = this.getView().byId("oFooterPageId");
			oFooterPage.setVisible(false);
		}

	});

});