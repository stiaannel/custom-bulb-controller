const { app, BrowserWindow, ipcMain } = require('electron');
const { Client } = require('tplink-smarthome-api');
const { version } = require('./package.json');
const client = new Client();
// var robot = require("robotjs");

let win, flag, candle, fire, spectrum_flg = false, spec_i = 0;

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
  // win.webContents.openDevTools();
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

function handleComment(level, message) {
  const levels = {
    info: '[INFO]',
    debug: '[DEBUG]',
    warning: '[WARNING]'
  };

  const lowerLevel = level.toLowerCase();

  if (levels.hasOwnProperty(lowerLevel)) {
    console.log(`${levels[lowerLevel]} ${message}`);
  } else {
    console.log(`[UNKNOWN LEVEL] ${message}`);
  }
}

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

ipcMain.on('break', (event, args) => {
  flag = true
});

function runSpectrumCycle(device) {

  function setLightStateAndAdvance() {
    if (!spectrum_flg) return; // Exit the loop if spectrum function is stopped

    let payload = {
      on_off: true,
      brightness: 100,
      hue: spec_i,
      saturation: 100,
      color_temp: 0,
      transition_period: 200
    };

    device.lighting.setLightState(payload).then((out) => {
      win.webContents.send('color_changed', spec_i);

      if (out === true) {
        // Advance to the next iteration if the response is "true"
        spec_i++;
        if (spec_i > 360) {
          spec_i = 0; // Reset spec_i to 0 if it goes over 360
        }
        setLightStateAndAdvance();
      
      } else {
        spectrum_flg = false; // Set the flag to stop the spectrum function
      }
    });
  }

  setLightStateAndAdvance(); // Start the loop
}

ipcMain.on('spectrum', (event, args) => {
  // Select the correct device
  handleComment('info', `Spectrum cycle called on ${args.ip}`);
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true); // Ensure the device is on

    if (!spectrum_flg) {
      handleComment('info', `Spectrum cycle started on ${args.ip}`);
      spectrum_flg = true;
      runSpectrumCycle(device);
    } else {
      spectrum_flg = false;
      handleComment('info', `Spectrum cycle stopped on ${args.ip}`);
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
