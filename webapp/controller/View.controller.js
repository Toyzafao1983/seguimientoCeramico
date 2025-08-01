sap.ui.define([
    "com/aris/seguimiento/ceramico/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "com/aris/seguimiento/ceramico/pe/model/models",
    "com/aris/seguimiento/ceramico/pe/model/formatter",
    "com/aris/seguimiento/ceramico/pe/services/Services",
	"com/aris/seguimiento/ceramico/pe/util/util",
    "com/aris/seguimiento/ceramico/pe/util/utilUI",

	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], (BaseController, Controller,ResourceModel, models, formatter, Services, util, utilUI, Filter, FilterOperator) => {
    "use strict";
    var that;

    return BaseController.extend("com.aris.seguimiento.ceramico.pe.controller.View", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("View").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
           
            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdFilterInit = "frgIdFilterInit";
        },
        handleRouteMatched: function(bInit){
            sap.ui.core.BusyIndicator.show(0);
            Promise.all([this._getUsers(), this._getVendedor(this),
                this._getCliente(this),this._getEstado(this),this._getClasePedido(this)
            ]).then((values) => {
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");
                let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");
                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);

                that.oModelProyect.setProperty("/",models.createModelProyect());

                let oUser=values[0].Resources[0];
                let sRol=oUser.groups[0].value;
                if(sIdioma == undefined){
                    that._setLanguageModel("esp");
                }else{
                    that._setLanguageModel(sIdioma);
                }

                
                that.getModel("oModelUser").setProperty("/Information", values[0].Resources[0]);
                that.getModel("oModelUser").setProperty("/sNameComp", values[0].Resources[0].name.givenName + " " + values[0].Resources[0].name.familyName);
                that.getModel("oModelUser").setProperty("/bAdmin", sRol=="LAYT_INT_ADM"?true:false);
                that.oModelData.setProperty("/oVendedor", values[1].d.results);
                that.oModelData.setProperty("/oCliente", values[2].d.results);
                that.oModelData.setProperty("/oEstado", values[3].d.results);
                that.oModelData.setProperty("/oClasePedido", values[4].d.results);

                if(sRol=="LAYT_INT_ADM"){

                }else{
                    
                }

                //Tabla del Main
                let sComponentTable = "";
                sComponentTable = "TableMainDesktop"
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route+".view.fragments."+sComponentTable, that);
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                }
                    that._onPressExecute();
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
				sap.ui.core.BusyIndicator.hide(0);
			});
        },
        _onClearFilter: function(){
            const tbReporte = this._byId("vbTableMain").getItems().length > 0 ? this._byId("vbTableMain").getItems()[0] : null;
            if( !this.isEmpty(tbReporte) ){ tbReporte.removeSelections(true); }

            that._onClearComponentGlobal( that.getI18nText("sStateInit"), this._byId("idFilterBar"), false );
            that._onClearDataFilter();
            that._onPressExecute();
        },
        _onClearDataFilter:function(){
            that.getModel("oModelProyect").setProperty("/Main", models.createModelProyect().Main);
        },
        _onPressNavigateDetail: function(oEvent){      
            let oSource = oEvent.getSource();
            let oParentRow = oSource.getParent();
            let jRow = oParentRow.getBindingContext("oModelProyect");
            let jData = jRow.getObject();
            that.oModelProyect.setProperty("/oCabecera", jData);

            that.oRouter.navTo("Detail", {
                app: jData.txt1
            });
        },
        _onPressExecute: function(){
            //Captura informacion puesta en el campo estado
            //flujo normal
            let jFilter = that.oModelProyect.getProperty("/Main/filter");
              let  bFilter = false;

            if(!that.isEmpty(jFilter.dStartDate)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.dEndDate)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.sDateOrder)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.iOrder)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.cbSeller)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.cbState)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.cbCustomer)){ bFilter = true ; }
            if(!that.isEmpty(jFilter.cbOrderClass)){ bFilter = true ; }
            // if(!bFilter){ that.getMessageBox("error", that.getI18nText("sErrorNotSelect")); }
            // else{
                sap.ui.core.BusyIndicator.show();
                Promise.all([this._getData(jFilter)]).then((values) => {
                   // that._byId( this.frgIdFilterInit + "--IdFilterInit" ).close();
                    let oData = values[0];
                    if(oData.sEstado === "E"){
                        that.getMessageBox("error", that.getI18nText("errorData"));
                    }else{
                        that.oModelProyect.setProperty("/oReporte",oData.oResults);       
                        //alert("miren donde estoy");
                    }
                    sap.ui.core.BusyIndicator.hide();
                }).catch(function (oError) {
                    that.getMessageBox("error", that.getI18nText("errorData"));
                    sap.ui.core.BusyIndicator.hide(0);
                });
            // }
        },
        _getData: function () {
			try{
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
				return new Promise(function (resolve, reject) {
                    that.aFilter = [];
                    let sFilter = "",
                        jFilter = that.getModel("oModelProyect").getProperty("/Main/filter");
                    
                    /*if(that.getModel("oModelUser").getProperty("/bAdmin")){ 
                        that.aFilter.push(new Filter("txt6", sap.ui.model.FilterOperator.Contains, that.getModel("oModelUser").getProperty("/Information/displayName") )); 
                    }*/

                    if(!that.isEmpty(jFilter.dStartDate)){ 
                        that.aFilter.push(new Filter("txt9", sap.ui.model.FilterOperator.Contains, jFilter.dStartDate)); 
                    }
                    if(!that.isEmpty(jFilter.dEndDate)){ 
                        that.aFilter.push(new Filter("txt2", sap.ui.model.FilterOperator.Contains, jFilter.dEndDate)); 
                    }

                    if(!that.isEmpty(jFilter.iOrder)){ 
                        that.aFilter.push(new Filter("txt1", sap.ui.model.FilterOperator.Contains, jFilter.iOrder)); 
                    }

                    if(!that.isEmpty(jFilter.cbSeller)){ 
                        that.aFilter.push(new Filter("txt13", sap.ui.model.FilterOperator.Contains, jFilter.cbSeller)); 
                    }
                    
                    if(!that.isEmpty(jFilter.cbState)){ 
                        that.aFilter.push(new Filter("txt11", sap.ui.model.FilterOperator.Contains, jFilter.cbState)); 
                    }
                    
                    if(!that.isEmpty(jFilter.cbCustomer)){ 
                        that.aFilter.push(new Filter("txt3", sap.ui.model.FilterOperator.Contains, jFilter.cbCustomer)); 
                    }

                    if(!that.isEmpty(jFilter.cbOrderClass)){ 
                        that.aFilter.push(new Filter("txt4", sap.ui.model.FilterOperator.Contains, jFilter.cbOrderClass)); 
                    }
                    
                    var sPath = jQuery.sap.getModulePath("zuncui5entregamaquina") + 
                                "/sap/opu/odata/sap/ZOSSD_GW_TOMA_PEDIDO_SRV/SelectionSet?$filter=('')&$expand=NAVCUSTO,NAVMATER";
                   Services.getoDataERPSync(that, sPath, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data;
                                resolve(oResp);
                                alert("entre por conducto regular");
                              
                            },
                            error: function (message) {
                                oResp.oResults = [];
                                //temporal
                                oResp.sEstado = "S";
                                oResp.oResults = models.JsonReporte().d.results;

                                //Filtering
                                var oTable = that._byId("vbTableMain").getItems().length > 0 ? that._byId("vbTableMain").getItems()[0] : null;
                                oTable.getBinding("items").filter(that.aFilter);
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
        onLanguageEsp: function () {
            this._setLanguageModel("esp");
        },

        onLanguageEng: function () {
            this._setLanguageModel("ing");
        },
            // para cambiar el idioma
        
    });
});