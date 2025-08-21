const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to generate quiz questions
app.post('/api/generate-questions', async (req, res) => {
    try {
        const { subject, difficulty, questionCount, topics } = req.body;
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 3000,
                messages: [
                    {
                        role: "user",
                        content: `Generate ${questionCount} realistic MBE-style multiple choice questions for ${subject} at ${difficulty} level.

Requirements:
- Each question should test ${topics.join(', ')}
- Include realistic fact patterns appropriate for the bar exam
- Provide 4 answer choices (A, B, C, D) with only one correct answer
- Make distractors plausible but clearly incorrect
- Include detailed explanations for why each answer is correct or incorrect
- Vary question difficulty within the ${difficulty} range
- Focus on practical application of legal principles

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "id": 1,
    "question": "Detailed question with fact pattern",
    "choices": {
      "A": "Answer choice A text",
      "B": "Answer choice B text", 
      "C": "Answer choice C text",
      "D": "Answer choice D text"
    },
    "correctAnswer": "A",
    "explanation": {
      "correct": "Why the correct answer is right",
      "A": "Explanation for choice A",
      "B": "Explanation for choice B", 
      "C": "Explanation for choice C",
      "D": "Explanation for choice D"
    },
    "topic": "Specific legal topic tested",
    "difficulty": "${difficulty}"
  }
]

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON. Generate exactly ${questionCount} questions.`
                    }
                ]
            })
        });

        const data = await response.json();
        let responseText = data.content[0].text;
        
        // Clean any potential markdown formatting
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        const questionsData = JSON.parse(responseText);
        res.json(questionsData);
        
    } catch (error) {
        console.error("Error generating questions:", error);
        res.status(500).json({ error: "Failed to generate questions" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});