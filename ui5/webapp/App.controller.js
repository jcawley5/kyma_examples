sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV"
  ],
  function(Controller, MessageToast, JSONModel, ResourceModel, Export, ExportTypeCSV) {
    "use strict";

    return Controller.extend("KymaEstimator.App", {
      onPress: function() {
        MessageToast.show("Hello UI5!");
        this.byId("app").to(this.byId("intro"));
      },

      onInit: function() {
        this.seti18nMdl();
        this.setRunTimeOptionsMdl();
        this.setRunTimeDetailsMdl();
      },

      seti18nMdl: function() {
        var i18nModel = new ResourceModel({
          bundleName: "KymaEstimator.i18n.i18n"
        });
        this.getView().setModel(i18nModel, "i18n");
      },

      setRunTimeOptionsMdl: function() {
        const model = new JSONModel();
        model.loadData("./data/runTimeOptions.json");
        this.getView().setModel(model, "rtoptions");
      },

      setRunTimeDetailsMdl: function() {
        const model = new JSONModel();
        model.loadData("./data/runTimeDetails.json");
        this.getView().setModel(model, "rtdetails");
      },

      calCapcityUnits: function(oEvent) {
        var total = 0;
        const context = oEvent.getSource().getBindingContext("rtoptions");
        const model = context.getModel();
        const sPath = context.getPath();
        const ConsUnitsValue = model.getProperty(sPath)["ConsUnitsValue"];
        const ConsUnitsToCapcityDivider = model.getProperty(sPath)["ConsUnitsToCapcityDivider"];

        model.setProperty(sPath + "/Capacity", ConsUnitsValue / ConsUnitsToCapcityDivider);

        model.getProperty("/items").forEach((item, idx) => {
          total += item.Capacity;
        });

        model.setProperty("/ConsUnitsTotal", total);
      },

      setTotalCapcityUnits: function() {
        const table = this.getView().byId("runTimeTable");
        const items = table.getBinding("items");
        console.log(items);
      },

      onRefresh: function() {
        this.getView()
          .getModel("rtoptions")
          .loadData("./data/runTimeOptions.json");
      },

      onDataExport: function(oEvent) {
        console.log("onDataExport");
        var oExport = new Export({
          // Type that will be used to generate the content. Own ExportType's can be created to support other formats
          exportType: new ExportTypeCSV({
            separatorChar: ","
          }),

          // Pass in the model created above
          models: this.getView().getModel("rtoptions"),

          // binding information for the rows aggregation
          rows: {
            path: "/items"
          },

          // column definitions with column name and binding info for the content

          columns: [
            {
              name: "Name",
              template: {
                content: "{Name}"
              }
            },
            {
              name: "Description",
              template: {
                content: "{Description}"
              }
            },
            {
              name: "Consumption Estimate",
              template: {
                content: "{ConsUnitsValue}"
              }
            },
            {
              name: "Capacity Units",
              template: {
                content: "{Capacity}"
              }
            }
          ]
        });

        // download exported file
        oExport
          .saveFile()
          .catch(function(oError) {
            MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
          })
          .then(function() {
            oExport.destroy();
          });
      }
    });
  }
);
