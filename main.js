const { app, BrowserWindow, ipcMain } = require('electron');
const { Client } = require('tplink-smarthome-api');
const { version } = require('./package.json');

let bak = 0, win, flag;

function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 290,
    minWidth: 400,
    minHeight: 250,
    icon: "./assets/favicon.png",
    // transparent: true,
    frame: false,
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false
    },
    alwaysOnTop: true,
  })
  win.hide();
  win.setMenu(null)
  win.loadFile('./public/index.html')
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setTimeout(() => {
    win.webContents.send('version', {ver: version})
    win.show();
  }, 2000);
  const client = new Client();
  setTimeout(() => {
    client.startDiscovery().on('device-new', (device) => {
      device.getSysInfo().then((e) => {win.webContents.send('devices_found', {ip: device.host, name: device.alias, color: e.is_color, state: e.light_state })});
    });
  }, 5000);
});

ipcMain.on('light_off', (event, args) => {
  const client = new Client();
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(false);
  });
});

ipcMain.on('light_on', (event, args) => {
  const client = new Client();
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true);
  });
});

ipcMain.on('spectrum', (event, args) => {
  const client = new Client();

  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true);
    for (let i = 0; i <= 360; i++) {
      if (flag) { break; }
      // if (i = 0) bak = 0;
      let payload = {
        on_off: true, // false to turn off
        brightness: 100,
        hue: i, //0-360
        saturation: 100, // 0-100
        color_temp: 0, // 2640 - 9000 Red -- Blue 6000 = Hosp white // ! SHOULD BE 0 IF YOU WANT COLOR OUTPUT!
        // transition_period: 0
      }
      device.lighting.setLightState(payload).then(
        (out) => {
          console.count(out);
          bak++
          win.webContents.send('color_changed', bak)
        }
      );
    }
  });
});

ipcMain.on('close', (event) => {
  app.quit();
});

ipcMain.on('brughtness_update', (e, args) => {
  const client = new Client();
  office = client.getDevice({ host: args.ip }).then((device) => {
    // device.setPowerState(true);
    device.lighting.setLightState(args.payload);
  });
})