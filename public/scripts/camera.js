const cameraControls = document.querySelector('.video-controls');
const video = document.querySelector('video');
const img = document.querySelector('img');
const screenshot = document.querySelector('.save-image')
const buttons = [...cameraControls.querySelectorAll('button')];
const [play, pause, saveImage] = buttons;

let cameraOn = false;
let imageCapture;
let model = undefined;
let children = [];

// Load coco-ssd (object detection model) 
cocoSsd.load()
.then( loadedModel => {
  model = loadedModel;
  document.getElementById('information').innerHTML = 'Model has been loaded! You can now start the camera.'
})

// Function that starts the video stream with input constraints, then displays it on the page
const startVideo = async (constraints) => {
  // Ensure model is loaded before allowing video stream to start
  if (!model) {
      return;
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const track = stream.getVideoTracks()[0]

  video.srcObject = stream;
  video.setAttribute("playsinline", true);
  video.addEventListener('loadeddata', predictWebcam);

  // Turn on flashlight
  track.applyConstraints({
    advanced: [{ torch: true }]
  })
  .catch( err => {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerHTML += err
  })
}

// Function that can take a full resolution photo with the camera
const takePhoto = () => {
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

    navigator.mediaDevices.getUserMedia(videoConstraints)
    .then( stream => {
      video.srcObject = stream;
      const track = stream.getVideoTracks()[0];

      // Create new ImageCapture object which can be used to take a full resolution photo
      imageCapture = new ImageCapture(track);

      imageCapture.takePhoto()
      .then( blob => {
        img.src = URL.createObjectURL(blob); // Display captured photo in image tag on main page

      })
      .catch( error => {
        console.log(error)
      })
    })
  })
}

// Draws a frame around the subject based on confidence score returned by tensorflow
const predictWebcam = () => {
  // Now let's start classifying a frame in the stream.
  model.detect(video)
  .then( predictions => {
    for (let i = 0; i < children.length; i++) {
      liveVideo.removeChild(children[i]);
    }
    children.splice(0);

    // Loop through predictions and draw them to the live view if they
    // have a high confidence score
    for (let n = 0; n < predictions.length; n++ ) {
      if(predictions[n].score > 0.66) {
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
          facingMode: 'environment',
        }
      }

      startVideo(videoConstraints);
    })
  } else {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.innerHTML += 'getUserMedia() is not supported by this browser.'
  }
}

// Pause video stream when pause button is clicked
pause.onclick = () => {
  setTimeout( () => {
    video.pause();
  }, 2000)
}

// Save image when save image button is clicked
saveImage.onclick = () => {
  takePhoto();
}