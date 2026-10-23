import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { DEVICE_TELEMETRY } from '../../device-telemetry.service';
import { MetricLog } from '../../device-list/device-item/device.model';
import { randomDeviceMetricLog } from '../../../../../../backend/utils/randomize';

@Component({
  selector: 'app-performance-chart',
  templateUrl: './performance-chart.component.html',
  standalone: true,
})
export class PerformanceChart implements OnInit, OnDestroy, OnChanges {
  private deviceService = inject(DEVICE_TELEMETRY);
  metricData: MetricLog[] = this.deviceService.selectedDevice()?.metricHistory || [];

  private roots: { [key: string]: am5.Root } = {};
  private seriesMap: { [key: string]: am5xy.XYSeries } = {};
  private isInitialized = false;
  private dataStreamInterval?: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    effect(() => {
      const device = this.deviceService.selectedDevice();
      if (this.isInitialized && device) {
        this.clearCharts();
        setTimeout(() => {
          this.initializeCharts();
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initializeCharts();
        this.isInitialized = true;
      }, 50);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metricData'] && !changes['metricData'].firstChange) {
      this.updateAllCharts();
    }
  }

  private formatTimestamp(isoString: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toTimeString().split(' ')[0]; // Returns clean "HH:MM:SS"
    } catch (e) {
      return isoString;
    }
  }

  private createBaseChart(
    divId: string,
    seriesConfig: Array<{
      field: string;
      name: string;
      color: string;
      isArea: boolean;
      isColumn?: boolean;
    }>,
  ) {
    const root = am5.Root.new(divId);
    root.setThemes([am5themes_Animated.new(root)]);
    this.roots[divId] = root;

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        layout: root.verticalLayout,
      }),
    );

    // X-Axis Configuration - Swapped categoryField to displayTime & increased minGridDistance
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'displayTime',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 65 }),
      }),
    );
    xAxis
      .get('renderer')
      .labels.template.setAll({ fill: am5.color(0x71717a), fontSize: 10, fontFamily: 'monospace' });

    // Y-Axis Configuration
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    );
    yAxis.get('renderer').labels.template.setAll({ fill: am5.color(0x71717a), fontSize: 10 });

    // Series Generation
    seriesConfig.forEach((conf) => {
      if (conf.isColumn) {
        const series = chart.series.push(
          am5xy.ColumnSeries.new(root, {
            name: conf.name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: conf.field,
            categoryXField: 'displayTime', // Swapped from timestamp
            fill: am5.color(conf.color),
            stroke: am5.color(conf.color),
          }),
        );
        this.seriesMap[conf.field] = series;
      } else {
        const series = chart.series.push(
          am5xy.LineSeries.new(root, {
            name: conf.name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: conf.field,
            categoryXField: 'displayTime', // Swapped from timestamp
            stroke: am5.color(conf.color),
            fill: am5.color(conf.color),
            curveFactory: (am5 as any).CurveFactory
              ? (am5 as any).CurveFactory.monotoneX
              : undefined,
          }),
        );

        if (conf.isArea) {
          (series.fills as any).template.setAll({
            fillOpacity: 0.15,
            visible: true,
          });
        } else {
          series.bullets.push(() => {
            return am5.Bullet.new(root, {
              sprite: am5.Circle.new(root, { radius: 2.5, fill: am5.color(conf.color) }),
            });
          });
        }

        this.seriesMap[conf.field] = series;
      }
    });

    chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
  }

  private initCpuChart(): void {
    this.createBaseChart('cpuChartDiv', [
      { field: 'cpuLoad', name: 'CPU Load', color: '#ef4444', isArea: true },
    ]);
  }

  private initMemoryChart(): void {
    this.createBaseChart('memoryChartDiv', [
      { field: 'memoryFree', name: 'Free Memory', color: '#3b82f6', isArea: true },
    ]);
  }

  private initRssiChart(): void {
    this.createBaseChart('rssiChartDiv', [
      { field: 'rssi', name: 'Signal Strength', color: '#10b981', isArea: false, isColumn: true },
    ]);
  }

  private initLatencyChart(): void {
    this.createBaseChart('latencyChartDiv', [
      { field: 'latency', name: 'Latency', color: '#f59e0b', isArea: false },
    ]);
  }

  private updateAllCharts(): void {
    if (!this.metricData || this.metricData.length === 0) return;

    // Inject temporary formatted property safely into the bound arrays
    const formattedData = this.metricData.map((item) => ({
      ...item,
      displayTime: this.formatTimestamp(item.timestamp),
    }));

    Object.keys(this.seriesMap).forEach((field) => {
      const series = this.seriesMap[field];
      if (series) {
        series.data.setAll(formattedData);
        const xAxis = series.get('xAxis') as am5xy.CategoryAxis<am5xy.AxisRenderer>;
        xAxis.data.setAll(formattedData);
      }
    });
  }

  private initializeCharts(): void {
    this.metricData = [...(this.deviceService.selectedDevice()?.metricHistory || [])];

    if (this.metricData.length < 15) {
      const needed = 15 - this.metricData.length;
      let time = Date.now() - needed * 5000;
      for (let i = 0; i < needed; i++) {
        time += 5000;
        this.metricData.push({
          ...randomDeviceMetricLog(),
          timestamp: new Date(time).toISOString(),
        });
      }
    }

    this.initCpuChart();
    this.initMemoryChart();
    this.initRssiChart();
    this.initLatencyChart();
    this.updateAllCharts();

    this.startLiveStream();
  }

  private startLiveStream(): void {
    this.dataStreamInterval = setInterval(() => {
      const log = randomDeviceMetricLog();
      const formattedItem = {
        ...log,
        displayTime: this.formatTimestamp(log.timestamp),
      };

      Object.keys(this.seriesMap).forEach((field) => {
        const series = this.seriesMap[field];
        if (series) {
          series.data.push(formattedItem);
          const xAxis = series.get('xAxis') as am5xy.CategoryAxis<am5xy.AxisRenderer>;
          xAxis.data.push(formattedItem);

          if (series.data.length > 25) {
            series.data.shift();
            xAxis.data.shift();
          }
        }
      });
    }, 2000);
  }

  private clearCharts(): void {
    if (this.dataStreamInterval) {
      clearInterval(this.dataStreamInterval);
      this.dataStreamInterval = undefined;
    }
    if (isPlatformBrowser(this.platformId)) {
      Object.values(this.roots).forEach((root) => {
        if (root) root.dispose();
      });
      this.roots = {};
      this.seriesMap = {};
    }
  }

  ngOnDestroy(): void {
    this.clearCharts();
  }
}
