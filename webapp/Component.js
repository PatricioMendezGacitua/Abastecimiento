sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/gasco/Abastecimiento/model/models",
	"com/gasco/Abastecimiento/js/FileSaver",
	"com/gasco/Abastecimiento/js/jszip",
	"com/gasco/Abastecimiento/js/jszip-utils"
], function (UIComponent, Device, models, FileSaver, jszip) {
	"use strict";

	return UIComponent.extend("com.gasco.Abastecimiento.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});