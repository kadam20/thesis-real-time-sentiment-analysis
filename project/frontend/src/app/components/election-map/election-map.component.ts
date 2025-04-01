import {
  ApplicationRef,
  Component,
  ComponentRef,
  DestroyRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  computed,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { statesData } from './states-data';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocalstorageService } from '../../services/localstorage.service';
import { State, StateProperty } from '../../models/state.model';
import { TooltipOptions } from 'leaflet';
import { MapTooltipComponent } from './map-tooltip/map-tooltip.component';
import { DataService } from '../../services/data.service';
import { firstValueFrom } from 'rxjs';
import { SocketService } from '../../services/socket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tweet } from '../../models/tweet.model';
import { LayoutService } from '../../services/layout.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-election-map',
  standalone: true,
  imports: [SelectButtonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './election-map.component.html',
  styleUrls: [
    '../../../../node_modules/leaflet/dist/leaflet.css',
    './election-map.component.scss',
  ],
  animations: [
    trigger('mapAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '500ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '500ms ease-in',
          style({ opacity: 0, transform: 'translateY(10px)' })
        ),
      ]),
    ]),
  ],
})
export class ElectionMapComponent implements OnInit, OnChanges {
  localStorageService = inject(LocalstorageService);
  socketService = inject(SocketService);
  layoutService = inject(LayoutService);
  dataService = inject(DataService);
  mapStyle = signal<string>('candidate');
  loading = signal<boolean>(false);
  statesData: State[] = statesData.features;
  geojson: any;
  map: L.Map;
  stateOptions: { label: string; value: string }[] = [
    { label: 'Candidate', value: 'candidate' },
    { label: 'Sentiment', value: 'sentiment' },
  ];
  private _componentRef: ComponentRef<MapTooltipComponent>;
  private _applicationRef = inject(ApplicationRef);
  private readonly _destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await this.mapData();
    this.getMapStyle();
    this.mapInit();
    this.buildTooltip();

    // Listening for new tweets
    this.socketService.tweets$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((tweet) => {
        this.handleNewTweet(tweet!);
      });
  }

  /**
   * Handles new tweet data and updates the chart data.
   * @param {Tweet} tweet Data for the new tweet.
   */
  handleNewTweet(tweet: Tweet) {
    if (!tweet) return;

    const state = this.statesData.find(
      (state) => state.properties.code === tweet.state_code
    );
    if (state) {
      state.properties.sentiment! += tweet.sentiment_score;
      if (tweet.candidate !== 'trump') {
        state.properties.bidenSentiment! += tweet.sentiment_score;
        state.properties.trumpAmount! += 1;
      }
      if (tweet.candidate !== 'biden') {
        state.properties.trumpSentiment! += tweet.sentiment_score;
        state.properties.bidenAmount! += 1;
      }
      this.configMap();
    }
  }

  /**
   * Feeding data to the tooltip component.
   */
  buildTooltip() {
    this.map.on('tooltipopen', (event) => {
      const { tooltip } = event;
      const tooltipContainer = (tooltip as any)._container;
      const tooltipData = (
        tooltip.options as TooltipOptions & { data: { state: State } }
      )?.data.state.properties;
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
    this.buildTooltip();
  }

  /**
   * Helper function to bind a tooltip to a polygon
   * @param {L.Polygon} polygon Poligon to bind tooltip to.
   * @param {State} state State data to be displayed in the tooltip.
   */
  bindTooltipToPolygon(polygon: L.Polygon, state: State) {
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
    const mapData = await firstValueFrom(this.dataService.getElectionMap());
    this.statesData.forEach((state: State) => {
      const stateData = mapData.find(
        (data) => data.state_code === state.properties.code
      );
      state.properties.sentiment = stateData!.total_sentiment;
      state.properties.trumpSentiment = stateData!.trump_sentiment;
      state.properties.bidenSentiment = stateData!.biden_sentiment;
      state.properties.trumpAmount = stateData!.trump_count;
      state.properties.bidenAmount = stateData!.biden_count;
    });
    this.loading.set(false);
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
    const colorOne =
      this.mapStyle() === 'candidate'
        ? this.layoutService.colorStyles.blue
        : this.layoutService.colorStyles.green;
    const colorTwo =
      this.mapStyle() === 'candidate'
        ? this.layoutService.colorStyles.red
        : this.layoutService.colorStyles.orange;

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
