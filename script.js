const layoutUpload = document.getElementById("layout-upload");
const layout = document.getElementById("layout");
const fileName = document.getElementById("file-name");
const scaleButton = document.getElementById("scale-button");
const propButton = document.getElementById("prop-button");
const clearButton = document.getElementById("clear-button");
const propSelector = document.getElementById("prop-selector");
const propList = document.getElementById("prop-list");

var degToRotate = 0;

// Props
const singleBed = document.getElementById("single-bed");
const doubleBed = document.getElementById("double-bed");

const availableProps = [
    {
        name: 'Single Bed (120 cm)',
        element: singleBed,
        widthM: 1.2,
        lengthM: 2
    },
    {
        name: 'Double Bed (160 cm)',
        element: doubleBed,
        widthM: 1.6,
        lengthM: 2
    }
];
var props = [];

propSelector.addEventListener('click', (evt) => {
    propSelector.style.display = 'none';
});

clearButton.addEventListener('click', (evt) => {
    if(confirm('Are you sure you want to remove all props?')){
        props.forEach(prop => {
            prop.element.remove();
        });
        props = [];
    }
});

propButton.addEventListener('click', (evt) => {
    propList.innerHTML = '';
    availableProps.forEach(prop => {
        let el = document.createElement('span');
        el.innerHTML = prop.name;
        el.addEventListener('click', (evt) => { addProp(prop) });

        propList.appendChild(el);
    });
    propSelector.style.display = 'block';
});

var uploaded = false;
var measuring = false;
var scaleStart = null, scaleEnd = null;

var scale = {
    distPx: null,
    distM: null
};

scaleButton.addEventListener('click', (evt) => {
    scaleStart = null;
    scaleEnd = null;
    scale.distPx = null;
    scale.distM = null;
    
    if(!uploaded) {
        alert("No file uploaded");
        return;
    }
    measuring = true;
    layout.classList.add("measuring");
});

layout.addEventListener('click', (evt) => {
    if(measuring) {
        let mousePos = {x: evt.x, y: evt.y};
        if(scaleStart == null){
            scaleStart = mousePos;
        }else if(scaleEnd == null) {
            measuring = false;
            layout.classList.remove("measuring");
            scaleEnd = mousePos;
            let wSq2 = Math.pow(Math.abs(scaleEnd.x - scaleStart.x), 2);
            let hSq2 = Math.pow(Math.abs(scaleEnd.y - scaleStart.y), 2);
            let dist = Math.sqrt(wSq2 + hSq2);
            scale.distPx = dist;
            let lengthM = null;
            while(isNaN(lengthM) || lengthM === null) {
                if(lengthM !== null) alert("Length was not a number. Use a decimal dot, i.e 1.5 or 3.7");
                lengthM = parseFloat(prompt('Length in meters:'));
            }
            scale.distM = lengthM;
            rescale();
        }
    }
});

layoutUpload.addEventListener('change', (evt) => {
    const files = evt.target.files;
    const layoutImg = files[0];
    uploadLayout(layoutImg);
});

const dropArea = document.getElementById('upload-area');

dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
});

dropArea.addEventListener('drop', (evt) => {
  evt.stopPropagation();
  evt.preventDefault();

    var file = null;

    // If browser supports DataTransferItemList
    if (evt.dataTransfer.items) {
        if(evt.dataTransfer.items[0].kind === 'file') {
            file = evt.dataTransfer.items[0].getAsFile();
        }
    } else {
        // Otherwise, DataTransfer's `files` property is used instead
        file = evt.dataTransfer.files[0];
    }

    if(file != null){
        uploadLayout(file);
    }
});

function uploadLayout(file){
    var reader = new FileReader();
    reader.onloadend = function() {
        layout.style.backgroundImage = `url('${reader.result}')`;        
    }
    if(file){
        reader.readAsDataURL(file);
        fileName.innerHTML = file.name ? file.name : "UNKNOWN";
        uploaded = true;
        scaleButton.style.display = "inline-block";
    } else {
        alert("No image");
    }
}

function rescale() {
    if(scale.distPx != null && scale.distM != null) {
        console.log('Rescaling...');
        let scaleFactor = scale.distPx / scale.distM;
        props.forEach((prop) => {
            prop.element.style.width = `${prop.widthM * scaleFactor}px`;
            prop.element.style.height = `${prop.lengthM * scaleFactor}px`;
        });
    }
}

function addProp(prop) {
    let clonedProp = Object.assign({}, prop);
    let el = prop.element.cloneNode(true);
    clonedProp.element = el;
    dragElement(el);
    el.rotation = 0;
    props.push(clonedProp);
    layout.appendChild(el);
    rescale();
}

function rotate(el) {
    let currRotation = el.rotation || 0;
    let deg = currRotation + degToRotate;
    el.style.transform = `rotate(${deg}deg)`;
    el.rotation = deg;
    degToRotate = 0;
}

document.body.addEventListener('keydown', (e) => {
    let deg = null;
    switch(e.code){
        case "KeyA": deg = -10; break;
        case "KeyD": deg = 10; break;
        case "KeyW": deg = 90; break;
        case "KeyS": deg = -90; break;
    }
    if(deg != null) {
        degToRotate = deg;
    }
});

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

        if(degToRotate){
            rotate(elmnt);
        }
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}