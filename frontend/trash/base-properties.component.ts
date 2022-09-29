import { Component, OnInit } from "@angular/core";

import { ModulesService } from "../../services/all.service";

import { of } from "@librairies/rxjs";
import { BaseComponent } from "./base.component";

import utils from "../../utils";
@Component({
  selector: "modules-base-properties",
  templateUrl: "base-properties.component.html",
  styleUrls: ["base.scss", "base-properties.component.scss"],
})
export class BasePropertiesComponent extends BaseComponent implements OnInit {
  dataSource = null;
  displayedColumns = null;
  bEditAllowed = false;

  layout;
  processedLayout;

  constructor(_services: ModulesService) {
    super(_services);
    this._name = "BaseProperties";
  }

  ngOnInit() {
    this.initHeight();
  }

  getData() {
    if (!this.value) {
      return of(null);
    }
    const fields = this._services.mLayout.getLayoutFields(this.layout);

    if (!fields.includes(this.pkFieldName())) {
      fields.push(this.pkFieldName());
    }

    if (this.hasGeometry() && !fields.includes(this.geometryFieldName())) {
      fields.push(this.geometryFieldName());
    }

    // if(this.schemaConfig.definition.meta.check_cruved) {
      fields.push('ownership');
    // }

    return this._services.mData.getOne(this.schemaName, this.value, {
      fields,
    });
  }

  processConfig(): void {
    this.layout = this.schemaConfig.details.layout;
  }

  processData(data) {
    this.data = data;
    this.bEditAllowed =
      data["ownership"] <= this.moduleConfig.module.cruved["U"];
    this.setComponentTitle();
    this.processedLayout = {
      height_auto: true,
      items: [
        {
          title: this.componentTitle,
          flex: '0'
        },
        {
          items: this.schemaConfig.details.layout,
          overflow: true,
        },
        {
          type: "button",
          color: "primary",
          title: "Éditer",
          description: `Editer ${this.schemaConfig.display.def_label}`,
          action: "edit",
          flex: '0'
        },
      ],
    };
    this.setLayersData(true);
  }

  setComponentTitle(): void {
    if (!this.data) {
      return;
    }
    this.componentTitle = `Propriétés ${this.schemaConfig.display.du_label} ${
      this.data[this.schemaConfig.utils.label_field_name]
    }`;
  }

  setLayersData(flyToPoint = false) {
    const properties = {
      id: this.id(),
    };
    const geometry = this.data[this.geometryFieldName()];
    if (!geometry) {
      return;
    }
    this.layersData = {
      geomEdit: {
        geojson: {
          type: "Feature",
          geometry,
          properties,
        },
        layerOptions: {
          type: "marker",
        },
      },
    };
    if (flyToPoint) {
      this._services.mapService.waitForMap(this.mapId).then(() => {
        this._services.mapService.setCenter(this.mapId, geometry);
      });
    }
    // if (flyToPoint) {
    //   this._services.mapService.waitForMap(this.mapId).then(() => {
    //     const filters = {};
    //     filters[this.pkFieldName()] = this.id();
    //     const layer = this._services.mapService.findLayer(this.mapId, filters);
    //   });
    // }
  }

  onAction(event) {
    if (event.action == "edit") {
      this.emitEvent({
        action: "edit",
        params: {
          value: this.id(),
        },
      });
    }
  }
}
