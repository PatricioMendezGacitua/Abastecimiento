var mobile_appRoutes = [{
	"path": "/apiusuario",
	"destination": "USER_API_IM"
}, {
	"path": "/HANA",
	"destination": "HANA"
}, {
	"path": "/GestDoc",
	"destination": "GEST_DOCUMENTA",
	"originDestination": "GEST_DOCUMENTAL",
	"entryPath": "/"
}, {
	"path": "/GestDocumental",
	"destination": "GEST_DOCUMENT",
	"originDestination": "GEST_DOCUMENTAL_CLONING",
	"entryPath": "/"
}, {
	"path": "/GW_ODP",
	"destination": "GW_ODP_TOKEN"
}];