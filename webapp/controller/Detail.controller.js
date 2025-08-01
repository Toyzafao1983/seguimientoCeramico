sap.ui.define([
    "com/aris/seguimiento/ceramico/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/aris/seguimiento/ceramico/pe/model/models",
    "com/aris/seguimiento/ceramico/pe/model/formatter",
    "com/aris/seguimiento/ceramico/pe/services/Services",
	"com/aris/seguimiento/ceramico/pe/util/util",
    'com/aris/seguimiento/ceramico/pe/util/utilUI'
], (BaseController, Controller, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;
    var sTipo="";
    var sCliente="";
    var sEstado="";
    return BaseController.extend("com.aris.seguimiento.ceramico.pe.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            this.frgIdDetailVGE= "frgIdDetailVGE";
            this.frgIdDetailCS= "frgIdDetailCS";
            this.frgIdDetailES= "frgIdDetailES";
        },
        handleRouteMatched: function(bInit){
            sap.ui.core.BusyIndicator.show(0);
            let sNumPedido= this.oRouter.getHashChanger().hash.split("/")[1];
            Promise.all([ this._getData(sNumPedido),this._getPedidoDetalle(sNumPedido),this._getListDespacho(sNumPedido),
                this._getListFacturas(sNumPedido),this._getListCotiSegui(sNumPedido),this._getDataClient()]).then((values) => {
                let sNumPedido= this.oRouter.getHashChanger().hash.split("/")[1];
                sTipo=values[0].oResults[0].txt4;
                sCliente=values[0].oResults[0].txt2;
                sEstado=values[0].oResults[0].txt11;
                let oDataDetalle = values[1].d.results;
                let oDataListDespacho = values[2].d.results;
                let oDataListFacturas = values[3].d.results;
                let oDataListSegui = values[4].d.results;
                let oDataListCliente = values[5].d.results;
                let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");
                if(sIdioma == undefined){
                    that._setLanguageModel("esp");
                }else{
                    that._setLanguageModel(sIdioma);
                }
                if(that.getModel("oModelProyect").getProperty("/oCabecera")== undefined){
                    let jData=values[0].oResults[0];
                    that.getModel("oModelProyect").setProperty("/oCabecera", jData);   
                }
                let oDetalleFiltro= oDataDetalle.filter(item => item.txt1 == sNumPedido);
                let oListDespacho= oDataListDespacho.filter(item => item.txt1 == sNumPedido);
                let oListFacturas= oDataListFacturas.filter(item => item.txt1 == sNumPedido);
                let oListSeguimiento= oDataListSegui.filter(item => item.txt1 == sNumPedido);

                //for para sumar los valores Vista CS
                let sValoresCS1=0;
                let sValoresVGECantPedi=0;
                let sValoresVGECantDesp=0;
                let sValoresVGECantPend=0;
                let sValoresVGECantPaletas=0;
                let sValoresVGECantCaja=0;

                oDetalleFiltro.forEach(function(item) {
                   
                    sValoresVGECantPedi += item.txt6;
                    sValoresVGECantDesp += item.txt7;
                    sValoresVGECantPend += item.txt8;
                    sValoresVGECantPaletas += item.txt10;
                    sValoresVGECantCaja += item.txt11;

                    }
                );

                oListSeguimiento.forEach(function(item) {
                   
                    sValoresCS1 += item.txt6;
                    }
                );
                let oListCliente= oDataListCliente.filter(item => item.txt2 == sCliente);
                that.getModel("oModelProyect").setProperty("/oDetalle",oDetalleFiltro);
                that.getModel("oModelProyect").setProperty("/oListDesp",oListDespacho);
                that.getModel("oModelProyect").setProperty("/oListFac",oListFacturas);
                that.getModel("oModelProyect").setProperty("/oListSegui",oListSeguimiento);
                that.getModel("oModelProyect").setProperty("/oListCliente",oListCliente);

                that.getModel("oModelProyect").setProperty("/oValoresVGECantPedi",sValoresVGECantPedi.toFixed(2));
                that.getModel("oModelProyect").setProperty("/oValoresVGECantDesp",sValoresVGECantDesp.toFixed(2));
                that.getModel("oModelProyect").setProperty("/oValoresVGECantPend",sValoresVGECantPend.toFixed(2));
                that.getModel("oModelProyect").setProperty("/oValoresVGECantPaletas",sValoresVGECantPaletas);
                that.getModel("oModelProyect").setProperty("/oValoresVGECantCaja",sValoresVGECantCaja);

                that.getModel("oModelProyect").setProperty("/oValorestot",sValoresCS1.toFixed(2));

                let sComponentDetailVGE = "";
                let sComponentDetailCS = "";
                let sComponentDetailES = "";
                sComponentDetailVGE = "DetailVGE";  
                sComponentDetailCS = "DetailCS"; 
                sComponentDetailES = "DetailES";

                if(sEstado=="Rechazado"){
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdDetailES, that.route+".view.fragments."+sComponentDetailES, that);
                        this._byId("vbViewDetail").addItem(that.fragmentTable);

                }else{
                    if(sTipo=="Ventas" || sTipo=="T/Gratuita" || sTipo=="Expo fast" ){
              
                        that.fragmentTable = sap.ui.xmlfragment(this.frgIdDetailVGE, that.route+".view.fragments."+sComponentDetailVGE, that);
                        this._byId("vbViewDetail").addItem(that.fragmentTable);
                    
                    }else{
  
                        that.fragmentTable = sap.ui.xmlfragment(this.frgIdDetailCS, that.route+".view.fragments."+sComponentDetailCS, that);
                        this._byId("vbViewDetail").addItem(that.fragmentTable);
                    
                    }

                }
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
				sap.ui.core.BusyIndicator.hide(0);
			});
        },
        _onPressNavButtonDetail: function () {
            let jData=undefined;
            that.getModel("oModelProyect").setProperty("/oCabecera", jData); 
            this.oRouter.navTo("View");
            that.fragmentTable.destroy();
            sTipo="";

        },
        _getData: function (sNumPedido) {
			try{
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
				return new Promise(function (resolve, reject) {
                    let sFilter = "",
                    jFilter = that.getModel("oModelProyect").getProperty("/Main/filter");
                    /*
                    if(!that.isEmpty(jFilter.oResponsible.length )){ sFilter += "and Kunn5 eq '"+jFilter.oResponsible.join()+"' ";
                    }else{ sFilter += "and Kunn5 eq ''" }
 */
                    var sPath = jQuery.sap.getModulePath("zuncui5entregamaquina") + 
                                "/sap/opu/odata/sap/ZOSSD_GW_TOMA_PEDIDO_SRV/SelectionSet?$filter=('')&$expand=NAVCUSTO,NAVMATER";
                   Services.getoDataERPSync(that, sPath, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data;
                                resolve(oResp);
                              
                            },
                            error: function (message) {
                                oResp.oResults = [];
                                //temporal
                                oResp.sEstado = "S";
                                let oCabeceraFiltro= models.JsonReporte().d.results.filter(item => item.txt1 == sNumPedido);
                                oResp.oResults = oCabeceraFiltro;
                                //temporal
                                resolve(oResp);
                                
                            }
                        });
                    });
				});
			}catch(oError){
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
        _getDataClient: function () {
			that=this;
			try{
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
				return new Promise(function (resolve, reject) {
                    let sUrl = "",
						sNumPedido = "";
 					if(that.local){
                         const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES'+ sNumPedido;
                         sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                     }else{
                         const sPath = jQuery.sap.getModulePath(that.route) +'/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES'+ sNumPedido;
 						sUrl = sPath;
 					}
					if(that.localModel){ resolve( models.JsonReporte() ); }
					else{
						Services.getoDataERPSync(that, sUrl, function (result) {
							util.response.validateAjaxGetERPNotMessage(result, {
								success: function (oData, message) {
									oResp.sEstado = "S";
									oResp.oResults = oData.data;
									resolve(oResp);
								},
								error: function (message) {
									oResp.oResults = [];
									resolve(oResp);
								}
							});
						});
					}
				});
			}catch(oError){
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		}
    });
});