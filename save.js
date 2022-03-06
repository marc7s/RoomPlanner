(() => {

	const saver = (() => {

		let zipWriter;
		return {
			addFile(file, options) {
				if (!zipWriter) {
					zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
				}
				return zipWriter.add(file.name, new zip.BlobReader(file), options);
			},
			async getBlobURL() {
				if (zipWriter) {
					const blobURL = URL.createObjectURL(await zipWriter.close());
					zipWriter = null;
					return blobURL;
				} else {
					throw new Error("Zip file closed");
				}
			}
		};

	})();

	(() => {
		downloadButton.addEventListener("click", onDownloadButtonClick, false);
		configure();

		function configure() {
			zip.configure({ useWebWorkers: false });
		}

		async function addFiles() {
			downloadButton.disabled = true;
			let savedModel = {
				version: 1.0,
				customProps: [],
				placedDefaultProps: []
			};
			
			let files = [];
			// Check for layout image
			if(layoutFile) {
				console.log("Layout found, saving to model...");
				files.push(layoutFile);
				savedModel.plan = layoutFile.name;

				// Check for scaling
				if(scale.distPx && scale.distM) {
					console.log("Scaling found, saving to model...");
					savedModel.scale = {
						distPx: scale.distPx,
						distM: scale.distM
					};
				}

				// Check for path
				if(layoutImageUrl && path.length > 0){
					console.log("Path found, saving to model...");
					savedModel.path = [];
					setLayoutDimensions(layoutImageUrl);
					path.forEach(point => {
						savedModel.path.push({
							xp: getXP(point.element),
							yp: getYP(point.element)
						});
					});
				}
			}

			// Check for custom props
			if(customProps.length > 0) {
				console.log("Custom props found, saving to model...");
				customProps.forEach(prop => {
					let savedProp = {
						name: prop.name,
						id: prop.id,
						widthM: prop.widthM,
						lengthM: prop.lengthM,
						placed: []
					};
					if(prop.imageName)
						savedProp.imageName = prop.imageName;
					else if(prop.color)
						savedProp.color = prop.color;
	
					placedCustomProps.forEach(placedProp => {
						if(placedProp.id == prop.id){
							const placedCustomProp = {
								"xp": getXP(placedProp.element),
								"yp": getYP(placedProp.element),
								"rotation": placedProp.element.rotation
							};
							savedProp.placed.push(placedCustomProp);
						}
					});
					savedModel.customProps.push(savedProp);
				});

				// Add all custom prop image files
				propFiles.forEach(propFile => {
					files.push(propFile);
				});
			}
			

			// Check for default props
			if(placedDefaultProps.length > 0) {
				console.log("Placed default props found, saving to model...");
				placedDefaultProps.forEach(prop => {
					let savedProp = {
						id: prop.id,
						xp: getXP(prop.element),
						yp: getYP(prop.element),
						rotation: prop.element.rotation
					};
	
					savedModel.placedDefaultProps.push(savedProp);
				});
			}
			
			
			
			const model = new File(
				[new Blob([JSON.stringify(savedModel)], { type: 'application/json' })],
				"model.json",
				{ type: "application/json" }
			);
			// Always add the model
			files.push(model);
			// Always add the props
			files.push(...propFiles);
			
			await Promise.all(files.map(async file => {
				const controller = new AbortController();
				const signal = controller.signal;
				try {
					const entry = await saver.addFile(file, {
						bufferedWrite: true,
						password: "",
						signal,
						onprogress: (index, max) => {

						},
					});
				} catch (error) {
					console.error(error);
				}
			}));
			downloadButton.disabled = false;
		}

		async function onDownloadButtonClick(event) {
			if(scaling) stopScaling();
			if(measuring) stopMeasuring();
			await addFiles();
			let blobURL;
			try {
				blobURL = await saver.getBlobURL();
			} catch (error) {
				alert(error);
			}
			if (blobURL) {
				const anchor = document.createElement("a");
				const clickEvent = new MouseEvent("click");
				anchor.href = blobURL;
				anchor.download = "RP model.rp";
				anchor.dispatchEvent(clickEvent);
			}
			downloadButton.disabled = true;
			event.preventDefault();
		}

		function getXP(el) {
			const x = el.x - (layoutContainer.clientWidth - layoutWidth) / 2;
			return Math.abs(x / layoutWidth);
		}

		function getYP(el) {
			const y = el.y;
			return Math.abs(y / layoutHeight);
		}
	})();
})();
