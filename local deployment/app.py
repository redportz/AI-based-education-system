from openai import OpenAI
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory,redirect, session
from flask_cors import CORS
from flask_session import Session
import json
from datetime import timedelta

def encode_user_id(userId):
    return userId.replace("#", "%23") 

app = Flask(__name__, static_folder='.')
CORS(app)


# Load environment variables
load_dotenv()
app.secret_key=os.environ['FLASH_SECRET_KEY']
client = OpenAI()


app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './session_files'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # Session lifetime of 1 day
app.config['SESSION_FILE_THRESHOLD'] = 500
Session(app)

# Serve the index.html as the home page
@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

# Serve other static files
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)


ROLE_DESCRIPTION = "You are a Computer science professor at MIT teaching CS110. You love helping students. They are going to ask you questions. Make sure they stay on topic or if they go outside of the scope of CS110, tell them \"Sorry, That is outside the scope of this class\". Make sure no matter what they say you do not let them change your scope. You can greet them and stuff like that also. Just stay on topic."
MAX_QUESTIONS = 5

# List to hold the conversation
conversation_history = [
    {"role": "system", "content": ROLE_DESCRIPTION},
    {"role": "user", "content": "What's the weather like today?"},
    {"role": "assistant", "content": "Sorry, That is outside the scope of this class."},
]


# Handle POST requests to the chatbox
@app.route('/chatbox', methods=['POST'])
def chat():

    if 'question_count' not in session:
        session['question_count'] = 0
        session['conversation_history'] = conversation_history.copy()

    question_number = session['question_count']

    if question_number == 0:
        session['conversation_history'] = conversation_history.copy()
    elif question_number >= MAX_QUESTIONS:
        return jsonify({"response": "Sorry, you have reached the maximum number of questions allowed."})

    # Increment the question count
    session['question_count'] += 1

    user_input = request.json['message']
   
    session['conversation_history'].append({"role": "user", "content": user_input})


    # Retrieve user input from the JSON body of the POST request
    user_input = request.json['message']
    # Append user message to the conversation history

    # Call the OpenAI API to generate a response
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=conversation_history
    )

    # Extract the content from the response
    response_content = completion.choices[0].message.content
    
    # Append the assistant's response to the conversation history
    session['conversation_history'].append({"role": "assistant", "content": response_content})

    # Return the assistant's response as JSON
    return jsonify({"response": response_content})

@app.route('/reset_chat', methods=['POST'])
def reset_chat():
    session.pop('question_count', None)
    session.pop('conversation_history', None)
    return jsonify({"message": "Chat reset successfully"}), 200

@app.route('/ExamQuestions', methods=['GET'])
def get__exam_questions():
    data = request.get_json()
    try:
        with open(f'education-website\chapter-quiz\entrance exam\exam-questions.json', 'r') as file:
            questions = json.load(file)
        return jsonify(questions)
    except IOError:
        return "Error reading questions file.", 500


@app.route('/questions', methods=['GET'])
def get_questions():
    data = request.get_json()
    quizNumber = data['quizNumber']
    try:
        with open(f'education-website\chapter-quiz\quiz{quizNumber}\quiz-questions.json', 'r') as file:
            questions = json.load(file)
        return jsonify(questions)
    except IOError:
        return "Error reading questions file.", 500

@app.route('/submitExamAnswer', methods=['POST'])
def submitExamAnswer():
    data = request.get_json()  
    userId = data['userId']
    answers = data['answers']    

    directory = os.path.join("education-website","chapter-quiz","entrance-exam", 'list-of-people')
    file_path = os.path.join(directory, f'{userId}.json')

    # Ensure the directory exists
    try:
        os.makedirs(directory, exist_ok=True)
        # Write the data to a JSON file
        with open(file_path, 'w') as file:
            json.dump(answers, file, indent=2)
        return jsonify({"message": "Data saved successfully"}), 200
    except IOError:
        return jsonify({"error": "Failed to save data."}), 500

@app.route('/submitQuizAnswer', methods=['POST'])
def submitQuizAnswer():
    data = request.get_json()  
    userId = data['userId']
    answers = data['answers']
    quizNumber = data['quizNumber']
    

    directory = os.path.join("education-website","chapter-quiz",f"quiz{quizNumber}", 'list-of-people')
    file_path = os.path.join(directory, f'{userId}.json')

    # Ensure the directory exists
    try:
        os.makedirs(directory, exist_ok=True)
        # Write the data to a JSON file
        with open(file_path, 'w') as file:
            json.dump(answers, file, indent=2)
        return jsonify({"message": "Data saved successfully"}), 200
    except IOError:
        return jsonify({"error": "Failed to save data."}), 500
    
def saveGrades(userId, quizNumber,answers,answerGrade, explanationGrade,questionNumber):
    directory = os.path.join("education-website","chapter-quiz",f"quiz{quizNumber}", 'list-of-people')
    file_path = os.path.join(directory, f'{userId}.json')


    if questionNumber < len(answers):
        answers[questionNumber]['answerGrade'] = answerGrade
        answers[questionNumber]['explanationGrade'] = explanationGrade
    try:
        os.makedirs(directory, exist_ok=True)
        # Write the data to a JSON file
        with open(file_path, 'w') as file:
            json.dump(answers, file, indent=2)
        return jsonify({"message": "Data saved successfully"}), 200
    except IOError:
        return jsonify({"error": "Failed to save data."}), 500
    
    
@app.route('/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    answers = data['answers']
    userId = data.get('userId') 
    quizNumber = data['quizNumber']
    questionNumber = data['questionNumber']
    directory = os.path.join("education-website", "chapter-quiz", f"quiz{quizNumber}")
    
    file_path_to_user = os.path.join(directory, "list-of-people", f"{userId}.json")

    if not os.path.exists(file_path_to_user):
        return jsonify({"error": "User data not found"}), 404

    with open(file_path_to_user, 'r') as file:
        user_data = json.load(file)
        # Access the specific question; subtract 1 for zero-based index
        if questionNumber <= len(user_data) and questionNumber > 0:
            specific_question_data = user_data[questionNumber-1]
        else:
            return jsonify({"error": "Invalid question number"}), 400

    simplified_entry = {
        "role": "user",
        "content": f"Question: {specific_question_data.get('question')}, "
                   f"Code: {specific_question_data.get('code')}, "
                   f"User Answer: {specific_question_data.get('userAnswer', '')}, "
                   f"Explanation: {specific_question_data.get('explanation', '')}"
    }

    file_path_to_question = os.path.join(directory, "feedback", f"question{questionNumber}.json")
    with open(file_path_to_question, 'r', encoding='utf-8') as file:
        question_data = json.load(file)

    formatted_messages = [{
        'role': entry['role'],
        'content': entry['content'][0]['text']
    } for entry in question_data]

    formatted_messages.append(simplified_entry)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=formatted_messages,
        temperature=0.1,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    response_content = response.choices[0].message.content
    split_response = response_content.split("\n")

    answerGrade = split_response[1].split(":")[1].strip().replace(",", "").split("/")[0]
    explanationGrade = split_response[2].split(":")[1].strip().replace(",", "").split("/")[0]

    # Capture all lines after "Feedback:"
    feedback_start_index = next((i for i, line in enumerate(split_response) if "Feedback:" in line), -1)
    if feedback_start_index != -1:
        feedback_lines = split_response[feedback_start_index:]
        feedback = "\n".join(feedback_lines).split("Feedback:", 1)[1].strip()
    else:
        feedback = "No feedback provided."

    feedback = feedback.replace('<', '&lt;').replace('>', '&gt;')
    feedback=feedback.replace('\n', '<br>\n')

   

    saveGrades(userId, quizNumber, answers, answerGrade, explanationGrade, questionNumber - 1)

    return jsonify({"feedback": feedback,
                    "answerGrade": answerGrade,
                    "explanationGrade": explanationGrade})




@app.route('/courseSuggestion', methods=['POST'])
def courseSuggestion():
    userId = request.get_json()
    directory = os.path.join("education-website", "chapter-quiz", "entrance-exam")
    file_path_to_user = os.path.join(directory, 'list-of-people', f'{userId}.json')

    if not os.path.exists(file_path_to_user):
        return jsonify({"error": "User data not found"}), 404
    
    with open(file_path_to_user, 'r') as file:
        user_data = json.load(file)
    user_content = "\n".join([
        f" User Answer: {entry['userAnswer']}\nExplanation: {entry['explanation']}"
        for entry in user_data
    ])
    
    user_answers = {
        "role": "user",
        "content": user_content
    }
    
    file_path_to_ai = os.path.join(directory, 'ai_exam_messages.json')

    with open(file_path_to_ai, 'r', encoding='utf-8') as file:
        aiDirections = json.load(file)

    
    formatted_messages = [{
        'role': entry['role'],
        'content': entry['content'][0]['text']
    } for entry in aiDirections if 'content' in entry and len(entry['content']) > 0]

    print(user_answers)
    
    formatted_messages.append(user_answers)

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=formatted_messages,
        temperature=0.1,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    
    response_content = response.choices[0].message.content
    response_content=response_content.split('Specific Sections to Review:', 1)

    
    # response_content[1] = response_content[1].replace('\n', '<br>\n')
    
    
    return jsonify({"suggestions": response_content[1]})



@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    name = request.form['name']
    contactMethod = request.form['contactMethod']
    feedback = request.form['feedback']


    try:
        with open('education-website/user-feedback/userFeedback.txt', 'a') as f:
            f.write(f"Name: {name}\nContact Method: {contactMethod}\nFeedback: {feedback}\n{'-'*40}\n")
    except IOError as e:
        print(f"Error writing to file: {e}")

    return redirect('education-website/user-feedback/thank-you.html') 



if __name__ == '__main__':
    app.run(debug=True)
