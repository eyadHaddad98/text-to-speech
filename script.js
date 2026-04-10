const playButton = document.getElementById('play-button')
const pauseButton = document.getElementById('pause-button')
const stopButton = document.getElementById('stop-button')
const textinput = document.getElementById('text')
const speedinput = document.getElementById('speed')
let currentCharacter

const utterance = new SpeechSynthesisUtterance()

// --- Fix for loading voices in certain browsers (important for Chrome) ---
speechSynthesis.getVoices(); 
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

playButton.addEventListener('click', () => {
    playText(textinput.value)
})

pauseButton.addEventListener('click', puseText)
stopButton.addEventListener('click', stopText)

speedinput.addEventListener('input', () => {
    stopText()
    playText(utterance.text.substring(currentCharacter))
})

utterance.addEventListener('end', () => {
    textinput.disabled = false
})

utterance.addEventListener('boundary', e => {
    currentCharacter = e.charIndex
})

/**
 * Checks if a voice for the specified language is available on the system
 * @param {string} langCode - The language code to check (e.g., 'he', 'ar')
 */
function isLanguageAvailable(langCode) {
    const voices = speechSynthesis.getVoices();
    // If voices aren't loaded yet, don't block execution
    if (voices.length === 0) return true; 
    return voices.some(voice => voice.lang.toLowerCase().startsWith(langCode.toLowerCase()));
}

/**
 * Main function to handle text-to-speech logic
 * @param {string} text - The input text to be spoken
 */
function playText(text) {
    // If speech is currently paused, resume it
    if (speechSynthesis.paused && speechSynthesis.speaking) {
        return speechSynthesis.resume();
    }
    
    // Clear any pending speech tasks to prevent overlaps/freezing
    speechSynthesis.cancel();

    // --- Automatic Language Detection Logic ---
    let lang = 'en-US'; // Default language
    const patterns = {
        'he-IL': /[\u0590-\u05FF]/,         // Hebrew
        'ar-SA': /[\u0600-\u06FF]/,         // Arabic
        'zh-CN': /[\u4e00-\u9fa5]/,         // Chinese
        'ja-JP': /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/, // Japanese
        'ru-RU': /[\u0400-\u04FF]/,         // Russian
        'fr-FR': /[À-ÿ]/                    // French/Latin accents
    };

    // Check which language pattern matches the input text
    for (let key in patterns) {
        if (patterns[key].test(text)) {
            lang = key;
            break;
        }
    }

    utterance.text = text;
    utterance.lang = lang; 
    utterance.rate = speedinput.value || 1;

    // --- Select the best matching voice from the system ---
    const allVoices = speechSynthesis.getVoices();
    const preferredVoice = allVoices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()));
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    // --- Validate language availability ---
    if (!isLanguageAvailable(lang.split('-')[0])) {
        // Log a warning if no matching voice package is installed
        console.warn(`No voice installed for ${lang}`);
    }

    textinput.disabled = true;
    speechSynthesis.speak(utterance);
}

function puseText() {
    if (speechSynthesis.speaking) speechSynthesis.pause()
}

function stopText() {
    speechSynthesis.resume()
    speechSynthesis.cancel()
}