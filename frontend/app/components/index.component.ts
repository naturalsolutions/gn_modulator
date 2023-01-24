import { Component, OnInit } from '@angular/core';
import { ModulesConfigService } from '../services/config.service';
import { ModulesRouteService } from '../services/route.service';

@Component({
  selector: 'modules-index',
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.scss'],
})
export class ModulesIndexComponent implements OnInit {
  schemaGroups = {};
  groups = [];
  modules;
  layout: {};
  constructor(private _mConfig: ModulesConfigService, private _mRoute: ModulesRouteService) {}
  ngOnInit() {
    this._mConfig.init().subscribe(() => {
      const modules = this._mConfig.modulesConfig();
      this.modules = Object.values(modules).filter((m) => (m as any).code != 'MODULES');
      this.layout = {
        title: 'Liste des modules',
        class: 'modules',
        height_auto: true,
        items: [
          {
            overflow: true,
            items: {
              direction: 'row',
              class: 'modules-liste',
              items: this.modules.map((moduleConfig) => ({
                flex: 'inherit',
                title: moduleConfig.module.module_label,
                description: moduleConfig.module.module_desc,
                href: '/' + moduleConfig.module.module_path,
                img:
                  this._mConfig.assetsDirectory() +
                  '/' +
                  moduleConfig.code.toLowerCase() +
                  '/module.jpg',
                type: 'card',
                class: 'module-card',
              })),
            },
          },
        ],
      };
    });
  }
}
