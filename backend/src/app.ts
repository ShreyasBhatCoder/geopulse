import express, { type Request, type Response, type Express, urlencoded } from 'express';
import fs from 'node:fs/promises';
import type { IoTDevice } from '../../src/app/dashboard/device-details/device-list/device-item/device.model.js';
import { randomBytes } from 'node:crypto';

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req: Request, res: Response) => {
  const devices = await fs.readFile('./data/devices.json', 'utf-8');

  res.json(JSON.parse(devices) as IoTDevice[]);
});

app.post('/new-device', async (req: Request, res: Response) => {
  const deviceListString = await fs.readFile('./data/devices.json', 'utf-8');
  const devices: IoTDevice[] = JSON.parse(deviceListString);

  const newDevice: IoTDevice = req.body as IoTDevice;
  if (!newDevice.name) {
    return res.status(400).json({ message: 'Device name is required' });
  }
  newDevice.id = randomBytes(16).toString('hex');
  newDevice.status = 'online';
  newDevice.batteryLevel = 100;
  newDevice.lastPing = new Date().toISOString();
  newDevice.metricHistory = [];
  devices.push(newDevice);

  await fs.writeFile('./data/devices.json', JSON.stringify(devices, null, 2));

  return res.status(201).json(devices[devices.length - 1]);
});

app.delete('/delete-device', async (req: Request, res: Response) => {
  const deviceListString = await fs.readFile('./data/devices.json', 'utf-8');
  let devices: IoTDevice[] = JSON.parse(deviceListString);

  const deviceId: string = req.body.id;
  if (!deviceId) {
    return res.status(400).json({ message: 'Device ID is required' });
  }
  devices = devices.filter((device: IoTDevice) => device.id !== deviceId);

  await fs.writeFile('./data/devices.json', JSON.stringify(devices, null, 2));

  return res.status(200).json(devices);
});

app.listen(5000, () => {
  console.log(`Server is running on port 5000`);
});
