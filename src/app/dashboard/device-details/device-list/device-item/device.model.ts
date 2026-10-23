type Enumerate<N extends number, Acc extends number[] = []> =
Acc["length"] extends N
? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>

type Range<F extends number, L extends number> = Exclude<Enumerate<L>, Enumerate<F>>;

export type Percentage = Range<0, 101>;

export type MetricLog = {
    timestamp: string; // time of the last recorded metric
    temperature: number; // °C (ideally between -20.0 and 50.0°C)
    humidity: Percentage; // %
    pressure: number; // hPa (nominal around 1013.2 hPa)
    batteryVoltage: number; // raw cell voltage in V --> use this to compute "batteryLevel" in IoTDevice (Full: 4.2V, Empty: 3.2V)
    cpuLoad: number; // internal microprocessor usage in % --> Check for frozen or offline devices
    memoryFree: number; // RAM in kilobytes (KB) --> Check for memory leaks
    rssi: number; // Received Signal Strength Indicator in dBm (negative values --> closer to 0 means better signal)
    latency: number; // Round-trip time in milliseconds (ms) --> time between server requests and device response
}


export type IoTDevice = {
    id: string; // IoT device uuid
    name: string; // Sensor name
    hardwareModel: string; // e.g., "PulseNode-v2"
    firmwareVersion: string; // e.g., "1.0.0"
    status: "online" | "offline" | "maintenance"; // current status of the device
    batteryLevel: Percentage; // battery level of the device
    lastPing: string; // last time the device was pinged
    metricHistory?: MetricLog[]; // history of metrics collected from the device every 5 mins
};