document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    chrome.storage.local.get(['profile', 'resumeMeta'], (result) => {
        if (result.profile) {
            document.getElementById('firstName').value = result.profile.firstName || '';
            document.getElementById('lastName').value = result.profile.lastName || '';
            document.getElementById('email').value = result.profile.email || '';
            document.getElementById('phone').value = result.profile.phone || '';
            document.getElementById('address').value = result.profile.address || '';
            document.getElementById('linkedin').value = result.profile.linkedin || '';
            document.getElementById('portfolio').value = result.profile.portfolio || '';
            document.getElementById('gender').value = result.profile.gender || '';
        }
        if (result.resumeMeta) {
            document.getElementById('fileStatus').innerText = `Saved: ${result.resumeMeta.name}`;
        }
    });

    // Save data
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const status = document.getElementById('status');
        status.innerText = "Saving...";

        const profile = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            linkedin: document.getElementById('linkedin').value,
            portfolio: document.getElementById('portfolio').value,
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

        chrome.storage.local.set(dataToSave, () => {
            status.innerText = "Profile Saved! You can close this.";
            if (dataToSave.resumeMeta) {
                document.getElementById('fileStatus').innerText = `Saved: ${dataToSave.resumeMeta.name}`;
            }
            setTimeout(() => status.innerText = "", 2000);
        });
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