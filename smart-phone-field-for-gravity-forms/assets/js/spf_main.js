class SmartPhoneFieldFree {
    constructor(options) {
        this.options = options;
        this.init();
    }

    init() {
        this.initSmartPhoneFieldFree();
        this.addCountryCodeInputHandler();
    }

    initSmartPhoneFieldFree() {
        if (typeof intlTelInput === 'undefined') {
            return;
        }
        const input = document.querySelector(this.options.inputId);

        if (!input) {
            console.warn(`Input element not found: ${this.options.inputId}`);
            return;
        }

        const preValue = input.value;
        const iti = window.intlTelInput(input, this.configuration());
        const fieldId = `${this.options.formId}_${this.options.fieldId}`;

        input.addEventListener('blur', (e) => {
            this.validateNumber(e.currentTarget, fieldId, iti);
        });

        input.addEventListener('keyup', (e) => {
            this.formatValidation(e.currentTarget, iti);
        });

        if (preValue) {
            iti.setNumber(preValue);
            this.validateNumber(input, fieldId, iti);
        }
    }

    configuration() {
        const field_id = `input_${this.options.fieldId}`;

        let config = {
            initialCountry: this.options.defaultCountry,
            formatOnDisplay: false,
            formatAsYouType: false,
            fixDropdownWidth: true,
            hiddenInput: function (telInputName) {
                return {
                    phone: field_id
                };
            },
            useFullscreenPopup: false
        };

        if (this.options.countrySearch) {
            config.countrySearch = true;
        }

        if (this.options.flag === "flagcode") {
            config.nationalMode = false;
            config.autoHideDialCode = false;
        } else if (this.options.flag === "flagdial" || this.options.flag === "flagwithcode") {
            config.nationalMode = false;
            config.separateDialCode = true;
        } else {
            config.nationalMode = true;
        }

        if (this.options.exIn === 'ex_only') {
            config.onlyCountries = this.options.countries.split(',');
        }

        if (this.options.exIn === 'pre_only') {
            config.excludeCountries = this.options.countries.split(',');
        }

        if (this.options.autoIp) {
            this.detectIPAddress(config);
        }

        if (this.options.placeholder) {
            config.autoPlaceholder = 'off';
        }

        config = gform.applyFilters('gform_spf_options_pre_init', config, this.options.formId, this.options.fieldId);

        return config;
    }

    detectIPAddress(config) {
        const api_url = "https://ipinfo.io/json";
        config.initialCountry = "auto";
        config.geoIpLookup = function (callback) {
            fetch(api_url)
                .then(r => r.json())
                .then(data => {
                    const country = (data && data.country) ? data.country.toLowerCase() : 'us';
                    callback(country);
                })
                .catch(() => callback('us'));
        };
    }

    validateNumber(input, fieldId, iti) {
        if (!input.value) {
            const errorMsg = input.parentNode?.parentNode?.querySelector('.error-msg');
            const validMsg = input.parentNode?.parentNode?.querySelector('.valid-msg');
            if (errorMsg) errorMsg.classList.add('hide');
            if (validMsg) validMsg.classList.add('hide');
            return;
        }

        const isValid = iti.isValidNumber();
        const errorMsg = input.parentNode?.parentNode?.querySelector('.error-msg');
        const validMsg = input.parentNode?.parentNode?.querySelector('.valid-msg');
        const hiddenInput = input.parentNode?.parentNode?.querySelector('input[type="hidden"]');
        const number = iti.getNumber(intlTelInput.utils.numberFormat.E164);

        if (errorMsg && validMsg && input.value) {
            if (isValid) {
                errorMsg.classList.add('hide');
                validMsg.classList.remove('hide');
                input.setAttribute('aria-invalid', 'false');
            } else {
                validMsg.classList.add('hide');
                errorMsg.classList.remove('hide');
                input.setAttribute('aria-invalid', 'true');
            }
            hiddenInput.value = number;
        } else {
            validMsg.classList.add('hide');
	        errorMsg.classList.add('hide');
        }
    }

    formatValidation(input, iti) {
        if (!input.value) {
            const errorMsg = input.parentNode?.parentNode?.querySelector('.error-msg');
            const validMsg = input.parentNode?.parentNode?.querySelector('.valid-msg');
            if (errorMsg) errorMsg.classList.add('hide');
            if (validMsg) validMsg.classList.add('hide');
            return;
        }

        const isValid = iti.isValidNumber();
        const errorMsg = input.parentNode?.parentNode?.querySelector('.error-msg');
        const validMsg = input.parentNode?.parentNode?.querySelector('.valid-msg');

        if (errorMsg && validMsg) {
            if (isValid) {
                errorMsg.classList.add('hide');
                validMsg.classList.remove('hide');
            } else {
                validMsg.classList.add('hide');
                errorMsg.classList.add('hide');
            }
        }
    }

    addCountryCodeInputHandler() {
        if (this.options.flag !== 'flagcode') {
            return;
        }

        const input = document.querySelector(this.options.inputId);
        if (!input) {
            return;
        }

        const iti = intlTelInput.getInstance(input);
        if (!iti) {
            return;
        }

        const handleCountryChange = (event) => {
            const currentCountryData = iti.getSelectedCountryData();
            const currentCode = `+${currentCountryData.dialCode}`;
            this.updateCountryCodeHandler(event.currentTarget, currentCode);
        };

        input.addEventListener('keydown', handleCountryChange);
        input.addEventListener('input', handleCountryChange);
        input.addEventListener('countrychange', handleCountryChange);
    }

    updateCountryCodeHandler(element, currentCode) {
        let value = element.value;

        if (!currentCode || currentCode === '+undefined' || ['', '+'].includes(value)) {
            return;
        }

        if (!value.startsWith(currentCode)) {
            value = value.replace(/\+/g, '');
            element.value = currentCode + value;
        }
    }
}