const KEYWORDS = {
    firstName: ['first name', 'firstname', 'given name', 'fname', 'primer nombre'],
    lastName: ['last name', 'lastname', 'surname', 'lname', 'family name'],
    fullName: ['full name', 'fullname', 'your name', 'name'],
    email: ['email', 'e-mail', 'mail'],
    phone: ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'teléfono', 'telefono'],
    linkedin: ['linkedin', 'linked in'],
    portfolio: ['portfolio', 'website', 'personal site', 'github', 'git'],
    address: ['address', 'direccion'],
    identification: ['identification', 'identificacion', 'identificacion', 'documento', 'Nº de documento', 'DNI', ],
    city: ['city', 'ciudad'],
    state: ['state', 'province', 'provincia'],
    resume: ['resume', 'cv', 'curriculum', 'upload', 'curriculum vitae'],
    gender: ['gender', 'sex', 'género', 'genero'],
};

// Listen for the hotkey (Alt + A)
document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        runAutofill();
    }
});

function runAutofill() {
    chrome.storage.local.get(['profile', 'resume', 'resumeMeta'], (data) => {
        if (!data.profile) {
            alert("Please click the extension icon and save your profile first!");
            return;
        }

        showToast("Autofilling...");
        let fillCount = 0;

        const inputs = document.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (input.type === 'hidden' || input.disabled || input.readOnly) return;

            const fieldType = identifyField(input);

            if (fieldType && data.profile[fieldType]) {
                if (setValue(input, data.profile[fieldType])) {
                    fillCount++;
                    highlight(input);
                }
            } else if (fieldType === 'resume' && data.resume && input.type === 'file') {
                uploadFile(input, data.resume, data.resumeMeta);
                fillCount++;
                highlight(input);
            } else if (input.name && input.name.toLowerCase().includes('gender')) {
                if(setSelect(input, data.profile.gender)) fillCount++;
            }
        });

        if (data.profile.fullName) {
            inputs.forEach(input => {
                const type = identifyField(input);
                if (type === 'fullName' && !input.value) {
                    setValue(input, data.profile.fullName);
                    fillCount++;
                    highlight(input);
                }
            });
        }

        showToast(`Filled ${fillCount} fields!`);
    });
}

function identifyField(element) {
    const attributes = [
        element.id,
        element.name,
        element.placeholder,
        element.getAttribute('aria-label'),
        getLabelText(element)
    ].join(' ').toLowerCase();


    if (element.type === 'file') return 'resume';

    for (const [key, words] of Object.entries(KEYWORDS)) {
        if (words.some(word => attributes.includes(word))) {
            if (key === 'email' && attributes.includes('female')) continue;
            return key;
        }
    }
    return null;
}

function getLabelText(element) {
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.innerText;
    }
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
        const label = document.getElementById(ariaLabelledBy);
        if(label) return label.innerText;
    }
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.innerText;

    return '';
}

// REACT COMPATIBILITY: React tracks state internally.
// Simply setting .value isn't enough. We must dispatch events.
function setValue(element, value) {
    if (!value) return false;
    if (element.value === value) return false;

    const proto = Object.getPrototypeOf(element);
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    valueSetter.call(element, value);

    // Dispatch events to trigger framework listeners (React/Angular/Vue)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
}

function setSelect(element, value) {
    if(element.tagName !== 'SELECT') return false;
    for (let i = 0; i < element.options.length; i++) {
        const option = element.options[i];
        if (option.text.toLowerCase().includes(value.toLowerCase()) ||
            option.value.toLowerCase().includes(value.toLowerCase())) {
            element.selectedIndex = i;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
    }
    return false;
}

function uploadFile(input, base64Data, meta) {
    try {
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: meta.type });
        const file = new File([blob], meta.name, { type: meta.type, lastModified: meta.lastModified });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));

    } catch (e) {
        console.error("File upload failed:", e);
    }
}

function highlight(element) {
    element.style.transition = 'background-color 0.5s';
    element.style.backgroundColor = '#e8f0fe';
    setTimeout(() => {
        element.style.backgroundColor = '';
    }, 2000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.fontFamily = 'sans-serif';
    toast.style.fontSize = '14px';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}