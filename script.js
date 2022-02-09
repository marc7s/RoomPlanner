const layoutUpload = document.getElementById("layout-upload");
const customPropUpload = document.getElementById("custom-prop-upload");
const layout = document.getElementById("layout");
const layoutContainer = document.getElementById("layout-container");
const fileName = document.getElementById("file-name");
const scaleButton = document.getElementById("scale-button");
const propButton = document.getElementById("prop-button");
const measureButton = document.getElementById("measure-button");
const clearButton = document.getElementById("clear-button");
const propSelector = document.getElementById("prop-selector");
const propList = document.getElementById("prop-list");
const addNewProp = document.getElementById("add-new-prop");
const customPropDialog = document.getElementById("custom-prop-dialog");
const customPropForm = document.getElementById("custom-prop-form");
const action = document.getElementById("action");
const measuringPoint = document.getElementById("measuring-point");
const measurementLength = document.getElementById("measurement-length");
const canvas = document.getElementById("canvas");

var degToRotate = 0;

// Props
const singleBed = document.getElementById("single-bed");
const doubleBed = document.getElementById("double-bed");
const bookshelf80 = document.getElementById("billy-80");
const bookshelf40 = document.getElementById("billy-40");
const sofa = document.getElementById("sofa");
const dinnerTable = document.getElementById("dinner-table");

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
    },
    {
        name: 'Bookshelf (80x28 cm)',
        element: bookshelf80,
        widthM: 0.8,
        lengthM: 0.28
    },
    {
        name: 'Bookshelf (40x28 cm)',
        element: bookshelf40,
        widthM: 0.4,
        lengthM: 0.28
    },
    {
        name: 'Sofa',
        element: sofa,
        widthM: 2.18,
        lengthM: 0.88
    },
    {
        name: 'Dinner Table',
        element: dinnerTable,
        widthM: 1.4,
        lengthM: 1
    }
];
var props = [];
var path = [];

propSelector.addEventListener('click', (evt) => {
    if(!evt.target.classList.contains("add-new-prop") && !customPropDialogShowing)
        closePropSelector();
});

clearButton.addEventListener('click', (evt) => {
    if(confirm('Are you sure you want to remove all props?')){
        props.forEach(prop => {
            prop.element.remove();
        });
        props = [];
    }
});

customPropForm.addEventListener('submit', evt => {
    evt.preventDefault();
    let el = document.createElement('div');
    const name = document.getElementById("custom-prop-name").value;
    const imgUrl = document.getElementById("custom-prop-img-url").value;
    const color = document.getElementById("custom-prop-color").value;
    if(imgUrl)
        el.style.backgroundImage = `url('${imgUrl}')`;
    else
        el.style.backgroundColor = color;
    
    el.draggable = true;
    el.title = name;
    el.classList.add("prop");
    availableProps.push({
        name: name,
        element: el,
        widthM: document.getElementById("custom-prop-width").value,
        lengthM: document.getElementById("custom-prop-length").value
    });

    closeCustomPropDialog();
    closePropSelector();
});

propButton.addEventListener('click', (evt) => {
    propList.innerHTML = '';
    availableProps.forEach(prop => {
        let el = document.createElement('span');
        el.innerHTML = prop.name;
        el.addEventListener('click', (evt) => { addProp(prop) });

        propList.appendChild(el);
    });
    const addNewPropClone = addNewProp.cloneNode(true);
    addNewPropClone.addEventListener('click', evt => { openCustomPropDialog() });
    propList.appendChild(addNewPropClone);
    propSelector.style.display = 'block';
});

measureButton.addEventListener('click', (evt) => {
    measuring ? stopMeasuring() : startMeasuring();
});

var uploaded = false;
var scaling = false;
var measuring = false;
var customPropDialogShowing = false;
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
    if(measuring)
        stopMeasuring();
    
    startScaling();

});

layout.addEventListener('click', (evt) => {
    let mousePos = {x: evt.x, y: evt.y};

    if(evt.target.classList.contains("measuring-point")) // Clicked a measuring point
        return;

    if(measuring) {
        let point = {
            element: measuringPoint
        }
        addMeasuringPoint(point, mousePos);
    }
    else if(scaling) {
        if(scaleStart == null){
            scaleStart = mousePos;
        }else if(scaleEnd == null) {
            stopScaling();
            scaleEnd = mousePos;
            let dist = distBetween(scaleStart.x, scaleStart.y, scaleEnd.x, scaleEnd.y);
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

layoutUpload.addEventListener('change', async (evt) => {
    const files = evt.target.files;
    const layoutImg = files[0];
    uploadLayout(layoutImg);
});

customPropUpload.addEventListener('change', async (evt) => {
    const files = evt.target.files;
    const propImg = files[0];
    uploadFile(propImg).then(imgUrl => {
        document.getElementById("custom-prop-img-url").value = imgUrl;
    });
});

const dropArea = document.getElementById('upload-area');

dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
});

dropArea.addEventListener('drop', async (evt) => {
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

function uploadLayout(file) {
    uploadFile(file).then(imgUrl => {
        layout.style.backgroundImage = `url('${imgUrl}')`;
        fileName.innerHTML = file.name ? file.name : "UNKNOWN";
        uploaded = true;
        scaleButton.style.display = "inline-block";
    });   
}

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onloadend = function() {
            resolve(reader.result);
        }
        if(file){
            reader.readAsDataURL(file);
        } else {
            alert("No image");
            reject();
        }
    });
}

function rescale() {
    if(scale.distPx != null && scale.distM != null) {
        console.log('Rescaling...');
        props.forEach((prop) => {
            prop.element.style.width = `${scaleMToPx(prop.widthM)}px`;
            prop.element.style.height = `${scaleMToPx(prop.lengthM)}px`;
        });
        calculatePath();
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

function addMeasuringPoint(point, mousePos) {
    let clonedPoint = Object.assign({}, point);
    let el = point.element.cloneNode(true);
    layout.appendChild(el);
    let x = mousePos.x - layoutContainer.offsetLeft - (el.offsetWidth / 2);
    let y = mousePos.y - layoutContainer.offsetTop - (el.offsetHeight / 2);
    el.midx = x + el.offsetWidth / 2;
    el.midy = y + el.offsetHeight / 2;
    el.x = x;
    el.y = y;
    el.style.left = `${el.x}px`;
    el.style.top = `${el.y}px`;
    clonedPoint.element = el;
    dragElement(el);
    path.push(clonedPoint);
    clonedPoint.element.classList.add("last-point");
    if(path.length > 1) {
        path[path.length - 2].element.classList.remove("last-point");
    }
    calculatePath();
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

function clearPath() {
    clearPathLines();
    path.forEach(p => {
        p.element.remove();
    });
    path = [];
}

function calculatePath() {
    clearPathLines();
    if(path.length > 1){
        for(let i = 1; i < path.length; i++){
            const point = path[i];
            const prevPoint = path[i - 1];
            const length = distBetween(point.element.midx, point.element.midy, prevPoint.element.midx, prevPoint.element.midy);
            
            let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
            newLine.classList.add("pathLine");
            newLine.setAttribute('x1', prevPoint.element.midx);
            newLine.setAttribute('y1', prevPoint.element.midy);
            newLine.setAttribute('x2', point.element.midx);
            newLine.setAttribute('y2', point.element.midy);
            canvas.appendChild(newLine);

            if(scale.distM && scale.distPx){
                let midx = (prevPoint.element.midx + point.element.midx) / 2;
                let midy = (prevPoint.element.midy + point.element.midy) / 2;
    
                let measurementLabel = measurementLength.cloneNode(true);
                measurementLabel.innerHTML = `${round(scalePxToM(length))} m`;
                layout.appendChild(measurementLabel);
                measurementLabel.style.left = midx - measurementLabel.offsetWidth / 2;
                measurementLabel.style.top = midy - measurementLabel.offsetHeight / 2;
            }
        }
    }   
}

function round(x) {
    return Math.round(x * 10) / 10;
}

function scaleMToPx(x) {
    let scaleFactor = scale.distPx / scale.distM;
    return x * scaleFactor;
}

function scalePxToM(x) {
    let scaleFactor = scale.distM / scale.distPx;
    return x * scaleFactor;
}

function clearPathLines() {
    document.querySelectorAll(".pathLine").forEach(line => line.remove());
    document.querySelectorAll(".measurement-length").forEach(el => el.remove());
}

function startScaling() {
    scaling = true;
    action.innerHTML = "Scaling";
    action.classList.add("active");
    layout.classList.add("scaling");
}

function stopScaling() {
    scaling = false;
    action.innerHTML = "";
    action.classList.remove("active");
    layout.classList.remove("scaling");
}

function startMeasuring() {
    measuring = true;
    measureButton.innerHTML = "End measurement";
    action.innerHTML = "Measuring";
    action.classList.add("active");
    layout.classList.add("measuring");
    clearPath();
}

function stopMeasuring() {
    measuring = false;
    measureButton.innerHTML = "New measurement";
    action.innerHTML = "";
    action.classList.remove("active");
    layout.classList.remove("measuring");
}

function distBetween(p1x, p1y, p2x, p2y) {
    let wSq2 = Math.pow(Math.abs(p2x - p1x), 2);
    let hSq2 = Math.pow(Math.abs(p2y - p1y), 2);
    return Math.sqrt(wSq2 + hSq2);
}

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
        elmnt.x = elmnt.offsetLeft - pos1;
        elmnt.y = elmnt.offsetTop - pos2;
        elmnt.midx = elmnt.x + elmnt.offsetWidth / 2;
        elmnt.midy = elmnt.y + elmnt.offsetHeight / 2;
        elmnt.style.top = elmnt.y + "px";
        elmnt.style.left = elmnt.x + "px";

        if(elmnt.classList.contains("measuring-point")){
            calculatePath();
        }

        if(elmnt.classList.contains("prop") && degToRotate){
            rotate(elmnt);
        }
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function openCustomPropDialog() {
    customPropDialog.classList.add("active");
    customPropDialogShowing = true;
}

function closeCustomPropDialog() {
    customPropDialog.classList.remove("active");
    customPropDialogShowing = false;
    document.getElementById("custom-prop-name").value = null;
    document.getElementById("custom-prop-width").value = null;
    document.getElementById("custom-prop-length").value = null;
    document.getElementById("custom-prop-upload").value = null;
    document.getElementById("custom-prop-img-url").value = null;
}

function closePropSelector() {
    propSelector.style.display = 'none';
}