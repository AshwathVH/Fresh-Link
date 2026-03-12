// i18n Configuration for Green Trade Network
const i18n = {
  currentLang: localStorage.getItem('language') || 'en',
  translations: {},
  
  async init() {
    console.log('Initializing i18n...');
    console.log('Current location:', window.location.href);
    
    // Load all translation files
    const languages = ['en', 'hi', 'kn', 'ml'];
    
    for (const lang of languages) {
      try {
        // Try multiple path variations
        const paths = [
          `translations/${lang}.json`,
          `./translations/${lang}.json`,
          `/translations/${lang}.json`
        ];
        
        let loaded = false;
        for (const path of paths) {
          try {
            console.log(`Trying to load: ${path}`);
            const response = await fetch(path);
            if (response.ok) {
              this.translations[lang] = await response.json();
              console.log(`✓ Loaded ${lang} from ${path}`);
              loaded = true;
              break;
            }
          } catch (e) {
            // Try next path
          }
        }
        
        if (!loaded) {
          throw new Error(`Could not load ${lang} from any path`);
        }
      } catch (error) {
        console.error(`✗ Failed to load ${lang} translations:`, error);
      }
    }
    
    console.log('Available translations:', Object.keys(this.translations));
    
    // Set initial language
    this.setLanguage(this.currentLang);
    
    // Dispatch event that i18n is ready
    window.dispatchEvent(new Event('i18nReady'));
    console.log('i18n initialization complete');
  },
  
  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.error(`Language ${lang} not found, defaulting to English`);
      lang = 'en';
    }
    
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update language selector to show current selection
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      languageSelector.value = lang;
    }
    
    // Update page content
    this.updatePageContent();
    
    console.log(`Language changed to: ${lang}`);
  },
  
  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  },
  
  updatePageContent() {
    console.log(`Updating page content for language: ${this.currentLang}`);
    let updateCount = 0;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (translation && translation !== key) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = translation;
        } else if (element.tagName === 'OPTION') {
          element.textContent = translation;
        } else {
          element.textContent = translation;
        }
        updateCount++;
      }
    });
    
    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation && translation !== key) {
        element.placeholder = translation;
        updateCount++;
      }
    });
    
    console.log(`Updated ${updateCount} elements`);
    
    // Dispatch event that content has been updated
    window.dispatchEvent(new Event('i18nUpdated'));
  }
};

// Initialize i18n when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}
