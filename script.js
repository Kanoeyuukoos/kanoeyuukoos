let allFiles = [];

function getNumberFromName(name) {
    let base = name.replace(/\.[^/.]+$/, "");
    let numbers = base.match(/\d+/g);
    return numbers ? parseInt(numbers[numbers.length - 1]) : 0;
}

function getAnimeTitle(name) {
    let base = name.replace(/\.[^/.]+$/, "");
    let match = base.match(/^(.*?)(episode|ep)\s*\d+/i);
    if (match) return match[1].trim();
    return base.split(/\d+/)[0].trim();
}

function addFiles() {
    const input = document.getElementById("fileInput");
    const newFiles = Array.from(input.files);

    allFiles = allFiles.concat(newFiles);
    renderList();
    input.value = "";
}

function renderList() {
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    allFiles.sort((a, b) => getNumberFromName(a.name) - getNumberFromName(b.name));

    allFiles.forEach((file, index) => {
        let li = document.createElement("li");
        li.textContent = (index + 1) + ". " + file.name;
        list.appendChild(li);
    });
}

function copyAnimeName() {
    if (allFiles.length === 0) {
        alert("Belum ada file!");
        return;
    }

    let title = getAnimeTitle(allFiles[0].name) || "Anime";

    navigator.clipboard.writeText(title)
        .then(() => alert("Tersalin: " + title))
        .catch(() => alert("Gagal menyalin!"));
}

async function createZip() {
    if (allFiles.length === 0) {
        alert("Belum ada file!");
        return;
    }

    const progressBar = document.getElementById("progressBar");
    const fileProgress = document.getElementById("fileProgress");
    const statusText = document.getElementById("statusText");

    progressBar.value = 0;
    fileProgress.value = 0;

    //  Ambil nama anime
    let animeTitle = sanitizeName(getAnimeTitle(allFiles[0].name) || "Anime");

    let useFolder = !!window.showDirectoryPicker;
    let rootDir = null;

    if (useFolder) {
        try {
            rootDir = await window.showDirectoryPicker();

            //  Buat folder anime
            const safeFolder = sanitizeName(animeTitle);rootDir = await rootDir.getDirectoryHandle(safeFolder, { create: true });

            statusText.textContent = "Mode: Folder (PC)";
        } catch {
            useFolder = false;
            statusText.textContent = "Mode: Download";
        }
    } else {
        statusText.textContent = "Mode: Download (HP)";
    }

    let totalFiles = allFiles.length;
    let processed = 0;

    for (let file of allFiles) {

        let zip = new JSZip();
        let content = await file.arrayBuffer();
        zip.file(file.name, content);

        let number = getNumberFromName(file.name);
        let padded = number.toString().padStart(2, '0');
        let zipName = `Episode ${padded}.zip`;

        let blob = await zip.generateAsync(
            { type: "blob" },
            (meta) => {
                fileProgress.value = meta.percent.toFixed(0);

                let totalPercent =
                    ((processed + (meta.percent / 100)) / totalFiles) * 100;

                progressBar.value = Math.round(totalPercent);

                statusText.textContent =
                    `Zip: ${file.name} (${meta.percent.toFixed(0)}%)`;
            }
        );

        if (useFolder) {
            const handle = await rootDir.getFileHandle(zipName, { create: true });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = zipName;
            link.click();
            await delay(300); //  penting
        }

        processed++;
    }

    progressBar.value = 100;
    fileProgress.value = 100;
    statusText.textContent = "Selesai semua! ";

    //  Reset setelah selesai
    setTimeout(() => {
        allFiles = [];
        renderList();
        document.getElementById("fileList").innerHTML = "";
        progressBar.value = 0;
        fileProgress.value = 0;
        statusText.textContent = "Menunggu...";
    }, 1500);
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function sanitizeName(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
}

	/*====Buat apk ======*/
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Perhatikan penggunaan './' sebelum sw.js
      navigator.serviceWorker.register('./sw.js', { scope: '/listanime.github.io/' })
        .then(reg => console.log('Berhasil!', reg))
        .catch(err => console.log('Gagal!', err));
    });
  }
