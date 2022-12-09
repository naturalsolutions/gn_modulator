import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  EventEmitter,
  Output,
  Injector,
} from '@angular/core';
import { ModulesLayoutService } from '../../../services/layout.service';
import { ModulesContextService } from '../../../services/context.service';
import { ModulesFormService } from '../../../services/form.service';

import utils from '../../../utils';

/** Composant de base pour les layouts */
@Component({
  selector: 'modules-layout',
  templateUrl: 'layout.component.html',
  styleUrls: ['../../base/base.scss', 'layout.component.scss'],
})
export class ModulesLayoutComponent implements OnInit {
  /** données */
  @Input() debug: any;

  /** agencement */
  @Input() layout: any;

  /** données */
  @Input() data: any;
  localData: any;

  /** actions */
  @Output() onAction = new EventEmitter<any>();

  // disposition verticale (par défaut) ou horizontale (si direction='row') des items
  @Input() direction: string;

  // pour faire passer des infos aux composants enfants ?
  @Input() parentContext: any = {};
  context: any = {};

  // si processing ( par ex: affichage de spinner)
  @Input() isProcessing;

  // layout calculé (en fonction de data et autres)
  computedLayout: any;

  // données et layout calculé sauvegardé
  // (pour ne pas déclencher postComputeLayout s'il n'y a pas besoin)
  computedLayoutSave: any;
  dataSave: any;
  bPostComputeLayout; // pour ne pas avoir tojours à comparer dataSave/data computedLayoutSave/computedLayout

  // layout récupéré depuis layoutCode
  // TODO à gérer en backend ?
  layoutFromCode;

  /** margin for debug display
   * help with debugging nested layout
   */

  /** Type de layout
   */
  layoutType: string;

  /** pour l'affichage du debug */
  prettyDebug;

  // données associées à layout.key
  elementData;

  // nom du composant (pour le debug)
  _name: string;

  // id du composant (random)
  // - pour le style
  // - pour les carte ?
  _id;

  // composant initialisé (pour l'affichage)
  isInitialized = false;

  // services
  _mLayout: ModulesLayoutService;
  _mContext: ModulesContextService;
  _mForm: ModulesFormService;

  // pour les éléments avec overflow = true
  docHeightSave;

  // listenPage resize
  bListenPageResize;

  computedItems;
  itemsContext;

  actionProcessing; // pour les spinners

  utils; // pour acceder à utils dans les templates

  constructor(protected _injector: Injector) {
    this._name = 'layout';
    this._id = Math.round(Math.random() * 1e10);
    this._mLayout = _injector.get(ModulesLayoutService);
    this._mContext = _injector.get(ModulesContextService);
    this._mForm = _injector.get(ModulesFormService);
    this.utils = utils;
  }

  ngOnInit() {
    // initialisation du layout
    this.processLayout();

    // subscription pour recalculer le layout
    this._mLayout.$reComputeLayout.subscribe(() => {
      this.computeLayout();
    });

    this._mLayout.$refreshData.subscribe((objectCode) => {
      this.refreshData(objectCode);
    });

    this._mLayout.$reComputedHeight.subscribe(() => {
      this.onHeightChange();
    });

    this._mLayout.$reDrawElem.subscribe(() => {
      this.onRedrawElem();
    });

    this._mLayout.$stopActionProcessing.subscribe(() => {
      this.actionProcessing = false;
    });

    // pour les élément avec heigh_auto = true
    // this.listenPageResize();

    // lorque une postInitialisation est nécessaire
    this.postInit();
  }

  onRedrawElem() {}

  // à redefinir pour faire une action apres init
  postInit() {}

  // pour les logs avec info sur _name, type, id
  log(...args) {
    console.log(this._name, this.layout && this.layout.type, this._id, ...args);
  }

  // idem que log mais seulement quand debug = true

  getFormGroup() {
    return this._mForm.getFormGroup(this.parentContext);
  }

  getFormControl() {
    return this.getFormGroup().get(this.computedLayout.key);
  }

  // à redéfinir pour effectuer des actions apres computedLayout
  postComputeLayout(dataChanged, layoutChanged) {}

  // appelé à l'initiation ( ou en cas de changement de data/layout/globalData)
  processLayout() {
    // calcul de computedLayout
    this.computeLayout();
    // à redéfinir
    this.postProcessLayout();

    // resize ?
    this.listenPageResize();

    // le composant est initialisé
    this.isInitialized = true;
  }

  getLocalData() {
    return this._mLayout.getLocalData({
      data: this.data,
      context: this.context,
      layout: this.layout,
    });
  }

  processContext() {
    // passage de parentContext (venant des layout parents) à context (à destination des enfants)
    // copie

    // à clarifier

    const layout = this.computedLayout || this.layout;

    if (!layout) return;

    for (const key of ['debug', 'form_group', 'appearance', 'index']) {
      if (this.parentContext[key] != null) {
        this.context[key] = this.parentContext[key];
      }
    }

    if (this.debug) {
      this.context.debug = true;
    }

    this.context.depth = (this.parentContext.depth || 0) + 1;
    // dataKeys

    this.context.data_keys = utils.copy(this.parentContext.data_keys) || [];
    this.postProcessContext();

    this.localData = this.getLocalData();

    // ? layout ou computedLayout
    const computedContext = this._mContext.getContext({
      data: this.localData,
      layout,
      context: this.parentContext,
    });

    this.context.module_code = computedContext.module_code;
    this.context.page_code = computedContext.page_code;
  }

  /**
   * A redéfinir dans les composants
   * pour les besoins spécifiques
   * - data_keys etc...
   **/
  postProcessContext() {}

  getElementData() {
    if (!this.layout) {
      return;
    }
    let elementData = this.localData;
    if (this.layout.key) {
      elementData = utils.getAttr(this.localData, this.layout.key);
    }
    return elementData;
  }

  // calcul de computedLayout
  // pour prendre en compte les paramètre qui sont des functions
  computeLayout() {
    // calcul du type de layout
    this.layoutType = this.layoutType || utils.getLayoutType(this.layout);

    this.processContext();
    // calcul du layout
    this.computedLayout = this._mLayout.computeLayout({
      layout: this.layout,
      data: this.data,
      context: this.context,
    });

    // récupération des données associées à this.computedLayout.key

    this.elementData = this.getElementData();

    // pour l'affichage du debug
    // if (this.debug) {
    this.processPrettyDebug();

    // }

    if (!this.computedLayout) {
      return;
    }

    this.processItems();

    // options context -> layout
    // if (this.computedLayout.module_code) {
    //   this.options.module_code = this.computedLayout.module_code
    // }

    // options layout

    // si layout_code est défini
    // on va chercher le layout correspondant dans la config
    if (this.computedLayout.code && !this.layoutFromCode) {
      const layoutFromCode = this._mLayout.getLayoutFromCode(this.computedLayout.code);
      // message d'erreur pour indiquer que l'on a pas trouvé le layout
      if (!layoutFromCode) {
        this.layoutFromCode = {
          type: 'message',
          class: 'error',
          html: `Pas de layout trouvé pour le <i>layout_code</i> <b>${this.computedLayout.code}</b>`,
        };
        return;
      }

      this.layoutFromCode = layoutFromCode.layout;
    }

    if (this.computedLayout.overflow) {
      this.processHeightOverflow();
    }

    /** pour éviter de déclencher postComputeLayout s'il n'y a pas de changmeent effectif */
    if (!this.bPostComputeLayout) {
      return;
    }

    // comparaison entre le layout calculé et les données précédentes
    const dataCopy = utils.copy(this.data);
    const computedLayoutCopy = utils.copy(this.computedLayout);
    const dataChanged = !utils.fastDeepEqual(this.dataSave, dataCopy);
    const layoutChanged = !utils.fastDeepEqual(this.computedLayoutSave, computedLayoutCopy);

    if (this.computedLayoutSave && this.dataSave && !layoutChanged && !dataChanged) {
      return;
    }

    this.postComputeLayout(dataChanged, layoutChanged);

    // sauvegarde des données pour la prochaine comparaison
    this.dataSave = dataCopy;
    this.computedLayoutSave = computedLayoutCopy;
  }

  processItems() {}

  itemContext(index) {
    const data_keys = utils.copy(this.context.data_keys);
    data_keys.push(this.layout.key);
    data_keys.push(index);
    const itemContext = {
      form_group: this.context.form_group,
      data_keys,
      index,
    };
    for (const key of Object.keys(this.context).filter(
      (key) => !['form_group', 'data_keys'].includes(key)
    )) {
      itemContext[key] = this.context[key];
    }

    return itemContext;
  }

  // pour gérer les composant avec overflow = true
  processHeightOverflow() {
    if (!(this.computedLayout?.overflow || this.layout?.overflow)) {
      return;
    }

    const elem = document.getElementById(this._id);
    if (!elem) {
      return;
    }

    const docHeight = document.body.clientHeight;

    // si la taille du body n'a pas changé on retourne
    if (this.docHeightSave == docHeight) {
      return;
    }

    // si on a reduit la fenetre
    // -> on remet à 0

    if (this.docHeightSave > docHeight || !this.docHeightSave) {
      this.computedLayout.style = {
        ...(this.computedLayout.style || {}),
        height: '200px',
        'overflow-y': 'scroll',
      };

      this.layout.style = {
        ...(this.layout.style || {}),
        height: `200px`,
        'overflow-y': 'scroll',
      };
    }

    this.docHeightSave = docHeight;

    setTimeout(() => {
      const parent = elem.closest('div.layout-item');
      const height = parent?.clientHeight;
      this.layout.style = {
        ...(this.layout.style || {}),
        height: `${height}px`,
        'overflow-y': 'scroll',
      };

      this.computedLayout.style = {
        ...(this.computedLayout.style || {}),
        height: `${height}px`,
        'overflow-y': 'scroll',
      };
    }, 200);
  }

  /**
   * Pour gérer les élément dont on souhaite que la taille correspondent à la taille de la fenètre
   */
  listenPageResize() {
    // pour les composant avec computedLayout.height_auto
    if (!this.computedLayout?.height_auto) {
      return;
    }

    // pour ne faire appel qu'une seule fois à la fonction
    // on utilise bListenPageResize
    if (this.bListenPageResize) {
      return;
    }

    this.bListenPageResize = true;

    // on attend l'element html pour lui donner la taille de la page
    utils.waitForElement(this._id).then(() => {
      this.processHeightAuto();
    });

    // on ajoute un évènement en cas de changement de la hauteur de la fenêtre
    window.addEventListener(
      'resize',
      (event) => {
        this.processHeightAuto();
      },
      true
    );
  }

  // action quand la taille change
  onHeightChange() {
    // this.processHeightAuto();
    this.processHeightOverflow();
  }

  /** pour mettre les layout avec height_auto = true à la hauteur totale de la page */
  processHeightAuto() {
    if (!this.computedLayout.height_auto) {
      return;
    }

    const elem = document.getElementById(this._id);
    if (!elem) {
      return;
    }

    const elementHeight = elem && `${elem.clientHeight}px`;
    const bodyHeight = `${document.body.clientHeight - elem.offsetTop}px`;

    // si la taille de l'élément correspond à la taille de la page
    // -> on ne fait rien

    if (elementHeight == bodyHeight && this.computedLayout.style.height == bodyHeight) {
      return;
    }

    this.computedLayout.style = this.computedLayout.style || {};
    this.computedLayout.style.height = bodyHeight;

    this.layout.style = this.layout.style || {};
    this.layout.style.height = bodyHeight;

    this._mLayout.reComputeHeight('auto');
  }

  // a redefinir pour faire des actions après processLayout
  postProcessLayout() {}

  emitAction(event) {
    this.onAction.emit(event);
  }

  /** pour les bouttons
   * quand layout.action est defini
   */
  onButtonClick(event) {
    if (this.computedLayout.click) {
      this.computedLayout.click(event);
      return;
    }

    const action = this.computedLayout.action;
    if (!action) {
      return;
    }

    // open modal TODO subject ?
    if (action.modal_name) {
      this._mLayout.openModal(action.modal_name, this.data);
      return;
    }

    if (action == 'close') {
      this._mLayout.closeModals();
      return;
    }

    this.actionProcessing = true;
    this.onAction.emit({
      action: this.layout.action,
      data: this.data,
      layout: this.computedLayout,
    });
  }

  processAction(event) {
    if (event.type == 'data-change') {
      this.computeLayout();
    }
    this.emitAction(event);
  }

  processPrettyDebug() {
    const prettyLayout = this.prettyTitleObjForDebug('layout', this.computedLayout);
    const prettyData = this.prettyTitleObjForDebug('data', this.data);
    const prettyLocalData = this.prettyTitleObjForDebug('local data', this.localData);
    const prettyElementData = this.prettyTitleObjForDebug('element data', this.elementData);

    const context = {
      module_code: this.context.module_code,
      page_code: this.context.page_code,
      object_code: this.context.object_code,
      data_keys: this.context.data_keys,
      index: this.context.index,
    };

    const prettyContext = this.prettyTitleObjForDebug('context', context);

    this.prettyDebug = {
      layout: prettyLayout,
      data: prettyData,
      local_data: prettyLocalData,
      element_data: prettyElementData,
      context: prettyContext,
    };
  }

  prettyTitleObjForDebug(title, obj) {
    // let srtPretty = `${title}\n\n${JSON.stringify(obj, null, '____  ')}`
    let srtPretty = `${title}\n\n${utils.YML.dump(obj, { skipInvalid: true }).replaceAll(
      ' ',
      '_'
    )}`;
    return srtPretty;
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const [key, change] of Object.entries(changes)) {
      if (utils.fastDeepEqual(change['currentValue'], change['previousValue'])) {
        continue;
      }

      if (['layout', 'data', 'parentContext'].includes(key)) {
        this.processLayout();
      }
    }
  }

  onTabChanged($event) {
    this._mLayout.reDrawElem('tab changed');
  }

  refreshData(objectCode) {}
}
