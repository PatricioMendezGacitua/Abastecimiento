sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		cargarArchivo: function (idApp, idPro, datos, metadataManual) {

			return new Promise(function (resolve) {

				//Generar Blob
				var b64Or = datos.BASE64;
				var b64Data = b64Or.split(",")[1];
				var content = datos.BASE64.split(";")[0];
				var contentType = content.toString().substring(5, content.length);
				var blob = this.b64toBlob(b64Data, contentType, 512);
				var size = blob.size;

				this.generarJsonData(datos, metadataManual, size, contentType).then(function (jsonData) {

					this.uploadFilesTubo(jsonData.jsonArray, idApp, idPro).then(function (dataResponse) {
						if (dataResponse.resolve) {
							//Obtener Token de Sharepoint
							this.obtenerTokenSharepoint().then(function (token) {
								if (token !== null) {
									//Enviar archivo a Sharepoint
									var fileName = jsonData.title;
									var path = dataResponse.datos.ESTRUCTURA_CARGA[0].PATH;
									this.enviarArchivoSharepoint(blob, token, fileName, path).then(function (resURL) {
										if (resURL !== null) {
											var resURLFinal = "https://gascoglp.sharepoint.com" + encodeURI(resURL.toString());
											//Actualizar path en Bibliotecta
											this.actualizarPathBiblioteca(dataResponse.datos, resURLFinal, idApp, idPro).then(function (resCarga) {
												if (resCarga) {
													resolve({
														resolve: true,
														url: resURLFinal
													});
												} else {
													resolve({
														resolve: false,
														url: resURLFinal
													});
												}
											}.bind(this));
										} else {
											//TODO
										}
									}.bind(this));
								} else {
									//No se pudo obtener token
								}
							}.bind(this));

						} else {
							resolve({
								resolve: false,
								url: ""
							});
						}
					}.bind(this));
				}.bind(this));

			}.bind(this));
		},

		obtenerTokenSharepoint: function () {
			return new Promise(function (resolve) {
				var url = "/GestDocumental/servicesTubo.xsjs?cmd=getFile";
				var ojsonModel = new sap.ui.model.json.JSONModel();
				ojsonModel.attachRequestCompleted(function (oEvent2) {
					var respuesta = oEvent2.getSource().getData();
					if (respuesta === false) {
						resolve(null);
						return;
					} else {
						resolve(respuesta);
					}
				}.bind(this));
				ojsonModel.loadData(url, null, false);
			}.bind(this));
		},

		b64toBlob: function (b64Data, contentType, sliceSize) {
			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {
				type: contentType
			});
			return blob;
		},

		enviarArchivoSharepoint: function (file, token, fileName, path) {
			return new Promise(function (resolve) {
				var settings = {
					"url": "/Sharepoint/sites/GDG/_api/web/GetFolderByServerRelativeUrl('" + path + "')/Files/add(url='" + fileName +
						"',overwrite=true)",
					"method": "POST",
					"timeout": 0,
					"headers": {
						"Authorization": "Bearer " + token,
						"Content-Type": "application/x-www-form-urlencoded",
						"Accept": "application/json;odata=verbose"
					},
					"processData": false,
					"data": file
				};

				$.ajax(settings).done(function (response) {
					var url = response.d.ServerRelativeUrl;
					resolve(url);
				}.bind(this)).fail(function (error) {
					console.log(error);
					resolve(null);
				}.bind(this));

			}.bind(this));
		},

		actualizarPathBiblioteca: function (data, path, idApp, idProceso) {
			return new Promise(function (resolve) {
				var json = data;
				json.ESTRUCTURA_CARGA[0].PATH_SHARE_POINT = path;
				var url = '/GestDocumental/ApiRestBiblioteca.xsjs?cmd=updateSP&idApp=' + idApp + '&idPro=' + idProceso;
				$.ajax({
					url: url,
					method: "POST",
					data: JSON.stringify(json),
					success: function (oResult) {
						var respuesta = oResult;
						if (respuesta.SUCCESS) {
							var datos = respuesta;
							resolve(true);
						} else {
							resolve(false);
						}
					}.bind(this),
					error: function (oError) {
						console.log(oError);
						resolve(false);
					}.bind(this)
				});
			}.bind(this));
		},

		uploadFilesTubo: function (json, idApp, idProceso) {
			return new Promise(function (resolve) {

				//var url = '/GestDoc/servicesTubo.xsjs?cmd=saveTubo&idApp=' + idApp + '&idPro=' + idProceso;
				var url = '/GestDocumental/ApiRestBiblioteca.xsjs?cmd=saveApi&idApp=' + idApp + '&idPro=' + idProceso;

				$.ajax({
					url: url,
					method: "POST",
					data: JSON.stringify(json),
					success: function (oResult) {
						var respuesta = oResult;

						if (respuesta.SUCCESS) {
							var datos = respuesta;

							resolve({
								resolve: true,
								datos: datos
							});
						} else {
							resolve({
								resolve: false,
								datos: ""
							});
						}
					}.bind(this),
					error: function (oError) {
						console.log(oError);
						resolve({
							resolve: false,
							datos: ""
						});
					}.bind(this)
				});

			}.bind(this));
		},

		nameFileAbastecimiento: function (idOrden, gd) {

			var fecha = new Date();
			fecha = fecha.toString().replace(/\ /g, "_").replace(/\:/g, "-");
			fecha = fecha.split("GMT")[0];
			var name = "OC_" + idOrden + "GD_" + gd + "_" + fecha;

			return name;
		},

		generarJsonData: function (datos, estructura, size, contentType) {
			return new Promise(function (resolve) {

				var fecha = new Date();
				fecha.setHours(0);
				fecha.setMinutes(0);
				fecha.setSeconds(0);
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "yyy/MM/dd"
				});

				var date = oDateFormat.format(fecha);

				var title = this.nameFileAbastecimiento(datos.ORDEN_COMPRA, datos.GUIA_DESPACHO);
				var div = datos.BASE64.split(",");
				var format = this.consultaFormato(div[0]);

				var base64 = div[1];
				var user = datos.NOMBRE_USUARIO;

				var jsonArray = [{
					"CONTAINS_FILE": false,
					"DATE": "",
					"APP": "",
					"DOCUMENT_NAME": "",
					"NODE_NAME": datos.PERIODO,
					"VALIDATION": [{
						"TIPO_DATO": "Date",
						"TABLA_SAP": "",
						"CAMPO_TABLA_SAP": "",
						"LARGO_DATO": "",
						"FORMATO_FECHA": "yyyy"
					}],
					"DOCUMENT": []
				}, {
					"CONTAINS_FILE": false,
					"DATE": "",
					"APP": "",
					"DOCUMENT_NAME": "",
					"NODE_NAME": datos.ORDEN_COMPRA,
					"VALIDATION": [{
						"TIPO_DATO": "DatosSAP",
						"TABLA_SAP": "QMEL",
						"CAMPO_TABLA_SAP": "Número de aviso",
						"LARGO_DATO": "12",
						"FORMATO_FECHA": ""
					}],
					"DOCUMENT": []
				}, {
					"CONTAINS_FILE": true,
					"DATE": date,
					"APP": "Abastecimiento_Inbound",
					"NODE_NAME": "",
					"VALIDATION": [],
					"DOCUMENT": [{
						"BASE64": base64,
						"URL": "",
						"TITLE": title,
						"FORMAT": format,
						"SIZE": size,
						"USER": user,
						"ID_DOC_BASE": 0,
						"DESCRIPTOR": "",
						"CONTAINS_MANUAL_METADATA": true,
						"MANUAL_METADATA": estructura
					}]
				}];

				var res = {
					title: title + "." + format,
					jsonArray: jsonArray
				};

				resolve(res);

			}.bind(this));
		},

		addZero: function (sValue) {
			if (sValue < 10) {
				sValue = "0" + sValue;
			}
			return sValue;
		},

		formatterFecha: function (sValue) {
			var fecha = new Date(sValue);
			var dia = fecha.getDate();
			var mes = fecha.getMonth() + 1;
			var anio = fecha.getFullYear();
			dia = this.addZero(dia);
			mes = this.addZero(mes);
			var fechaCreacion = String(anio + "-" + mes + "-" + dia);

			return fechaCreacion;
		},

		consultaFormato: function (sValue) {
			var retorno = "";

			switch (sValue) {

			case "data:application/pdf;base64":
				retorno = "pdf";
				break;
			case "data:image/png;base64":
				retorno = "png";
				break;
			case "data:image/jpeg;base64":
				retorno = "jpg";
				break;
			case "data:image/jpg;base64":
				retorno = "jpg";
				break;
			}
			return retorno;
		},

		consultaIgualesFinal: function (cadena) {
			var retorno = 1;
			var consulta = cadena.slice(-2);
			if (consulta === "==") {
				retorno = 2;
			}
			return retorno;
		},

		consultaIds: function (datos) {

			return new Promise(function (resolve) {
				var jsonMetadataManual = [];
				var idApp = 12;
				var idPro = 1876;

				jsonMetadataManual = [{
					ATTRIBUTE: "PERIODO",
					VALUE: datos.PERIODO
				}, {
					ATTRIBUTE: "ORDEN COMPRA",
					VALUE: datos.ORDEN_COMPRA
				}, {
					ATTRIBUTE: "CODIGO MATERIAL",
					VALUE: datos.CODIGO_MATERIAL
				}, {
					ATTRIBUTE: "GUIA DESPACHO",
					VALUE: datos.GUIA_DESPACHO
				}];

				resolve([idApp, idPro, jsonMetadataManual]);

			}.bind(this));

		}

	};
});