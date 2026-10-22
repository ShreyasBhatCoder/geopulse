import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// amCharts Imports
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5radar from '@amcharts/amcharts5/radar';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

@Component({
  selector: 'app-live-chart',
  standalone: true,
  templateUrl: './live-chart.component.html',
})
export class LiveChart implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  private tempGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('tempGaugeDiv');
  private humidityGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('humidityGaugeDiv');
  private pressureGaugeDiv = viewChild<ElementRef<HTMLDivElement>>('pressureGaugeDiv');
  private timelineChartDiv = viewChild<ElementRef<HTMLDivElement>>('timelineChartDiv');

  private rootElements: am5.Root[] = [];
  private dataStreamInterval?: any;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initializeDashboard();
  }

  // ✅ HELPER: Determines which amCharts theme engine to load based on active Tailwind context
  private getActiveThemes(root: am5.Root): am5.Theme[] {
    const themes: am5.Theme[] = [am5themes_Animated.new(root)];

    // Check if the HTML tag contains the dark theme class
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      themes.push(am5themes_Dark.new(root));
    }

    return themes;
  }

  private initializeDashboard(): void {
    const timelineEl = this.timelineChartDiv()?.nativeElement;
    if (!timelineEl) return;

    // 1. Initialize Trend Timeline Panel (Bottom)
    const rootTimeline = am5.Root.new(timelineEl);

    // ✅ FIXED: Using dynamic themes instead of hardcoding Dark theme
    rootTimeline.setThemes(this.getActiveThemes(rootTimeline));
    this.rootElements.push(rootTimeline);

    const chart = rootTimeline.container.children.push(
      am5xy.XYChart.new(rootTimeline, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        layout: rootTimeline.verticalLayout,
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

    const tempSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Temperature (°C)',
      'temp',
      '#ff5733',
      33,
    );
    const humSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Humidity (%)',
      'humidity',
      '#3399ff',
      33,
    );
    const pressSeries = this.createTrendPanel(
      rootTimeline,
      chart,
      xAxis,
      'Pressure (hPa)',
      'pressure',
      '#2ecc71',
      33,
    );

    chart.set('cursor', am5xy.XYCursor.new(rootTimeline, { behavior: 'none' }));

    // 2. Initialize Real-Time Gauges (Top)
    const liveTempGauge = this.buildGauge(
      this.tempGaugeDiv()?.nativeElement,
      -10,
      50,
      'Temp °C',
      '#ff5733',
    );
    const liveHumGauge = this.buildGauge(
      this.humidityGaugeDiv()?.nativeElement,
      0,
      100,
      'Humidity %',
      '#3399ff',
    );
    const livePressGauge = this.buildGauge(
      this.pressureGaugeDiv()?.nativeElement,
      950,
      1050,
      'Pressure hPa',
      '#2ecc71',
    );

    if (!liveTempGauge || !liveHumGauge || !livePressGauge) return;

    // 3. Historical Telemetry Seeding
    let initialData = [];
    let time = new Date().getTime() - 60000;
    for (let i = 0; i < 30; i++) {
      time += 2000;
      initialData.push({
        date: time,
        temp: 22 + Math.random(),
        humidity: 55 + Math.random() * 5,
        pressure: 1012 + Math.random() * 2,
      });
    }
    tempSeries.data.setAll(initialData);
    humSeries.data.setAll(initialData);
    pressSeries.data.setAll(initialData);

    // 4. Live Data Feed Loop
    this.dataStreamInterval = setInterval(() => {
      const now = new Date().getTime();
      const rawData = {
        date: now,
        temp: 21.5 + Math.sin(now / 50000) * 4 + Math.random() * 0.4,
        humidity: 60 + Math.cos(now / 40000) * 15 + Math.random() * 1.5,
        pressure: 1010 + Math.sin(now / 100000) * 8 + Math.random() * 0.5,
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
        rotation: -90,
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
    return series;
  }

  private buildGauge(
    element: HTMLDivElement | undefined,
    min: number,
    max: number,
    labelText: string,
    color: string,
  ) {
    if (!element) return null;

    const root = am5.Root.new(element);

    // ✅ FIXED: Using dynamic themes instead of hardcoding Dark theme
    root.setThemes(this.getActiveThemes(root));
    this.rootElements.push(root);

    const gaugeChart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        innerRadius: -15,
        startAngle: 135,
        endAngle: 405,
      }),
    );

    const xRenderer = am5radar.AxisRendererCircular.new(root, {});
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
      pinRadius: 10,
      radius: am5.percent(90),
      bottomWidth: 5,
    });
    clockHand.hand.set('fill', am5.color(color));
    dataItem.set('bullet', am5xy.AxisBullet.new(root, { sprite: clockHand }));

    gAxis.createAxisRange(dataItem);

    const label = gaugeChart.radarContainer.children.push(
      am5.Label.new(root, {
        text: labelText,
        fontSize: 14,
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
        label.set('text', `${labelText}\n[bold font-size: 20px]${val.toFixed(1)}[/]`);
      },
    };
  }

  ngOnDestroy(): void {
    if (this.dataStreamInterval) clearInterval(this.dataStreamInterval);
    this.rootElements.forEach((root) => root.dispose());
  }
}

