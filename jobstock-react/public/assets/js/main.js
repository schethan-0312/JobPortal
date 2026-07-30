// Add skill tag to textarea
const tags = document.querySelectorAll('.tag');
const textarea = document.getElementById('skills');

tags.forEach(tag => {
    tag.addEventListener('click', () => {
        const tagText = tag.textContent;
        let current = textarea.value;
        const words = current.split(',').map(word => word.trim());

        // Avoid duplicates
        if (!words.includes(tagText)) {
        textarea.value = current ? current + ', ' + tagText : tagText;
        }
    });
});


// For candidate-profile Page

document.addEventListener("DOMContentLoaded", function () {
    const percent = 75;
    const circle = document.querySelector('.progress');
    if (!circle) return; // Safe exit if not found

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100 * circumference);

    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
});


// For employer-profile Page

function moveToNext(currentInput) {
    if (currentInput.value.length === 1) {
    const nextInput = currentInput.nextElementSibling;
    if (nextInput !== null) {
        nextInput.focus();
    }
    }
}


// For employer-submit-job Page

document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('.selectdate');
    dateInputs.forEach(input => {
      new Datepicker(input); // Assumes Datepicker is already loaded via script
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const froalaElements = document.querySelectorAll('.froala-editor');
    froalaElements.forEach(el => {
      new FroalaEditor(el); // Assumes FroalaEditor is loaded
    });
});


// For slider-home Page

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('trendingSearch');

    window.fillInput = (tagText) => {
        if (input) {
        input.value = tagText;
        }
    };
});