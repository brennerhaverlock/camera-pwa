const cameraControls = document.querySelector('.video-controls');
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const screenshot = document.querySelector('.save-image')
const buttons = [...cameraControls.querySelectorAll('button')];
const [play, pause, saveImage] = buttons;

let cameraOn = false;
let imageCapture;

var model = undefined;

cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
  });

// Start video when play button is clicked
play.onclick = () => {
  if (cameraOn == true) {
      video.play();
      return;
  } 

  // Check if camera exists. If it does, start video stream with set constraints
  if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.enumerateDevices()
    .then( devices => {
      const cameras = devices.filter( device => device.kind === 'videoinput');
      const camera = cameras[cameras.length - 1];

      const videoConstraints = {
        video: {
          deviceId: camera.deviceId,
          facingMode: 'environment'
        }
      }

      startVideo(videoConstraints);
    })
  } else {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerHTML += 'getUserMedia() is not supported by this browser.'
  }
}

// Function that starts the video stream with input constraints, then displays it on the page
const startVideo = async (constraints) => {
  if (!model) {
      return;
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const track = stream.getVideoTracks()[0]

  video.srcObject = stream;
  video.addEventListener('loadeddata', predictWebcam);

  track.applyConstraints({
    advanced: [{ torch: false }]
  })
  .catch( err => {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerHTML += err
  })
}

// const takePhoto = async () => {
//   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//   const track = stream.getVideoTracks()[0];
//   imageCapture = new imageCapture(track);

//   // const blob = await imageCapture.takePhoto({ fillLightMode: true });
//   // const imageBitmap = await createImageBitmap(blob);
//   // img.src = URL.createObjectURL(image)

//   imageCapture.takePhoto({
//     fillLightMode: true
//   })
//   .then( blob => {
//     console.log(blob)
//     createImageBitmap(blob)
//     .then( imageBitmap => {
//       img.src = URL.createObjectURL(image)
//     })
//   })
//   .catch( error => {
//     console.log(error)
//   })
// }

const takePhoto = () => {
  navigator.mediaDevices.getUserMedia({
    video: true
  })
  .then( stream => {
    video.srcObject = stream;

    const track = stream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);

    imageCapture.takePhoto({
      fillLightMode: true
    })
    .then( blob => {
      console.log(blob)
      createImageBitmap(blob)
      .then( image => {
        const url = URL.createObjectURL(image)
        console.log(image)
        img.src = URL.createObjectURL(image)
      })
    })
  })
  .catch( err => {
    console.log(err)
  })
}

// Pause video stream when pause button is clicked
pause.onclick = () => {
  video.pause();
}

// Save image when save image button is clicked
saveImage.onclick = () => {
  takePhoto();
  // canvas.width = video.videoWidth;
  // canvas.height = video.videoHeight;
  // canvas.getContext('2d').drawImage(video, 0, 0);
  // screenshot.src = canvas.toDataURL('image/png');
}

var children = [];

function predictWebcam() {
  // Now let's start classifying a frame in the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveVideo.removeChild(children[i]);
    }
    children.splice(0);
    
    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
            + (predictions[n].bbox[1] - 10) + 'px; width: ' 
            + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
            + predictions[n].bbox[1] + 'px; width: ' 
            + predictions[n].bbox[2] + 'px; height: '
            + predictions[n].bbox[3] + 'px;';

        liveVideo.appendChild(highlighter);
        liveVideo.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }
    
    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}