const uploadLayoutInput = document.getElementById("upload-layout");
const uploadLayoutButton = document.getElementById("upload-layout-button");
const scaleInfo = document.getElementById("scale-info");
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
const addCustomProp = document.getElementById("add-custom-prop");
const removeCustomProp = document.getElementById("remove-custom-prop");
const customPropDialog = document.getElementById("custom-prop-dialog");
const customPropForm = document.getElementById("custom-prop-form");
const action = document.getElementById("action");
const measuringPoint = document.getElementById("measuring-point");
const measurementLength = document.getElementById("measurement-length");
const canvas = document.getElementById("canvas");
const downloadButton = document.getElementById("download-model-button");

var activePropElement = null;

// Props
const singleBed = document.getElementById("single-bed");
const doubleBed = document.getElementById("double-bed");
const bookshelf80 = document.getElementById("billy-80");
const bookshelf40 = document.getElementById("billy-40");
const sofa = document.getElementById("sofa");
const dinnerTable = document.getElementById("dinner-table");

const defaultProps = [
    {
        name: 'Single Bed',
        element: singleBed,
        widthM: 1.2,
        lengthM: 2,
        id: "single-bed-120",
        default: true
    },
    {
        name: 'Double Bed',
        element: doubleBed,
        widthM: 1.6,
        lengthM: 2,
        id: "double-bed-160",
        default: true
    },
    {
        name: 'Bookshelf',
        element: bookshelf80,
        widthM: 0.8,
        lengthM: 0.28,
        id: "bookshelf-80x28",
        default: true
    },
    {
        name: 'Bookshelf',
        element: bookshelf40,
        widthM: 0.4,
        lengthM: 0.28,
        id: "bookshelf-40x28",
        default: true
    },
    {
        name: 'Sofa',
        element: sofa,
        widthM: 2.18,
        lengthM: 0.88,
        id: "sofa-2-seat",
        default: true
    },
    {
        name: 'Dinner Table',
        element: dinnerTable,
        widthM: 1.4,
        lengthM: 1,
        id: "dinner-table-140x100",
        default: true
    }
];
var customProps = [];
var customPropMaxID = 0;

var propDeleteMode = false;

var placedDefaultProps = [];
var placedCustomProps = [];
var path = [];

var propFiles = [];
var layoutFile = null;
var layoutImageUrl = null;

// Set default prop titles
document.addEventListener('DOMContentLoaded', () => {
    defaultProps.forEach(prop => {
        prop.element.title = getPropTitle(prop);
    });
});

propSelector.addEventListener('click', (evt) => {
    if(
        !(
            evt.target.classList.contains("add-custom-prop")
            || evt.target.classList.contains("remove-custom-prop")
        )
        && !customPropDialogShowing
        && !propDeleteMode
    ){
        closePropSelector();
    }
        
});

uploadLayoutButton.addEventListener('click', (evt) => {
    uploadLayoutInput.click();
});

clearButton.addEventListener('click', (evt) => {
    if(confirm('Are you sure you want to remove all props?')) {
        allProps().forEach(prop => {
            clearPropElement(prop.element);
        });
        placedDefaultProps = [];
        placedCustomProps = [];
    }
});

customPropForm.addEventListener('submit', evt => {
    evt.preventDefault();
    const name = document.getElementById("custom-prop-name").value;
    const imgUrl = document.getElementById("custom-prop-img-url").value;
    const imgName = document.getElementById("custom-prop-img-name").value;
    const color = imgUrl == "" ? document.getElementById("custom-prop-color").value : null;
    const widthM = document.getElementById("custom-prop-width").value;
    const lengthM = document.getElementById("custom-prop-length").value;
    
    createCustomProp(name, widthM, lengthM, color, imgName, imgUrl);

    closeCustomPropDialog();
    closePropSelector();
});

function createCustomProp(name, widthM, lengthM, color, imgName, imgUrl) {
    let el = document.createElement('div');
    const dateStamp = Date.now(); 
    let customProp = {
        name: name,
        element: el,
        widthM: widthM,
        lengthM: lengthM,
        id: `${customPropMaxID}-${dateStamp}`
    }
    customPropMaxID++;

    if(imgUrl) {
        const url = `url('${imgUrl}')`;
        el.style.backgroundImage = url;
        el.style.backgroundColor = "white";
        customProp.imageName = imgName;
        customProp.imageUrl = url;
    }
    else if(color) {
        el.style.backgroundColor = color;
        customProp.color = color;
    }
    
    el.draggable = true;
    el.title = getPropTitle(customProp);
    el.classList.add("prop");
    customProps.push(customProp);
    return customProp;
}

propButton.addEventListener('click', (evt) => {
    setPropDeleteMode(false);
    propList.innerHTML = '';
    const allAvailableProps = [...defaultProps, ...customProps];
    allAvailableProps.forEach(prop => {
        let el = document.createElement('span');
        el.innerHTML = getPropTitle(prop);
        if(defaultProps.includes(prop)) {
            el.classList.add("default-prop");
        } else {
            el.classList.add("custom-prop");
            el.id = `plcp-${prop.id}`;
        }
        el.addEventListener('click', (evt) => { addOrRemoveProp(prop) });

        propList.appendChild(el);
    });
    const addCustomPropClone = addCustomProp.cloneNode(true);
    const removeCustomPropClone = removeCustomProp.cloneNode(true);
    addCustomPropClone.addEventListener('click', evt => { openCustomPropDialog() });
    removeCustomPropClone.addEventListener('click', evt => { setPropDeleteMode(!propDeleteMode) });
    propList.appendChild(addCustomPropClone);
    propList.appendChild(removeCustomPropClone);
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
        const pos = {
            x: mousePos.x - layoutContainer.offsetLeft,
            y: mousePos.y - layoutContainer.offsetTop
        };
        addMeasuringPoint(pos);
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

uploadLayoutInput.addEventListener('change', async (evt) => {
    const files = evt.target.files;
    const layoutImg = files[0];
    uploadLayout(layoutImg);
});

customPropUpload.addEventListener('change', async (evt) => {
    const files = evt.target.files;
    const propImg = files[0];
    propFiles.push(propImg);
    uploadFile(propImg).then(imgUrl => {
        document.getElementById("custom-prop-img-url").value = imgUrl;
        document.getElementById("custom-prop-img-name").value = propImg.name;
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
    layoutFile = file;
    uploadFile(file).then(imgUrl => {
        layoutImageUrl = imgUrl;
        setLayoutDimensions(imgUrl);
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

function allProps() {
    return [...placedDefaultProps, ...placedCustomProps];
}

function rescale() {
    if(scale.distPx != null && scale.distM != null) {
        console.log('Rescaling...');
        updateScaleInfo();
        allProps().forEach(prop => {
            prop.element.style.width = `${scaleMToPx(prop.widthM)}px`;
            prop.element.style.height = `${scaleMToPx(prop.lengthM)}px`;
        });
        calculatePath();
    }
}

function updateScaleInfo() {
    const scl = scalePxToM(1 / scale.distPx);
    let pfScl = scl;
    const units = ["m", "dm", "cm", "mm"];
    let i = 0;
    while(pfScl < 0.1 && i < units.length - 1) {
        pfScl *= 10;
        i++;
    }
    scaleInfo.innerHTML = `1:${Math.round(pfScl * 10) / 10} ${units[i]}`;
}

function addOrRemoveProp(prop) {
    if(propDeleteMode)
        removeProp(prop);
    else
        addProp(prop);
}

function removeProp(prop) {
    // Only allow removal of custom props
    if(customProps.includes(prop)) {
        // Remove all placed instances
        const placed = placedCustomProps.filter(p => p.id == prop.id);
        placed.map(p => { clearPropElement(p.element) });
        placedCustomProps = placedCustomProps.filter(pcp => { return !placed.find(p => { p.id == pcp.id}) });

        // Remove the prop
        customProps = customProps.filter(p => p.id != prop.id);

        // Remove the option from the prop list, if found
        const propListEntry = document.getElementById(`plcp-${prop.id}`);
        if(propListEntry)
            propListEntry.remove();
    }
}

function addProp(prop) {
    let clonedProp = Object.assign({}, prop);
    let el = prop.element.cloneNode(true);
    clonedProp.element = el;
    dragElement(el);
    el.rotation = 0;
    
    if(prop.default)
        placedDefaultProps.push(clonedProp);
    else
        placedCustomProps.push(clonedProp);

    layout.appendChild(el);
    rescale();
    return el;
}

function addMeasuringPoint(pos) {
    const point = {
        element: measuringPoint
    };
    let clonedPoint = Object.assign({}, point);
    let el = point.element.cloneNode(true);
    layout.appendChild(el);
    move(el, pos.x - el.offsetWidth / 2, pos.y - el.offsetHeight / 2);
    clonedPoint.element = el;
    dragElement(el);
    path.push(clonedPoint);
    clonedPoint.element.classList.add("last-point");
    if(path.length > 1) {
        path[path.length - 2].element.classList.remove("last-point");
    }
    calculatePath();
}

function rotate(el, degToRotate) {
    let currRotation = el.rotation || 0;
    let deg = currRotation + degToRotate;
    el.style.transform = `rotate(${deg}deg)`;
    el.rotation = deg;
}

document.body.addEventListener('keydown', (e) => {
    let deg = null;
    let del = false;
    switch(e.code){
        case "KeyA": deg = -10; break;
        case "KeyD": deg = 10; break;
        case "KeyW": deg = 90; break;
        case "KeyS": deg = -90; break;
        case "Delete":
        case "Escape": del = true; break;
    }
    if(activePropElement) {
        if(deg != null)
            rotate(activePropElement, deg);
        if(del) {
            clearPropElement(activePropElement);
            activePropElement = null;
        }
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
    downloadButton.disabled = true;
    action.innerHTML = "Scaling";
    action.classList.add("active");
    layout.classList.add("scaling");
}

function stopScaling() {
    scaling = false;
    downloadButton.disabled = false;
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
        activePropElement = elmnt.classList.contains("prop") ? elmnt : null;
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
        move(elmnt, elmnt.offsetLeft - pos1, elmnt.offsetTop - pos2);

        if(elmnt.classList.contains("measuring-point")){
            calculatePath();
        }
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        activePropElement = null;
    }
}

function move(el, x, y) {
    el.x = x;
    el.y = y;
    el.midx = el.x + el.offsetWidth / 2;
    el.midy = el.y + el.offsetHeight / 2;
    el.style.top = el.y + "px";
    el.style.left = el.x + "px";
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
    document.getElementById("custom-prop-img-name").value = null;
}

function setPropDeleteMode(isActive) {
    propDeleteMode = isActive;
    if(propDeleteMode)
        propList.classList.add("remove-mode");
    else
        propList.classList.remove("remove-mode");
}

function clearPropElement(el) {
    el.remove();
}

function closePropSelector() {
    propSelector.style.display = 'none';
}

function getPropTitle(prop) {
    return `${prop.name} (${prop.widthM}x${prop.lengthM} m)`;
}

function setLayoutDimensions(url) {
    const image = new Image();
    image.src = url;
    // Height is automatically maxed
    layoutHeight = layout.clientHeight;
    // Get width from height divided by the height to width factor of the original image
    layoutWidth = layoutHeight / (image.height / image.width);
}