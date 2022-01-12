const {ipcRenderer} = require('electron');
// const toastr = require('toastr');
// const { content } = require('tailwindcss/defaultTheme');
let devices = [];

const content = document.getElementById('content');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
loaderText

ipcRenderer.on('devices_found', (event, data) => {
  console.log(data);
  devices.push(data);
  // toastr.success("New Device Found!", `${data.name} On IP: ${data.ip}`)
  select = document.getElementById('device')
  var opt = document.createElement('option');
  opt.value = data.ip;
  opt.innerHTML = `${data.name}@${data.ip}`;
  select.appendChild(opt);
  toggleSwitch(data.state.on_off);
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

document.getElementById('off').addEventListener('click', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('light_off', createPayload(ip));
  toggleSwitch(0);
})

document.getElementById('on').addEventListener('click', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('light_on', createPayload(ip));
  toggleSwitch(1);
})

document.getElementById("brightness").addEventListener('change', () => {
  ip = document.getElementById("device").value
  ipcRenderer.send('brughtness_update', createPayload(ip));
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

function toggleSwitch(a) {
  switch(Boolean(a)) {
    case true: 
      document.getElementById('on').classList.remove('bg-green-500');
      document.getElementById('on').classList.add('bg-green-500');
      document.getElementById('off').classList.add('bg-red-900');
      document.getElementById('off').classList.remove('bg-red-500');
      break;
    case false: 
      document.getElementById('on').classList.remove('bg-green-500');
      document.getElementById('on').classList.add('bg-green-900');
      document.getElementById('off').classList.add('bg-red-500');
      document.getElementById('off').classList.remove('bg-red-900');
  }
}

function createPayload() {
  return {
    ip: document.getElementById("device").value,
    payload: {
      on_off: 1, 
      brightness: parseInt(document.getElementById("brightness").value),
      hue: 0, //0-360
      saturation: 0, // 0-100
      color_temp: 6000 // Warm2640 Cold9000 (6000 = white)
    }
  }
}

const mayday = setInterval(() => {
  if (devices.length > 0) clearInterval(mayday);
  loaderText.innerText = "This is taking longer than expected. \nPlease ensure that all your devices are online. \nWe'll keep looking. 👀"
}, 10000);
