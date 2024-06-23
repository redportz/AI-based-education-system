// Get all the dark mode switch controls from the document
const darkModeSwitches = document.querySelectorAll('.dark-mode-switch');

// Function to update the dark mode settings based on the saved preference
function updateDarkModeSettings() {
    const darkMode = localStorage.getItem('darkMode');
    document.documentElement.setAttribute('data-theme', darkMode === 'enabled' ? 'dark' : '');
    darkModeSwitches.forEach(switchElement => {
        switchElement.checked = darkMode === 'enabled';
    });
}

// Attach an event listener to each dark mode switch to handle changes
darkModeSwitches.forEach(switchElement => {
    switchElement.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('darkMode');
        }
    });
});

// Call updateDarkModeSettings to apply the current theme on script load
updateDarkModeSettings();

window.onload = function() {
    // Set a timer to hide the loading overlay
    setTimeout(function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }, 800); // Set the delay as needed, 800 milliseconds =.8 seconds

    // Ensure the dark mode state is applied on page load
    updateDarkModeSettings();
    window.scrollTo(0, 0);
};
