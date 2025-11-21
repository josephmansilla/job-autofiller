document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    chrome.storage.local.get(['profile', 'resumeMeta'], (result) => {
        if (result.profile) {
            document.getElementById('firstName').value = result.profile.firstName || '';
            document.getElementById('lastName').value = result.profile.lastName || '';
            document.getElementById('email').value = result.profile.email || '';
            document.getElementById('phone').value = result.profile.phone || '';
            document.getElementById('identification').value = result.profile.identification || '';
            document.getElementById('nationality').value = result.profile.nationality || '';
            document.getElementById('gender').value = result.profile.gender || '';
            document.getElementById('address').value = result.profile.address || '';
            document.getElementById('city').value = result.profile.city || '';
            document.getElementById('postalCode').value = result.profile.postalCode || '';
            document.getElementById('state').value = result.profile.state || '';
            document.getElementById('country').value = result.profile.country || '';
            document.getElementById('linkedin').value = result.profile.linkedin || '';
            document.getElementById('github').value = result.profile.github || '';
            document.getElementById('portfolio').value = result.profile.portfolio || '';
            document.getElementById('gender').value = result.profile.gender || '';
            document.getElementById('dayOfBirth').value = result.profile.dayOfBirth || '';
            document.getElementById('monthOfBirth').value = result.profile.monthOfBirth || '';
            document.getElementById('yearOfBirth').value = result.profile.yearOfBirth || '';
        }
        if (result.resumeMeta) {
            document.getElementById('fileStatus').innerText = `Saved: ${result.resumeMeta.name}`;
        }
    });

    const importBtn = document.getElementById('importJsonBtn');
    const jsonInput = document.getElementById('jsonInput');

    importBtn.addEventListener('click', () => {
        jsonInput.click(); // Trigger invisible file input
    });
    jsonInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                fields.forEach(key => {
                    if (importedData[key] !== undefined) {
                        const element = document.getElementById(key);
                        if (element) element.value = importedData[key];
                    }
                });
                const status = document.getElementById('status');
                status.innerText = "Data imported from JSON. Click Save to keep it.";
                status.style.color = "blue";
            } catch (error) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    });


    document.getElementById('saveBtn').addEventListener('click', async () => {
        const status = document.getElementById('status');
        status.innerText = "Saving...";

        const profile = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('email').value,
            identification: document.getElementById('identification').value,
            phone: document.getElementById('phone').value,
            country: document.getElementById('country').value,
            nationality: document.getElementById('nationality').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            linkedin: document.getElementById('linkedin').value,
            github: document.getElementById('github').value,
            portfolio: document.getElementById('portfolio').value,
            dayOfBirth: document.getElementById('dayOfBirth').value,
            monthOfBirth: document.getElementById('monthOfBirth').value,
            yearOfBirth: document.getElementById('yearOfBirth').value,
            gender: document.getElementById('gender').value,
        };

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