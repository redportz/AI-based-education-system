document.querySelectorAll('li.chapter').forEach(function(chapter) {
    chapter.addEventListener('click', function() {
        this.classList.toggle('open');
    });
});


var accordions = document.getElementsByClassName("accordion");
for (let i = 0; i < accordions.length; i++) {
    accordions[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
}

function entranceExam(){
    window.location.href="education-website/chapter-quiz/entrance-exam/entrance_exam.html"
}
