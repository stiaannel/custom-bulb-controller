const { app, BrowserWindow, ipcMain } = require('electron');
const { Client } = require('tplink-smarthome-api');
const { version } = require('./package.json');
const client = new Client();
// var robot = require("robotjs");

let win, flag, candle, fire, spectrum_flg = false, spec_i = 0;
let candle_flag = false, fire_flag = false;

function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 375,
    minWidth: 400,
    minHeight: 375,
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

ipcMain.on('candle', (event, args) => {
  // Select the correct device
  handleComment('info', `Candle cycle called on ${args.ip}`);
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true); // Ensure the device is on

    if (!candle_flag) {
      candle_flag = true;
      simulateCandlelight(device);
    } else {
      candle_flag = false;
    }
  });
});

ipcMain.on('fire', (event, args) => {
  // Select the correct device
  handleComment('info', `Fire cycle called on ${args.ip}`);
  office = client.getDevice({ host: args.ip }).then((device) => {
    device.setPowerState(true); // Ensure the device is on

    if (!fire_flag) {
      fire_flag = true;
      simulateCampfire(device);
    } else {
      fire_flag = false;
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

// Function to handle candle effect
function simulateCandlelight(device) {
  console.log("running candlesim");
  // Check if candle effect is still required
  if (candle_flag) {
    let brightness = Math.floor(Math.random() * 50) + 50;
    let transition = Math.floor(Math.random() * 1000) + 200;
    // keeping the hue in the candlelight colour range

    let hue = Math.floor(Math.random() * 30) + 30; // Generate random hue for flickering effect
    let payload = {
      on_off: true,
      brightness: brightness, // Adjust brightness to create a dim effect
      hue: 40, // Since candlelight doesn't change hue much, set it to a default value
      saturation: 100, // Saturation can remain constant
      color_temp: 0, // Warm color temperature for candlelight
      transition_period: transition // Transition period for smooth effect
    };

    device.lighting.setLightState(payload).then(() => {
      // Additional code if needed
      // After setting light state, check if candle effect should continue
      if (candle_flag) {
        simulateCandlelight(device); // Continue candle effect
      } else {
        // If candle flag is false, reset light state or perform other actions
      }
    });
  } else {
    // Reset light state or perform other actions if candle flag is false
  }
}

// Function to handle campfire effect
function simulateCampfire(device) {
  // Check if campfire effect is still required
  if (fire_flag) {
    let hue = Math.floor(Math.random() * 35) + 15; // Generate random hue for flickering effect
    let brightness = Math.floor(Math.random() * 70) + 30; // Adjust brightness for flickering effect
    let transition = Math.floor(Math.random() * 1000) + 200; // Generate random transition period for flickering effect

    let payload = {
      on_off: true,
      brightness: brightness, // Adjust brightness for flickering effect
      hue: hue, // Vary hue for flickering effect
      saturation: 100, // Saturation can remain constant
      color_temp: 0, // Warm color temperature for campfire
      transition_period: transition // Transition period for smooth effect
    };

    device.lighting.setLightState(payload).then(() => {
      // Additional code if needed
      // After setting light state, check if campfire effect should continue
      if (fire_flag) {
        simulateCampfire(device); // Continue campfire effect
      } else {
        // If fire flag is false, reset light state or perform other actions
      }
    });
  } else {
    // Reset light state or perform other actions if fire flag is false
  }
}