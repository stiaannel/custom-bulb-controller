const {ipcRenderer} = require('electron');
let devices = [];

const content = document.getElementById('content');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
loaderText

ipcRenderer.on('devices_found', (event, data) => {
  console.log(data);
  devices.push(data);
  select = document.getElementById('device')
  var opt = document.createElement('option');
  opt.value = data.ip;
  opt.innerHTML = `${data.name}@${data.ip}`;
  select.appendChild(opt);
  document.getElementById('powerToggle').checked = data.state.on_off
  document.getElementById("brightness").value = data.state.brightness;
  loader.classList.add("hidden")
  content.classList.remove("hidden");
});

ipcRenderer.on('version', (event, data) => {
  console.log(data);
  console.log(`You are running version: ${data.ver}`);
  document.querySelectorAll("#ver").forEach((e) => {
    e.innerText = `v${data.ver}`
  });
});

document.getElementById('closer').addEventListener('click', () => {
  ipcRenderer.send('close');
});

document.getElementById('spectrum').addEventListener('click', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('spectrum', createPayload(ip));
})

document.getElementById('powerToggle').addEventListener('click', () => {
  state = document.getElementById('powerToggle').checked
  ip = document.getElementById("device").value
  ipcRenderer.send('powerToggle', createPayload(state));
})

// document.getElementById('fireplace').addEventListener('click', () => {
//   ip = document.getElementById("device").value
//   ipcRenderer.send('fireplace', createPayload(ip));
// })

// document.getElementById('candlelight').addEventListener('click', () => {
//   ip = document.getElementById("device").value
//   ipcRenderer.send('candlelight', createPayload(ip));
// })


document.getElementById("brightness").addEventListener('change', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('brightness_update', createPayload(ip));
})

document.getElementById("temp").addEventListener('change', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('brightness_update', createPayload(ip));
})


ipcRenderer.on('color_changed', (event, data) => {
  if (data < 360) {
    document.querySelector("#indicator").classList.remove("hidden");
    document.querySelector("#indicator").style.backgroundColor = `hsl(${data}, 100%, 50%)`
  } else {
    document.querySelector("#indicator").classList.add("hidden");
    document.querySelector("#indicator").style.backgroundImage = ""
    document.querySelector("#indicator").style.background = ""
    document.querySelector("#indicator").style.backgroundColor = ""
  }
});

function createPayload(powerState) {
  return {
    ip: document.getElementById("device").value,
    state: powerState,
    payload: {
      on_off: 1, 
      brightness: parseInt(document.getElementById("brightness").value),
      hue: 0, //0-360
      saturation: 0, // 0-100
      color_temp: parseInt(document.getElementById("temp").value) // Warm2640 Cold9000 (6000 = white)
    }
  }
}

const mayday = setInterval(() => {
  if (devices.length > 0) clearInterval(mayday);
  loaderText.innerText = "This is taking longer than expected. \nPlease ensure that all your devices are online. \nWe'll keep looking. 👀"
}, 10000);
