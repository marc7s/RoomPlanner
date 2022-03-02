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
		const downloadButton = document.getElementById("download-model-button");
		downloadButton.addEventListener("click", onDownloadButtonClick, false);
		configure();

		function configure() {
			zip.configure({ useWebWorkers: false });
		}

		async function addFiles() {
			downloadButton.disabled = true;
			let savedModel = {
				props: [
					{
						"name": "Bed",
						"widthM": 0.9,
						"lengthM": 2
					}
				]
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
						const x = point.element.x - (layoutContainer.clientWidth - layoutWidth) / 2 + point.element.offsetWidth / 2;
						const y = point.element.y + point.element.offsetHeight / 2;
						savedModel.path.push({
							xp: Math.abs(x / layoutWidth),
							yp: Math.abs(y / layoutHeight)
						});
					});
				}
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
				const li = document.createElement("li");
				const filenameContainer = document.createElement("span");
				const filename = document.createElement("span");
				filenameContainer.classList.add("filename-container");
				li.appendChild(filenameContainer);
				filename.classList.add("filename");
				filename.textContent = file.name;
				filenameContainer.appendChild(filename);
				li.title = file.name;
				li.classList.add("pending");
				const controller = new AbortController();
				const signal = controller.signal;
				try {
					const entry = await saver.addFile(file, {
						bufferedWrite: true,
						password: "",
						signal,
						onprogress: (index, max) => {
							li.classList.remove("pending");
							li.classList.add("busy");
						},
					});
					li.title += `\n  Last modification date: ${entry.lastModDate.toLocaleString()}\n  Compressed size: ${entry.compressedSize.toLocaleString()} bytes`;
				} catch (error) {
					if (error.message == zip.ERR_ABORT) {
						li.remove();
					} else {
						throw error;
					}
				} finally {
					li.classList.remove("busy");
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
	})();
})();
