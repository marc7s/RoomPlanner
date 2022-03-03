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
            if(model.customProps) await parseCustomProps(files, model.customProps);
            if(model.placedDefaultProps) parseDefaultProps(model.placedDefaultProps);
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
    downloadButton.disabled = false;
    scale.distPx = parseInt(scl.distPx);
    scale.distM = parseFloat(scl.distM);
    rescale();
}

async function parseCustomProps(files, props) {
    props.forEach(async prop => {
        const customProp = customProps.find(p => p.id == prop.id);
        if(customProp) {
            console.log(`Custom prop with ID ${prop.id} already added to model, skipping...`);
        } else {
            let imgName = null;
            let color = null;
            if(prop.imageName)
                imgName = prop.imageName;
            else if(prop.color)
                color = prop.color;

            
            const propImage = files.find(file => file.filename == imgName);
            let imgUrl = null;
            if(propImage) {
                const propImageFile = await propImage.getData(new zip.BlobWriter());
                propFile = propImageFile;
                propFile.name = propImage.filename;
                propFiles.push(propFile);
                imgUrl = await uploadFile(propFile);
            } else if(imgName) {
                console.error(`Error, could not find image: ${imgName}`);
            }
            
            
            const customProp = createCustomProp(prop.name, prop.widthM, prop.lengthM, color, imgName, imgUrl);
            prop.placed.forEach(placed => {
                const el = addProp(customProp);
                move(el, xp2x(placed.xp), yp2y(placed.yp));
                rotate(el, placed.rotation);
            });
        }
    });
}

function parseDefaultProps(props) {
    props.forEach(prop => {
        const defaultProp = defaultProps.find(p => p.id == prop.id);
        if(defaultProp) {
            const el = addProp(defaultProp);
            move(el, xp2x(prop.xp), yp2y(prop.yp));
            rotate(el, prop.rotation);
        } else {
            console.error(`Error, could not find default prop with id ${prop.id}`);
        }
    });
}

function parsePath(path) {
    path.forEach(point => {
        if(!point.hasOwnProperty('xp') || !point.hasOwnProperty('yp')) throw new Error("Cannot parse path, invalid point data");
        const parsedPos = {
            x: xp2x(point.xp),
            y: yp2y(point.yp)
        };
        addMeasuringPoint(parsedPos);
    });
}

function xp2x(xp) {
    return (layoutContainer.clientWidth - layoutWidth) / 2 + xp2px(parseFloat(xp));
}

function yp2y(yp) {
    return yp2px(parseFloat(yp));
}

function xp2px(xp) {
    return xp * layoutWidth;
}

function yp2px(yp) {
    return yp * layoutHeight;
}