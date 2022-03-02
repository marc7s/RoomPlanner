(() => {

	const loader = (() => {

		return {
			getEntries(file, options) {
				return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
			},
			async getURL(entry, options) {
				return URL.createObjectURL(await entry.getData(new zip.BlobWriter(), options));
			}
		};

	})();

	(() => {
		const fileInput = document.getElementById("load-model-file-input");
		const fileInputButton = document.getElementById("load-model-file-input-button");
		let entries;
		let selectedFile;
		fileInput.onchange = selectFile;
		fileInputButton.onclick = () => fileInput.dispatchEvent(new MouseEvent("click"));
		configure();

		async function selectFile() {
			try {
				fileInputButton.disabled = true;
				selectedFile = fileInput.files[0];
				await loadFiles();
			} catch (error) {
				alert(error);
			} finally {
				fileInputButton.disabled = false;
				fileInput.value = "";
			}
		}

		function configure() {
			zip.configure({ useWebWorkers: false });
		}

		async function loadFiles(filenameEncoding) {
			entries = await loader.getEntries(selectedFile, { filenameEncoding });
			if (entries && entries.length) {
				clearPath();
				parseModel();
			}
		}

		async function parseModel() {
			const parsedModel = await parseModelJson(entries);
		}
	})();

})();
