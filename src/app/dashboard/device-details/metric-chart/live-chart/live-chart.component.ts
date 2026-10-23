import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  ElementRef,
  viewChild,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Adjust path to match your layout environment

// amCharts Imports
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5radar from '@amcharts/amcharts5/radar';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import { ThemeService } from '../../../../theme-service.service';
import { randomDeviceMetricLog } from '../../../../../../backend/utils/randomize';
import { DEVICE_TELEMETRY } from '../../device-telemetry.service';
import { MetricLog } from '../../device-list/device-item/device.model';

@Component({
  selector: 'app-live-chart',
  standalone: true,
  templateUrl: './live-chart.component.html',
})
export class LiveChart implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private themeService = inject(ThemeService);
  private deviceService = inject(DEVICE_TELEMETRY);

  private tempGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('tempGaugeDiv');
  private humidityGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('humidityGaugeDiv');
  private pressureGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('pressureGaugeDiv');
  private timelineChartDiv = viewChild<ElementRef<HTMLDivElement>>('timelineChartDiv');

  private rootElements: am5.Root[] = [];
  private dataStreamInterval?: any;
  private isInitialized = false;

  isMobileLayout = window.innerWidth < 678;
  adaptiveHeight = this.isMobileLayout ? 95 : 30;

  constructor() {
    console.log('Initializing chart for:', this.deviceService.selectedDevice()?.name);
    // Watch reactive global theme service signals natively
    effect(() => {
      const device = this.deviceService.selectedDevice();
      if (this.isInitialized && device) {
        this.clearDashboardMemory();
        setTimeout(() => {
          this.initializeDashboard();
        }, 50);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initializeDashboard();
    this.isInitialized = true;
  }

  private applyThemeEngine(root: am5.Root): void {
    const isDarkMode = this.themeService.isDarkTheme();
    const baseTheme = am5.Theme.new(root);

    baseTheme.rule('Label').setAll({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
    });

    if (isDarkMode) {
      root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root), baseTheme]);
    } else {
      const lightThemeOverrides = am5.Theme.new(root);

      lightThemeOverrides.rule('Label').setAll({
        fill: am5.color(0x374151), // slate-700
      });

      lightThemeOverrides.rule('AxisLabel').setAll({
        fill: am5.color(0x6b7280), // gray-500
      });

      lightThemeOverrides.rule('Grid').setAll({
        stroke: am5.color(0xe5e7eb),
        strokeOpacity: 0.6,
      });

      root.setThemes([am5themes_Animated.new(root), lightThemeOverrides, baseTheme]);
    }
  }

  private initializeDashboard(): void {
    const timelineEl = this.timelineChartDiv()?.nativeElement;
    const tempEl = this.tempGaugeDiv()?.nativeElement;
    const humEl = this.humidityGaugeDiv()?.nativeElement;
    const pressEl = this.pressureGaugeDiv()?.nativeElement;

    // Direct break guard check if DOM pointers aren't fully painted
    if (!timelineEl || !tempEl || !humEl || !pressEl) return;

    // 1. Initialize Trend Timeline Panel (Bottom)
    const rootTimeline = am5.Root.new(timelineEl);
    this.applyThemeEngine(rootTimeline);
    this.rootElements.push(rootTimeline);

    const chart = rootTimeline.container.children.push(
      am5xy.XYChart.new(rootTimeline, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        layout: this.isMobileLayout ? rootTimeline.horizontalLayout : rootTimeline.verticalLayout,
        height: am5.percent(100),
      }),
    );

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(rootTimeline, {
        maxDeviation: 0.5,
        groupData: false,
        baseInterval: { timeUnit: 'second', count: 1 },
        renderer: am5xy.AxisRendererX.new(rootTimeline, { minorGridEnabled: true }),
      }),
    );

    // Locate the parameters inside initializeDashboard() where you register the rows:
    // Inside initializeDashboard() -> 1. Initialize Trend Timeline Panel (Bottom)
    // ✅ FIX: Setting this parameter to 30 ensures that each row takes up 1/3 of the screen real-estate cleanly without squishing text labels
    const tempSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Temperature (°C)',
      'temp',
      '#ff5733',
      95,
    );
    const humSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Humidity (%)',
      'humidity',
      '#3399ff',
      95,
    );
    const pressSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Pressure (hPa)',
      'pressure',
      '#2ecc71',
      95,
    );

    chart.set('cursor', am5xy.XYCursor.new(rootTimeline, { behavior: 'none' }));

    // 2. Initialize Real-Time Gauges (Top)
    const liveTempGauge = this.buildGauge(tempEl, -10, 50, 'Temp °C', '#ff5733');
    const liveHumGauge = this.buildGauge(humEl, 0, 100, 'Humidity %', '#3399ff');
    const livePressGauge = this.buildGauge(pressEl, 950, 1050, 'Pressure hPa', '#2ecc71');

    if (!liveTempGauge || !liveHumGauge || !livePressGauge) return;

    // 3. Historical Telemetry Seeding
    let initialLogs: MetricLog[] = [...(this.deviceService.selectedDevice()?.metricHistory || [])];
    let timeTracker = new Date().getTime() - 30 * 120000;
    for (let i = 0; i < 30; i++) {
      timeTracker += 12000;

      let generatedLog: MetricLog = {
        ...randomDeviceMetricLog(),
        timestamp: new Date(timeTracker).toISOString(),
      };

      initialLogs.push(generatedLog);
    }

    const chartData = initialLogs.map((log) => ({
      ...log,
      date: new Date(log.timestamp).getTime(),
      temp: log.temperature,
    }));

    tempSeries.data.setAll(chartData);
    humSeries.data.setAll(chartData);
    pressSeries.data.setAll(chartData);

    // 4. Live Data Feed Loop
    this.dataStreamInterval = setInterval(() => {
      const log = randomDeviceMetricLog();
      const rawData = {
        ...log,
        date: new Date(log.timestamp).getTime(),
        temp: log.temperature,
      };

      tempSeries.data.push(rawData);
      humSeries.data.push(rawData);
      pressSeries.data.push(rawData);

      if (tempSeries.data.length > 150) {
        tempSeries.data.shift();
        humSeries.data.shift();
        pressSeries.data.shift();
      }

      liveTempGauge.update(rawData.temp);
      liveHumGauge.update(rawData.humidity);
      livePressGauge.update(rawData.pressure);
    }, 2000);
  }

  private createTrendPanel(
    root: am5.Root,
    chart: am5xy.XYChart,
    xAxis: am5xy.DateAxis<am5xy.AxisRenderer>,
    title: string,
    field: string,
    color: string,
    heightPercent: number,
  ) {
    const yRenderer = am5xy.AxisRendererY.new(root, {});
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(heightPercent),
        renderer: yRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      }),
    );

    yAxis.children.moveValue(
      am5.Label.new(root, {
        text: title,
        rotation: this.isMobileLayout ? 0 : -90,
        y: am5.p50,
        centerX: am5.p50,
        fontWeight: 'bold',
      }),
      0,
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: title,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: field,
        valueXField: 'date',
        stroke: am5.color(color),
        tooltip: am5.Tooltip.new(root, { labelText: '{name}: [bold]{valueY}[/]' }),
      }),
    );

    series.strokes.template.setAll({ strokeWidth: 2 });
    series.fills.template.setAll({ fillOpacity: 0.05, visible: true });
    return series;
  }

  private buildGauge(
    element: HTMLDivElement,
    min: number,
    max: number,
    labelText: string,
    color: string,
  ) {
    const root = am5.Root.new(element);
    this.applyThemeEngine(root);
    this.rootElements.push(root);

    const gaugeChart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        innerRadius: -15,
        startAngle: 135,
        endAngle: 405,
      }),
    );

    const xRenderer = am5radar.AxisRendererCircular.new(root, {});
    xRenderer.grid.template.setAll({ strokeOpacity: 0.1 });

    const gAxis = gaugeChart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        min: min,
        max: max,
        strictMinMax: true,
        renderer: xRenderer,
      }),
    );

    const dataItem = gAxis.makeDataItem({});
    const clockHand = am5radar.ClockHand.new(root, {
      pinRadius: 8,
      radius: am5.percent(85),
      bottomWidth: 4,
    });
    clockHand.hand.set('fill', am5.color(color));
    dataItem.set('bullet', am5xy.AxisBullet.new(root, { sprite: clockHand }));
    gAxis.createAxisRange(dataItem);

    const label = gaugeChart.radarContainer.children.push(
      am5.Label.new(root, {
        text: labelText,
        fontSize: 13,
        fontWeight: '500',
        centerX: am5.percent(50),
        textAlign: 'center',
        y: 40,
      }),
    );

    return {
      update: (val: number) => {
        dataItem.animate({
          key: 'value',
          to: val,
          duration: 600,
          easing: am5.ease.out(am5.ease.cubic),
        });
        label.set('text', `${labelText}\n[bold font-size: 22px]${val.toFixed(1)}[/]`);
      },
    };
  }

  private clearDashboardMemory(): void {
    if (this.dataStreamInterval) {
      clearInterval(this.dataStreamInterval);
    }
    this.rootElements.forEach((root) => root.dispose());
    this.rootElements = [];
  }

  ngOnDestroy(): void {
    this.clearDashboardMemory();
  }
}
