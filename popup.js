const FORM_FIELDS = [
    'firstName', 'lastName', 'email', 'identification', 'phone',
    'address', 'city', 'state', 'postalCode', 'country', 'nationality',
    'linkedin', 'github', 'portfolio', 'gender',
    'dayOfBirth', 'monthOfBirth', 'yearOfBirth'
];

document.addEventListener('DOMContentLoaded', () => {

    chrome.storage.local.get(['profile', 'resumeMeta'], (result) => {
        FORM_FIELDS.forEach(id => {
            const inputElement = document.getElementById(id);
            if (inputElement) {
                inputElement.value = result.profile[id] || '';
            }
        });
        if (result.resumeMeta) {
            const statusEl = document.getElementById('fileStatus');
            if (statusEl) statusEl.innerText = `Saved: ${result.resumeMeta.name}`;
        }
    });


    const importBtn = document.getElementById('importJsonBtn');
    const jsonInput = document.getElementById('jsonInput');

    importBtn.addEventListener('click', () => {
        jsonInput.value = '';
        jsonInput.click();
    });
    jsonInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let importedData = JSON.parse(e.target.result);
                if (importedData.profile) importedData = importedData.profile;

                let count = 0
                FORM_FIELDS.forEach(key => {
                    if (importedData[key] !== undefined) {
                        const elem = document.getElementById(key);
                        if (elem) {
                            if (elem.tagName === 'SELECT') {
                                const val = String(importedData[key]);
                                for (let i = 0; i < el.options.length; i++) {
                                    if (elem.options[i].value.toLowerCase() === val) {
                                        elem.selectedIndex = i;
                                        break;
                                    }
                                }
                            } else {
                                el.value = importedData[key];
                            }
                            count++;
                        }
                    }
                });
                const status = document.getElementById('status');
                if (count > 0) {
                    status.innerText = "Data imported from JSON. Click Save to keep it.";
                    status.style.color = "blue";
                } else {
                    status.innerText = "JSON file is valid, yet empty.";
                    status.style.color = "orange";
                }

            } catch (error) {
                alert("Error de formato en el JSON:\n" + error.message);
                console.error("JSON Error:", error);
            }
        };
        reader.readAsText(file);
    });


    document.getElementById('saveBtn').addEventListener('click', async () => {
        const status = document.getElementById('status');
        status.innerText = "Saving...";

        const profile = {};
        FORM_FIELDS.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                profile[id] = elem.value.trim();
            }
        });

        profile.fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

        const fileInput = document.getElementById('resumeFile');
        const dataToSave = { profile };

        // Handle File Upload (Convert to Base64 to store in Chrome Storage)
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 4 * 1024 * 1024) { // 4MB limit check
                status.innerText = "Error: PDF must be under 4MB";
                return;
            }
            try {
                const base64Data = await readFileAsBase64(file);
                dataToSave.resume = base64Data;
                dataToSave.resumeMeta = {
                    name: file.name,
                    type: file.type,
                    lastModified: file.lastModified
                };
            } catch (e) {
                console.error(e);
                status.innerText = "Error reading file";
                return;
            }
        }
        // your data stays local but is NOT encrpyted.
        chrome.storage.local.set(dataToSave, () => {
            status.innerText = "Profile Saved! You can close this.";
            if (dataToSave.resumeMeta) {
                document.getElementById('fileStatus').innerText = `Saved: ${dataToSave.resumeMeta.name}`;
            }
            setTimeout(() => status.innerText = "", 2000);
        });
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm("Do you really hate your own data that much?")) {
            chrome.storage.local.clear(() => {
                document.querySelectorAll('input').forEach(input => input.value = '');
                document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
                document.getElementById('fileStatus').innerText = "No file saved currently.";

                const status = document.getElementById('status');
                status.innerText = "Data deleted.";
                status.style.color = "red";

                setTimeout(() => {
                    status.innerText = "";
                    status.style.color = "#666";
                }, 2000);
            });
        }
    });
});

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}