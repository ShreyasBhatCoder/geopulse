import type { MetricLog } from "../../src/app/dashboard/device-details/device-list/device-item/device.model.js";

const randomInRange = (
    min: number, 
    max: number, 
    decimals = 0
): number => {
    const val = Math.random() * (max - min) + min;
    return decimals === 0 ? Math.round(val) : parseFloat(val.toFixed(decimals));
};

export function randomDeviceMetricLog(): MetricLog {

    return {
        timestamp: new Date().toISOString(),
        temperature: randomInRange(-20.0, 50.0, 1),
        humidity: randomInRange(10, 95, 0) as MetricLog['humidity'],
        pressure: randomInRange(980.0, 1030.0, 1),
        batteryVoltage: randomInRange(3.20, 4.20, 2),
        cpuLoad: randomInRange(0, 100, 0),
        memoryFree: randomInRange(2048, 20480, 0),
        rssi: randomInRange(-95, -30, 0),
        latency: randomInRange(10, 150, 0)
    };
}



