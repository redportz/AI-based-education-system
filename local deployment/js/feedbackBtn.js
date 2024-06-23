document.addEventListener('DOMContentLoaded', () => {
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const submitFeedback = document.getElementById('submitFeedback');

    feedbackBtn.onclick = function() {
        feedbackModal.style.display = 'block';
    }

    closeModal.onclick = function() {
        feedbackModal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == feedbackModal) {
            feedbackModal.style.display = 'none';
        }
    }

    submitFeedback.onclick = async function() {
        const feedbackText = document.getElementById('feedbackText').value;
        if (feedbackText.trim()) {
            try {
                const response = await fetch('/submitFeedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ feedback: feedbackText })
                });

                if (response.ok) {
                    alert('Feedback submitted successfully!');
                    feedbackModal.style.display = 'none';
                    document.getElementById('feedbackText').value = '';
                } else {
                    alert('Failed to submit feedback.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error submitting feedback.');
            }
        } else {
            alert('Please enter feedback.');
        }
    }
});
