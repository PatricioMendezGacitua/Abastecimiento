sap.ui.define([], function () {
	"use strict";

	return {

		datosUsuario: function () {
			return new Promise(
				function resolver(resolve, reject) {
					var userMail = "";
					$.ajax({
						url: "/apiusuario/services/userapi/currentUser",
						method: "GET",
						success: function (oResult) {
							var datosUser = oResult;

							if (datosUser !== undefined) {
								userMail = datosUser.email;
								if (window.location.hostname === "webidetesting5200712-pnci3ek7c9.dispatcher.us3.hana.ondemand.com" || window.location.hostname ===
									"webidecp-qxjrzckg6d.dispatcher.us3.hana.ondemand.com") {
									userMail = "usuariobodega@sapnet.cl"; //"cuadrillasos@gmail.com"; //"luzmilacanales@gmail.com"; "marcelo@logisticaengas.cl"
								}
								userMail = "fherrera@sapnet.cl";
								resolve({
									resolve: true,
									userMail: userMail
								});
							} else {
								resolve({
									resolve: false,
									userMail: userMail
								});
							}
						}.bind(this),
						error: function (oError) {
							resolve({
								resolve: false,
								userMail: userMail
							});
						}
					});

				}.bind(this));

		}
	}

});