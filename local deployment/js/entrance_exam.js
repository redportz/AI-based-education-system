let currentQuestionIndex=0
let questions=[]

document.getElementById('examForm').addEventListener('submit',async function(e){
    e.preventDefault();
    const userId = document.getElementById('userId').value;

    if (userId) {
        try {
            await loadExistingUser(userId);
            applyExamStyles();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load user data. \nFormant is Firstname#1234'
            );
        }
    }
})

async function loadQuestions() {
    
    try {
        const response = await fetch(`/education-website/chapter-quiz/entrance-exam/exam-questions.json`);
        const data = await response.json();
        questions = data;
        displayQuestion(currentQuestionIndex);
        showExam();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions.');
    }
}

async function nextQuestion() {
    const userId = document.getElementById('userId').value;
    const nextButton=document.getElementById('nextBtn')
    nextButton.disabled=true;
    saveCurrentAnswer(currentQuestionIndex);
    document.getElementById('backBtn').style.display = 'inline';
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        submitAnswer();
    } else {
        document.getElementById('loading').style.display = 'flex';
        try {
            await submitAnswer();
            const sectionSugResponse = await fetch('/courseSuggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userId)
            });
            const suggestionData = await sectionSugResponse.json();
            displaySuggestions(suggestionData.suggestions);
        } catch (error) {
            console.error('Error submitting the final question:', error);
        }
    }
}

function displaySuggestions(suggestions) {
    document.getElementById('loading').style.display = 'none';
    const formattedSuggestions = suggestions.replace(/\n/g, '<br>');
    const suggestionsDisplayElement = document.getElementById('course-recommendations');
    const suggestionsElement = document.getElementById('course-recommendations-content');
    const examElement = document.getElementById('exam');
    
    removeExamStyles();
    sectionRecDisplay()
    suggestionsElement.innerHTML = `<h1>Specific Sections to Review:</h1><p>${formattedSuggestions}</p>`;
    examElement.style.display = 'none';
    suggestionsDisplayElement.style.display = 'block';


   

}

function saveCurrentAnswer(index) {
    questions[index].userAnswer = document.getElementById('answer').value;
    questions[index].explanation = document.getElementById('explanation').value;
}

function displayQuestion(index) {
    const questionContainer = document.getElementById('questions');
    let questionHtml = `<div id="questionStuff"> 
        <h2 id='questionHeader'>Question ${index + 1}: ${questions[index].question}</h2>`;
    
    if (questions[index].codeImage) {
        questionHtml += `<img id='questionPhoto' src="${questions[index].codeImage}" alt="Code Snippet for Question ${index + 1}" style="max-width:100%; height:auto;"> <br><br></div>`;
    } else {
        questionHtml += `</div>`;  // Close the div if there is no code image
    }
    
    questionHtml += `
        <label for="answer">Answer:</label><br>
        <textarea id="answer" placeholder="Your answer here..." required>${questions[index].userAnswer || ''}</textarea><br><br>
        <label for="explanation">Explanation:</label><br>
        <textarea id="explanation" placeholder="Explanation your answer here..." required>${questions[index].explanation || ''}</textarea>
    `;
    
    questionContainer.innerHTML = questionHtml;
    
    if (index > 0) {
        document.getElementById('backBtn').style.display = 'inline';
    }
    
    document.getElementById('nextBtn').innerText = index < questions.length - 1 ? 'Next' : 'Submit';
    const nextButton = document.getElementById('nextBtn');
    nextButton.disabled = false;
}



async function previousQuestion() {
    if (currentQuestionIndex>0) {
        document.getElementById('backBtn').style.display = 'none';
    }
    saveCurrentAnswer(currentQuestionIndex);
    currentQuestionIndex--;
    displayQuestion(currentQuestionIndex);
    submitAnswer();


}


async function submitAnswer() {
    const userId = document.getElementById('userId').value;
    try {
        const response = await fetch('/submitExamAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, answers: questions })
        });
        const data = await response.text();
    } catch (error) {
        console.error('Failed to submit answers:', error);
        throw error; // Propagate error to be handled elsewhere
    }
}

async function loadExistingUser(userId) {
    const encodedUserId = encodeURIComponent(userId);
    const response = await fetch(`/education-website/chapter-quiz/entrance-exam/list-of-people/${encodedUserId}.json`);
    if (!response.ok) {
        throw new Error('No data found for this user.');
    }
    const data = await response.json();
    if (data && data.length > 0) {
        questions = data;
        document.getElementById('online-header-container').style.display = 'none'; // Corrected ID
        document.getElementById('footer').style.display = 'none';
        displayQuestion(currentQuestionIndex);
        showExam();
    } else {
        loadQuestions();
    }
}

function sectionRecDisplay() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    main {
        background-color: #D9D9D9;
        margin-top: 60px;
        display: block;
        height: auto;
    }
    footer{
        display: none;
        
    }
    
    #course-recommendations {
        text-align: center;
    }
    
    p {
        background-color: transparent;
        width: auto;
        flex-wrap: wrap;
        margin-top: 0px;
        margin-bottom: 0px;
        padding-bottom: 0px;
        padding-top: 0px;
        border: none;
        text-align: left;
        
    }
    h1 {
    margin-bottom: 0px;
    }
   

    @media (max-width: 768px) {
    main{
    background-color: var(--primary-color);
    margin-top: 0px;
    }
    h1 {
    display: block;
    font-size: larger;
    margin-top: 0px;
    margin-bottom: 0px;
    }
    main {
    box-shadow: none;
    }

    }

    `;
    document.head.appendChild(style);
}


function applyExamStyles() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'examStyles'; 
    style.innerHTML = `
        main {
            background-color: #D9D9D9;
            margin-top: 60px;
            height: auto;
            display: block;
        }

        reviewHeader {
            display: block;
        }

        p {
            border: none;
        }

        #questionStuff {
            color: white;
            border-color: black;
            padding-left: 10px;
            padding-right: 10px;
            background-color: var(--primary-color);
            border-width: 7px;
            border-style: solid;
            border-radius: 50px;
        } 

        #questionStuff img {
            border-color: #323232;
            border-width: 5px;
            border-style: solid; 
        }

        [data-theme="dark"] main {
            background-color: #595959;
            }
        [data-theme="dark"] body {
            background-color: black;
        }
           

        @media (max-width: 768px) {
            #answer, #explanation {
                width: 90%;
                background-color: transparent;
            }
            main {
                margin: 0;
                width: 100%;
                height: 100%;
                background-color: white;
                box-shadow: none;
            }
            #questions {
                background-color: transparent;
            }
            #questionStuff {
                color: var(--bg-color);
                padding-left: 10px;
                padding-right: 10px;
                background-color: transparent;
                border-style: none;
                color: black;
            }
            #questionStuff img {
                border-color: #323232;
                border-width: 5px;
                border-style: solid;
            }
            [data-theme="dark"] main {
                background-color: #595959;
            }


            [data-theme="dark"] #answer, [data-theme="dark"] #explanation {
                background-color: transparent;
            }
        }
    `;
    document.head.appendChild(style);
}


function removeExamStyles() {
    const style = document.getElementById('examStyles');
    if (style) {
        style.parentNode.removeChild(style);
    }
}



function showExam() {
    document.getElementById('examForm').style.display = 'none';
    document.getElementById('exam').style.display = 'block';
}
