const { app, BrowserWindow, ipcMain } = require('electron');
const { Client } = require('tplink-smarthome-api');
const { version } = require('./package.json');
const client = new Client();
// var robot = require("robotjs");

let bak = 0, win, flag, candle, fire;

function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 350,
    minWidth: 400,
    minHeight: 250,
    icon: "./assets/favicon.png",
    // transparent: true,
    frame: false,
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
    alwaysOnTop: true,
  })
  win.hide();
  win.setMenu(null)
  win.loadFile('./public/index.html')
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setTimeout(() => {
    win.webContents.send('version', {ver: version})
    win.show();
  }, 2000);
  setTimeout(() => {
    client.startDiscovery().on('device-new', (device) => {
      device.getSysInfo().then((e) => {win.webContents.send('devices_found', {ip: device.host, name: device.alias, color: e.is_color, state: e.light_state })});
    });
  }, 5000);
});

ipcMain.on('powerToggle', (event, args) => {
  office = client.getDevice({ host: args.ip }).then((device) => {
    state = args.state
    device.setPowerState(state);
  });
});

ipcMain.on('monitor', (event, args) => {
  flag = false
  colors = [310,10,254,154,285,323]
  var interval = setInterval(() => {
    if (flag) {clearInterval(interval)}
    col = colors[Math.floor(Math.random() * colors.length)]
    office = client.getDevice({ host: args.ip }).then((device) => {
      let payload = {
        on_off: true, // false to turn off
        brightness: 100,
        hue: col, //0-360
        saturation: 100, // 0-100
        color_temp: 0, // 2640 - 9000 Red -- Blue 6000 = Hosp white // ! SHOULD BE 0 IF YOU WANT COLOR OUTPUT!
        transition_period: 0
      }
      device.lighting.setLightState(payload)
    });
  }, 1000)
  // var hex = robot.getPixelColor(mouse.x, mouse.y);
  // console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
});

ipcMain.on('candlelight', (event, args) => {
  office = client.getDevice({ host: args.ip }).then((device) => {
    let payload = {
      on_off: true, // false to turn off
      brightness: 100,
      hue:0, //0-360
      saturation: 100, // 0-100
      color_temp: 2640, // 2640 - 9000 Red -- Blue 6000 = Hosp white // ! SHOULD BE 0 IF YOU WANT COLOR OUTPUT!
      transition_period: 500
    }
    device.lighting.setLightState(payload)
  });
});

ipcMain.on('fireplace', (event, args) => {
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true);
    let interval = Math.random(100, 5000);
    let payload = {
      on_off: true, // false to turn off
      brightness: 100,
      hue: i * 2, //0-360
      saturation: 100, // 0-100
      color_temp: 0, // 2640 - 9000 Red -- Blue 6000 = Hosp white // ! SHOULD BE 0 IF YOU WANT COLOR OUTPUT!
      transition_period: 500
    }
    device.lighting.setLightState(payload).then(
      (out) => {
        console.count(out);
        bak++
      }
    );
  });
});

ipcMain.on('break', (event, args) => {
  flag = true
});

ipcMain.on('spectrum', (event, args) => {
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true);
    for (let i = 0; i <= 180; i++) {
      if (flag) { break; }
      console.log('running')
      // if (i = 0) bak = 0;
      let payload = {
        on_off: true, // false to turn off
        brightness: 100,
        hue: i * 2, //0-360
        saturation: 100, // 0-100
        color_temp: 0, // 2640 - 9000 Red -- Blue 6000 = Hosp white // ! SHOULD BE 0 IF YOU WANT COLOR OUTPUT!
        transition_period: 500
      }
      device.lighting.setLightState(payload).then(
        (out) => {
          console.count(out);
          bak++
          win.webContents.send('color_changed', bak * 2)
        }
      );
      setTimeout(() => {
        console.log('arbitrary delay');
      }, 500)
    }
  });
});

ipcMain.on('close', (event) => {
  app.quit();
});

ipcMain.on('brightness_update', (e, args) => {
  office = client.getDevice({ host: args.ip }).then((device) => {
    // device.setPowerState(true);
    device.lighting.setLightState(args.payload);
  });
})

const colors = {
  candle: [],
  fireplace: []
}