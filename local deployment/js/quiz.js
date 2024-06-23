let currentQuestionIndex = 0;
let questions = [];
let quizNumber=1;
document.getElementById('examForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const quiz_number=document.getElementById('quizNumber').value;
    quizNumber=Number(quiz_number);
    if (userId) {
        try {
            await loadExistingUser(userId,quizNumber);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load user data. \nFormant is Firstname#1234'
            );
        }
    }
});

async function loadQuestions() {
    
    try {
        const response = await fetch(`quiz${quizNumber}/quiz-questions.json`);
        const data = await response.json();
        questions = data;
        displayQuestion(currentQuestionIndex);
        showQuiz();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions.');
    }
}

function loadFinalGrades(index) {
    let content = ''; // Initialize empty content string
    let totalAnswerGrade = 0;
    let totalExplanationGrade = 0;

    for (var i = 0; i <= index; i++) {
        // Assuming that questions array has the required properties
        if (questions[i]) {
            content += `
                <strong>Question ${i + 1}:</strong><br>
                Question: ${questions[i].question}<br>
                <img src="${questions[i].codeImage}" alt="{$questions[i].code}"><br>
                Answer: ${questions[i].userAnswer}<br>
                Answer Grade: ${questions[i].answerGrade}/100<br>
                Explanation: ${questions[i].explanation}<br>
                Explanation Grade: ${questions[i].explanationGrade}/100<br><br>
            `;
            totalAnswerGrade += parseInt(questions[i].answerGrade);
            totalExplanationGrade += parseInt(questions[i].explanationGrade);
        }
    }

    // Calculate average grades
    let averageAnswerGrade = totalAnswerGrade / (index);
    let averageExplanationGrade = totalExplanationGrade / (index);

    // Append average grades to content
    content += `
        <strong>Average Grades:</strong><br>
        Average Answer Grade: ${averageAnswerGrade}/100<br>
        Average Explanation Grade: ${averageExplanationGrade}/100<br>
    `;

    // Update HTML
    
    document.getElementById('grades-content').innerHTML = content;

    // Hides feedback and questions 
    removeFeedbackStyles();
    applyExamStyles()
    document.getElementById('Feedback').style.display = 'none';
    document.getElementById('nextQuestion').style.display = 'none';
    document.getElementById('questions').style.display = 'none';
    document.getElementById('questionButtons').style.display = 'none';

    document.getElementById('final-grade').style.display = 'block'; // Show the grades
    
}


function displayQuestion(index) {
    const questionContainer = document.getElementById('questions');
    removeFeedbackStyles();
    applyExamStyles()
    let questionHtml = `<div id="questionStuff">
        <h2>Question ${index + 1}: ${questions[index].question}</h2>`;
    
    if (questions[index].codeImage) {
        questionHtml += `<img src="${questions[index].codeImage}" alt="Code Snippet for Question ${index + 1}" style="max-width:100%; height:auto;"> <br><br></div>`;
    }else {
        questionHtml += `</div>`;  // Close the div if there is no code image
    }
    questionHtml += `
    <label for="answer">Answer</label><br>
    <textarea id="answer" placeholder="Your answer" required>${questions[index].userAnswer || ''}</textarea><br><br>
    <label for="explanation">Explanation</label><br>
    <textarea id="explanation" placeholder="Explain your answer" required>${questions[index].explanation || ''}</textarea>
    `;
    
    questionContainer.innerHTML = questionHtml;
    document.getElementById('nextBtn').innerText = index < questions.length - 1 ? 'Next' : 'Submit';
}
function feedback(){
    const userId = document.getElementById('userId').value;
    fetch('/feedback',{
        method: "Post",
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
function saveCurrentAnswer(index) {
    questions[index].userAnswer = document.getElementById('answer').value;
    questions[index].explanation = document.getElementById('explanation').value;
}

function saveCurrentGrades(index,feedbackData) {
    questions[index].answerGrade=feedbackData.answerGrade
    questions[index].explanationGrade=feedbackData.explanationGrade
}



async function getFeedback(userId, quizNumber, questionNumber) {
    try {
        const response = await fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, quizNumber, questionNumber })
        });
        const feedbackData = await response.json();
        if (response.ok) {
            displayFeedback(feedbackData.response); // Assuming the feedback is in `response` key
        } else {
            console.error('Failed to retrieve feedback:', feedbackData);
        }
    } catch (error) {
        console.error('Error getting feedback:', error);
    }
    
}
async function submitAnswer() {
    const submitButton=document.getElementById('submitAnswer')
    submitButton.disabled=true;

    const userId = document.getElementById('userId').value;
    const quizNumber = document.getElementById('quizNumber').value;
    
    saveCurrentAnswer(currentQuestionIndex);

    
    try {       
        const response = await fetch('/submitQuizAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, answers: questions, quizNumber })
        });
        // Trigger feedback fetching if submission is successful
        if (response.ok) {
            const feedbackResponse = await fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, quizNumber, questionNumber: currentQuestionIndex+1,answers:questions})
            });
            const feedbackData = await feedbackResponse.json();
            saveCurrentGrades(currentQuestionIndex,feedbackData)
            displayFeedback(feedbackData.feedback);
            
        } else {
            console.error('Failed to submit answers:', await response.text());
        }
    } catch (error) {
        console.error('Failed to submit answers:', error);
    }
}

function displayFeedback(feedback) {
    const formattedFeedback=feedback.replace(/\n/g, '<br>');
    const submitButton=document.getElementById('submitAnswer')
    submitButton.disabled=false;
    const feedbackElement = document.getElementById('Feedback');
    const nextQuestionElement = document.getElementById('nextQuestion');
    const QuestionElement = document.getElementById('questions');
    const QuestionBtnsElement = document.getElementById('questionButtons');
    feedbackElement.innerHTML = `<h2>Feedback:</h2><br>${formattedFeedback}`;
    feedbackElement.style.display = 'block';  
    QuestionBtnsElement.style.display='none';
    QuestionElement.style.display='none';
    nextQuestionElement.style.display='block';
}


async function loadExistingUser(userId,quizNumber) {
    const encodedUserId = encodeURIComponent(userId);
    console.log(encodedUserId);
    const response = await fetch(`/education-website/chapter-quiz/quiz${quizNumber}/list-of-people/${encodedUserId}.json`);
    if (!response.ok) {
        throw new Error('No data found for this user.');
    }
    const data = await response.json();
    if (data && data.length > 0) {
        // alert('Chapter '+quizNumber +' quiz has already been taken for: '+userId)
        questions = data;
        displayQuestion(currentQuestionIndex);
        showQuiz();
    } else {
        document.getElementById('online-header-container').style.display = 'none';
        loadQuestions();
    }
}
async function nextQuestion() {
    const feedbackElement = document.getElementById('Feedback');
    const nextQuestionElement = document.getElementById('nextQuestion');
    const QuestionElement = document.getElementById('questions');
    const QuestionBtnsElement = document.getElementById('questionButtons');
   
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        feedbackElement.style.display = 'none'; 
        QuestionBtnsElement.style.display='block';
        QuestionElement.style.display='block';
        nextQuestionElement.style.display='none';
    } else {
        loadFinalGrades(currentQuestionIndex)
    }
    
}
function sectionRecDisplay() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'feedbackStyles';
    style.innerHTML = `
    main{
        background-color: #D9D9D9;
        margin-top: 60px;
        display: block;
        height: auto;
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
    
    }
    h1 {
        margin-bottom: 0px;
    }
        

    @media (max-width: 768px) {
    main{
    background-color: var(--primary-color);
    margin-top: 0px;
    }
    h1{
    display: block;
    font-size: larger;
    margin-top: 0px;
    margin-bottom: 0px;
    }
    main{
    box-shadow: none;
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

    }

    `;
    document.head.appendChild(style);
}

function applyExamStyles() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'examStyles'; // Add an ID to the style element for easy removal later
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
                background-color: #979797;
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
function removeFeedbackStyles() {
    const style = document.getElementById('feedbackStyles');
    if (style) {
        style.parentNode.removeChild(style);
    }
}

function showQuiz() {
    document.getElementById('examForm').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
}


