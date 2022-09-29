import { Injectable } from "@angular/core";

import { ModulesConfigService } from "./config.service";
import { ModulesLayoutService } from "./layout.service";
import * as L from '@librairies/leaflet';
import '@librairies/@geoman-io/leaflet-geoman-free';

L.PM.initialize({ optIn: true }); // Property 'PM' does not exist on type 'typeof import(".../node_modules/@types/leaflet/index")'.ts(2339)


import mapMethods from './map'

@Injectable()
export class ModulesMapService {

  constructor(
    private _mConfig: ModulesConfigService,
    private _mLayout: ModulesLayoutService
  ) {
    /** on récupère touts les méthodes definies dans les fichiers du répertoire ./map/ */
    for (const methods of Object.values(mapMethods)) {
      for (const [key, value] of Object.entries(methods)) {
        this[key]=value
      }
    }
  }


  /** map cache: {..., <mapId>: map,...} */
  _maps = {};
  _pendingMaps = {};

  /** layerDataCache */
  _layersData = {};

  /** Leaflet */
  L=L;

  /** Configuration */

  init() {
  }


  /** Methodes pour la carte*/


  /**
   * methodes depuis les fichiers de ./map/
   */


  /** ./map/base */

  initMap = mapMethods.base.initMap;
  waitForMap = mapMethods.base.waitForMap;

  getMap = mapMethods.base.getMap;
  getZoom = mapMethods.base.getZoom;
  getCenter = mapMethods.base.getCenter;
  getMapBounds = mapMethods.base.getMapBounds;

  setView = mapMethods.base.setView;
  setCenter = mapMethods.base.setCenter;
  setZoom = mapMethods.base.setZoom;


  /** ./map/baseMap */

  addBaseMap = mapMethods.base_map.addBaseMap;


  /** ./map/layers */

  processLayersData = mapMethods.layer.processLayersData;
  processData = mapMethods.layer.processData;
  layerZoomMoveEndListener = mapMethods.layer.layerZoomMoveEndListener;
  actionTooltipDisplayZoomThreshold = mapMethods.layer.actionTooltipDisplayZoomThreshold;
  findLayer = mapMethods.layer.findLayer;
  zoomOnLayer = mapMethods.layer.zoomOnLayer;
  /** ./map/draw */

  // initDraw = mapMethods.draw.initDraw;
  setDrawConfig = mapMethods.draw.setDrawConfig;

  /** ./map/control */
  addControl = mapMethods.control.addControl
}