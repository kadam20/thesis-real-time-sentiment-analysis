import {
  ApplicationRef,
  Component,
  ComponentRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { statesData } from './states-data';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocalstorageService } from '../../services/localstorage.service';
import { State } from '../../models/state.model';
import { TooltipOptions } from 'leaflet';
import { MapTooltipComponent } from './map-tooltip/map-tooltip.component';
import { DataService } from '../../services/data.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-election-map',
  standalone: true,
  imports: [SelectButtonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './election-map.component.html',
  styleUrls: [
    '../../../../node_modules/leaflet/dist/leaflet.css',
    './election-map.component.scss',
  ],
})
export class ElectionMapComponent implements OnInit, OnChanges {
  localStorageService = inject(LocalstorageService);
  dataService = inject(DataService);
  map: L.Map;
  geojson: any;
  statesData: State[] = statesData.features;
  stateOptions: { label: string; value: string }[] = [
    { label: 'Candidate', value: 'candidate' },
    { label: 'Sentiment', value: 'sentiment' },
  ];
  mapStyle = signal<string>('candidate');
  private _componentRef: ComponentRef<MapTooltipComponent>;
  private _applicationRef = inject(ApplicationRef);


  async ngOnInit() {
    await this.mapData();
    this.getMapStyle();
    this.mapInit();
    this.buildTooltip()    
  }

  buildTooltip(){
    this.map.on('tooltipopen', (event) => {
      const { tooltip } = event;
      const tooltipContainer = (tooltip as any)._container;
      const tooltipData = (tooltip.options as TooltipOptions & { data: any })
        ?.data.state.properties;
      this._componentRef = createComponent(MapTooltipComponent, {
        environmentInjector: this._applicationRef.injector,
        hostElement: tooltipContainer,
      });

      this._componentRef.setInput('tooltipData', tooltipData);

      this._applicationRef.attachView(this._componentRef.hostView);
    });

    this.map.on('tooltipclose', () => {
      this._componentRef?.destroy();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.buildTooltip()    
  }

  // Helper function to bind a tooltip to a polygon
  bindTooltipToPolygon(polygon: L.Polygon, state: any) {
    polygon.bindTooltip('', {
      className: 'state-tooltip',
      opacity: 1,
      data: { state: state },
    } as TooltipOptions);
  }

  /**
   * Retrieves the saved map style from local storage.
   */
  getMapStyle() {
    const savedStyle = this.localStorageService.getItem('map-stype');
    this.mapStyle.set(savedStyle ? savedStyle : 'candidate');
  }

  /**
   * Populates statesData with sentiment values and generates tooltips.
   */
  async mapData() {
    const mapData = await firstValueFrom(this.dataService.getElectionMap())
    this.statesData.forEach((state: State) => {
      state.properties.sentiment = Number((Math.random() * 2 - 1).toFixed(1));
      state.properties.trumpSentiment = Number((Math.random() * 2 - 1).toFixed(1));
      state.properties.bidenSentiment = Number((Math.random() * 2 - 1).toFixed(1));
      state.properties.trumpAmount = Number((Math.random() * 100000- 1).toFixed(0));
      state.properties.bidenAmount = Number((Math.random() * 100000 - 1).toFixed(0));
    });
  }

  /**
   * Initializes the Leaflet map and sets its initial view.
   */
  mapInit() {
    // Initializing map and setting default view
    this.map = L.map('map').setView([38.879966, -101.726909], 4);
    // Adding map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    // Adding layers
    this.configMap();
  }

  /**
   * Configures the map by applying the geoJSON data.
   */
  configMap() {
    // If style is changed previous layer is removed
    if (this.geojson) {
      this.map.removeLayer(this.geojson);
    }
    // Adding layer to map
    this.geojson = L.geoJson(this.statesData as any, {
      style: this.style.bind(this),
      onEachFeature: this.onEachFeature.bind(this),
    }).addTo(this.map);
  }

  /**
   * Retrieves the appropriate colors based on the selected map style.
   * @returns {[string, string]} Array containing two color values.
   */
  getColor(): [string, string] {
    const documentStyle = getComputedStyle(document.documentElement);
    const colorOne =
      this.mapStyle() === 'candidate'
        ? documentStyle.getPropertyValue('--p-primary-blue')
        : documentStyle.getPropertyValue('--p-primary-green');
    const colorTwo =
      this.mapStyle() === 'candidate'
        ? documentStyle.getPropertyValue('--p-primary-red')
        : documentStyle.getPropertyValue('--p-primary-orange');

    return [colorOne, colorTwo];
  }

  /**
   * Determines the style of each state on the map.
   * @param feature - The geoJSON feature representing a state.
   * @returns Style object for the given feature.
   */
  style(feature: any) {
    const colors = this.getColor();
    return {
      fillColor:
        feature.properties.bidenSentiment > feature.properties.trumpSentiment
          ? colors[0]
          : colors[1],
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.8,
    };
  }

  /**
   * Configures tooltips and event listeners for each map feature.
   * @param state - The geoJSON state feature.
   * @param layer - The Leaflet layer corresponding to the feature.
   */
  onEachFeature(state: any, layer: L.Layer) {
    // Adding tooltip to the states
    if (state.properties && state.properties.name) {
      layer.bindTooltip('', {
        permanent: false,
        direction: 'bottom',
        className: 'state-tooltip',
        data: { state: state },
      } as any);
    }

    // Adding hover effect to the states on mouseover
    layer.on({
      mouseover: (e: any) => {
        var layer = e.target;
        layer.setStyle({
          fillOpacity: 1,
        });
      },
      // Remove hover effect on mouseleave
      mouseout: (e: any) => {
        var layer = e.target;
        layer.setStyle({
          fillOpacity: 0.8,
        });
      },
    });
  }

  /**
   * Handles the map view toggle between different styles.
   * @param event - The event triggered by selecting a different map view.
   */
  swapView(event: Event) {
    // Set localstorage
    this.localStorageService.setItem('map-stype', String(event));

    // Refresh map
    this.mapData();
    this.configMap();
  }
}
