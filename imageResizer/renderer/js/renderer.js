const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

// console.log(versions.node())


const loadImage = (event) => {
  const file = event.target.files[0];

  if (!isFileImage(file)) {
    alertError('Please select an image.');
    return;
  };

  // Get original dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  }

  form.style.display = 'block';
  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), 'imageresizer')
};

//Send Image Data to main
const sendImage = (event) => {
  event.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  if(!img.files[0]){
    alertError('Please upload an image.')
    return;
  };

  if(width === '' || height === ''){
    alertError('Please fill in a height and width.')
    return;
  };

  // Send to main using ipcRenderer (included to Electron)
  ipcRenderer.send('image:resize', {
    imgPath,
    width,
    height,
  })
};

// Catch the image:done event
ipcRenderer.on('image:done', () => {
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`)
})

// Make Sure file is image
const isFileImage = (file) => {
  const acceptedImageTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/jpg'];
  return file && acceptedImageTypes.includes(file['type']);
};

const alertError = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    }
  })
};

const alertSuccess = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    }
  })
};

img.addEventListener('change', loadImage);
form.addEventListener('submit', sendImage)