var layoutWidth = null;
var layoutHeight = null;

async function parseModelJson(files) {
    try {
        const modelJson = files.find(file => file.filename == "model.json");
        if(!modelJson) throw new Error("Model config not found");
        const model = await modelJson.getData(new zip.TextWriter()).then(data => JSON.parse(data));
        console.log(model);
        if(model.plan) {
            await parsePlan(files, model.plan);
            if(model.scale) parseScale(model.scale);
            if(model.path) parsePath(model.path);
        }
         
    } catch(error) {
        console.error("Model Parse: " + error);
        alert(error);
    }
}

async function parsePlan(files, plan) {
    const layoutImage = files.find(file => file.filename == plan);
    const layoutImageFile = await layoutImage.getData(new zip.BlobWriter());
    layoutFile = layoutImageFile;
    layoutFile.name = layoutImage.filename;
    const layoutUrl = await uploadFile(layoutFile);
    layoutImageUrl = layoutUrl;
    setLayoutDimensions(layoutUrl);
    uploadLayout(layoutFile);
}

function parseScale(scl) {
    if(!scl.distPx || !scl.distM) throw new Error("Cannot parse scale, invalid scale data");
    scale.distPx = parseInt(scl.distPx);
    scale.distM = parseFloat(scl.distM);
    rescale();
}

function parsePath(path) {
    path.forEach(point => {
        if(!point.hasOwnProperty('xp') || !point.hasOwnProperty('yp')) throw new Error("Cannot parse path, invalid point data");
        const parsedPos = {
            x: (layoutContainer.clientWidth - layoutWidth) / 2 + xp2px(parseFloat(point.xp)),
            y: yp2px(parseFloat(point.yp))
        };
        addMeasuringPoint(parsedPos);
    });
}

function xp2px(xp) {
    return xp * layoutWidth;
}

function yp2px(yp) {
    return yp * layoutHeight;
}

function setLayoutDimensions(url) {
    const image = new Image();
    image.src = url;
    // Height is automatically maxed
    layoutHeight = layout.clientHeight;
    // Get width from height divided by the height to width factor of the original image
    layoutWidth = layoutHeight / (image.height / image.width);
}