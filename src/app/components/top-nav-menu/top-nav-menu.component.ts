import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { FileGaleryService } from '../file-galery/file-galery.service';
import { RxCoreService } from 'src/app/services/rxcore.service';
import { RXCore } from 'src/rxcore';
import { AnnotationToolsService } from '../annotation-tools/annotation-tools.service';
import { PrintService } from '../print/print.service';
import { IGuiConfig } from 'src/rxcore/models/IGuiConfig';
import { CompareService } from '../compare/compare.service';
import { TopNavMenuService } from './top-nav-menu.service';
import { GuiMode } from 'src/rxcore/enums/GuiMode';
import { SideNavMenuService } from '../side-nav-menu/side-nav-menu.service';


@Component({
  selector: 'top-nav-menu',
  templateUrl: './top-nav-menu.component.html',
  styleUrls: ['./top-nav-menu.component.scss'],
  host: {
    '(document:click)': 'handleClickOutside($event)',
    '(document:keydown)': 'handleKeyboardEvents($event)',
    '(window:keydown.control.p)': 'handlePrint($event)'
  }
})
export class TopNavMenuComponent implements OnInit {
  @ViewChild('sidebar') sidebar: ElementRef;
  @ViewChild('burger') burger: ElementRef;
  @ViewChild('more') more: ElementRef;
  @Input() state: any;;

  guiConfig$ = this.rxCoreService.guiConfig$;
  guiState$ = this.rxCoreService.guiState$;
  guiMode$ = this.rxCoreService.guiMode$;
  GuiMode = GuiMode;
  guiConfig: IGuiConfig = {};
  guiState: any;
  guiMode: any;
  moreOpened: boolean = false;
  burgerOpened: boolean = false;
  sidebarOpened: boolean = false;
  modalFileGaleryOpened$ = this.fileGaleryService.modalOpened$;
  isPrint: boolean = false;
  fileInfo: any = {};
  selectedValue: any;
  options: Array<{ value: GuiMode, label: string, hidden?: boolean }> = [];
  canChangeSign: boolean = false;
  containLayers: boolean = false;
  containBlocks: boolean = false;

  constructor(
    private readonly fileGaleryService: FileGaleryService,
    private readonly rxCoreService: RxCoreService,
    private readonly annotationToolsService: AnnotationToolsService,
    private readonly printService: PrintService,
    private readonly compareService: CompareService,
    private readonly service: TopNavMenuService,
    private readonly sideNavMenuService: SideNavMenuService) {
  }

  private _setOptions(option: any = undefined): void {
    this.options = [
      { value: GuiMode.View, label: "View" },
      { value: GuiMode.Annotate, label: "Annotate", hidden: !this.guiConfig.canAnnotate },
      { value: GuiMode.Signature, label: "Signature", hidden: !(this.guiConfig.canSignature && this.canChangeSign) },
      { value: GuiMode.Compare, label: "Revision", hidden: !this.guiConfig.canCompare || !this.compareService.isComparisonActive }
    ];

    this.selectedValue = option ? option : this.options[0];
  }

  ngOnInit(): void {
    this._setOptions();

    this.rxCoreService.guiState$.subscribe((state) => {
      this.guiState = state;
      this.canChangeSign = state.numpages && state.isPDF && RXCore.getCanChangeSign();
      this._setOptions();
      if (this.compareService.isComparisonActive) {
        const value = this.options.find(option => option.value == "compare");
        if (value) {
          this.onModeChange(value, false);
        }
      }
    });

    this.rxCoreService.guiMode$.subscribe(mode => {
      this.guiMode = mode;
      const value = this.options.find(option => option.value == mode);
      if (value) {
        this.onModeChange(value, false);
      }
    });

    this.rxCoreService.guiConfig$.subscribe(config => {
      this.guiConfig = config;
      this._setOptions(this.selectedValue);
    });

    this.service.openModalPrint$.subscribe(() => {
      this.isPrint = true;
    });

    this.rxCoreService.guiVectorLayers$.subscribe((layers) => {
      this.containLayers = layers.length > 0;
    });

    this.rxCoreService.guiVectorBlocks$.subscribe((blocks) => {
      this.containBlocks = blocks.length > 0;
    });

    this.service.activeFile$.subscribe(file => {
    })
  }

  /* Listeners */
  handleClickOutside(event: any) {
    if (this.moreOpened && !this.more.nativeElement.contains(event.target)) {
      this.moreOpened = false;
    }

    if (this.burgerOpened && !this.burger.nativeElement.contains(event.target)) {
      this.burgerOpened = false;
    }

    if (this.sidebarOpened && !this.sidebar.nativeElement.contains(event.target)) {
      this.sidebarOpened = false;
    }
  }

  handleKeyboardEvents($event: KeyboardEvent) {
    if (this.moreOpened || this.burgerOpened || this.sidebarOpened) {
      $event.preventDefault();
    } else {
      return;
    }

    if ($event.code === 'Escape') {
      this.moreOpened = this.burgerOpened = this.sidebarOpened = false;
    }
  }

  handlePrint(event: KeyboardEvent) {
    event.preventDefault();
    this.openModalPrint();
  }
  /* End listeners */

  handleOpenFile() {
    this.fileGaleryService.openModal();
    this.burgerOpened = false;
  }

  handleCloseModalFileGalery() {
    this.fileGaleryService.closeModal();
  }

  handleFileSelect(item: any) {
    RXCore.openFile(`${RXCore.Config.baseFileURL}${item.file}`);
  }

  handleOnFileUpload() {
    RXCore.fileSelected();
  }

  onModeChange(option: any, broadcast: boolean = true) {
    this.selectedValue = option;

    if (option.value === 'annotate' || option.value === 'compare') {
      if (option.value === 'compare') {
        this.rxCoreService.setGuiConfig({
          canSignature: false,
          canAnnotate: true,
          canSaveFile: false,
          canExport: false,
          canPrint: false,
          canGetFileInfo: false,
          disableBurgerMenuCompare: true,
          disableBirdEyeButton: true,
          disableRotateButton: true,
          disableSelectTextButton: true,
          disableSearchTextButton: true,
          disableSearchAttributesButton: true,
          disableMarkupTextButton: true,
          disableMarkupCalloutButton: true,
          disableMarkupStampButton: true,
          disableMarkupPaintButton: true,
          disableMarkupArrowButton: true,
          disableMarkupMeasureButton: true,
          disableMarkupCountButton: true,
          disableMarkupEraseButton: true,
          disableMarkupNoteButton: true,
          disableMarkupLockButton: true,
          disableMarkupShapeRectangleButton: true,
          disableMarkupShapeEllipseButton: true,
          disableMarkupShapeRoundedRectangleButton: true,
          disableMarkupShapePolygonButton: true,
          enableGrayscaleButton: this.compareService.isComparisonActive
        });
      } else {
        if (this.compareService.isComparisonActive) {
          this.rxCoreService.setGuiConfig({
            canCompare: true,
            canSignature: false,
            canAnnotate: true,
            canSaveFile: false,
            canExport: false,
            canPrint: false,
            canGetFileInfo: false,
            disableBurgerMenuCompare: true,
            disableBirdEyeButton: false,
            disableRotateButton: false,
            disableSelectTextButton: false,
            disableSearchTextButton: false,
            disableSearchAttributesButton: false,
            disableMarkupTextButton: false,
            disableMarkupCalloutButton: false,
            disableMarkupStampButton: false,
            disableMarkupPaintButton: false,
            disableMarkupArrowButton: false,
            disableMarkupMeasureButton: false,
            disableMarkupCountButton: false,
            disableMarkupEraseButton: false,
            disableMarkupNoteButton: false,
            disableMarkupLockButton: false,
            disableMarkupShapeRectangleButton: false,
            disableMarkupShapeEllipseButton: false,
            disableMarkupShapeRoundedRectangleButton: false,
            disableMarkupShapePolygonButton: false,
            enableGrayscaleButton: this.compareService.isComparisonActive
          });
        } else {
          this.rxCoreService.resetGuiConfig();
        }
      }

      this.annotationToolsService.show();
    } else {
      this.annotationToolsService.hide();
    }

    if (broadcast) {
      this.rxCoreService.setGuiMode(option.value);
    }
  }

  openModalPrint() {
    this.state?.activefile ? (this.isPrint = true, this.burgerOpened = false) : this.isPrint = false;
  }

  fileInfoDialog(): void {
    this.burgerOpened = false;
    this.printService.data(false);
    RXCore.fileInfoDialog();
  }

  handleSaveFile(): void {
    RXCore.markUpSave();
    this.burgerOpened = false;
  }

  openModalCompare(): void {
    if (!this.state?.activefile || this.state?.is3D || this.guiConfig.disableBurgerMenuCompare) return;

    this.compareService.showCreateCompareModal();
    this.burgerOpened = false;
  }

  onExportClick(): void {
    if (this.state?.activefile) {
      this.burgerOpened = false;
      RXCore.exportPDF();
    }
  }

  handleOpenSidebarMenu() {
    const visibleItems = [
      { index: 0, visible: !(this.guiConfig?.disableViewPages) },
      { index: 5, visible: (this.guiConfig?.canSignature) && this.canChangeSign && this.guiMode == GuiMode.Signature },
      { index: 3, visible: !(this.guiConfig?.disableViewVectorLayers) && (this.guiState?.is2D || this.guiState?.isPDF) && this.containLayers },
      { index: 6, visible: !(this.guiConfig?.disableViewVectorLayers) && this.guiState?.is2D && this.containBlocks },
      { index: 4, visible: !(this.guiConfig?.disableView3DParts) && this.guiState?.is3D }
    ];

    const visibleCount = visibleItems.filter(option => option.visible).length;

    if (visibleCount > 1) {
      this.sidebarOpened = !this.sidebarOpened;
    } else if (visibleCount === 1) {
      const indexToOpen = visibleItems.find(item => item.visible);
      this.handleSidebarOpen(indexToOpen?.index || 0);
    }
  }

  handleSidebarOpen(index: number): void {
    this.sideNavMenuService.toggleSidebar(index);
    this.sidebarOpened = false;
  }

}