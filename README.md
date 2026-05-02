# 🧠 Omnia Intelligence Engine

Omnia is a high-stakes, intellectually stimulating knowledge quest and trivia game powered by the **Google Gemini AI**. Instead of relying on a static database of questions, Omnia uses advanced generative AI to dynamically architect unique challenges tailored to various domains of human knowledge and difficulties.

## ✨ Features and Capabilities

*   **Infinite Question Generation**: Never play the same game twice. Questions are generated in real-time, ensuring unique challenges every time you play.
*   **Domain Selection**: Choose from a wide array of topics including *Science & Tech*, *Islamic History*, *Pakistan Special*, *Brain Teasers & Logic*, *Philosophy*, *Deep Space*, and more.
*   **Adaptive Difficulty**: Play at Easy (Grade 10 level), Medium (College level), or Hard (Highly niche/conceptual). 
*   **"Deep Insight" Explanations**: Every question includes a rich, explanatory insight when answered, designed to give the user immediate intellectual ROI.
*   **Intelligent Prefetching**: While you read the feedback or answer a question, the engine works asynchronously in the background to fetch your next set of challenges, maintaining a fluid, zero-latency experience.

## 🤖 How the AI is Used

Omnia relies on the **Gemini 3 Flash Preview** (`gemini-3-flash-preview`) model via the `@google/genai` SDK to dynamically synthesize questions. 

**Here is how the AI pipeline works:**
1.  **Prompt Engineering**: The application constructs a sophisticated prompt that asks the AI for a "highly plausible, sophisticated" question within a specific domain and difficulty.
2.  **Context Awareness**: To prevent repetition, Omnia passes an array of recently asked questions to the AI, instructing it to avoid generating similar content.
3.  **Structured JSON Output**: The AI is instructed to return a strictly structured JSON response containing the question, 4 plausible options, the index of the correct answer, a detailed explanation, the specific category, and the difficulty.
4.  **Error Handling & Fallbacks**: The system gracefully handles AI Rate Limits (HTTP 429) and timeouts. If the AI becomes exhausted or too slow, Omnia seamlessly falls back to a handcrafted local pool of questions (`INITIAL_QUESTIONS`) without breaking your flow.

## 🕹️ How It Works (The Game Loop)

1.  **Initialize**: Pick your desired Topic and Difficulty. Hit **Initialize Quest** or try the **Daily** mode (Deep Wisdom focus).
2.  **Synchronicity Timer**: You have **30 seconds** to lock in your answer for each question.
3.  **Feedback & Flow**: 
    *   ✅ **Correct Signal**: Points are added to your score, your streak increases, and the game quickly auto-advances to the next challenge.
    *   ❌ **Signal Divergence**: You lose 1 of your 5 lives, your streak is reset, and the game pauses to let you read the detailed explanation ("Deep Insight").
    *   ⏱️ **Timeout**: Failing to answer within 30 seconds instantly counts as an incorrect response, revealing the explanation.
4.  **Ranks & Progression**: The more consecutive questions you answer, the higher your Rank climbs—from *Novice*, to *Scholar*, and eventually *Legend*.
5.  **Game Over**: The game concludes when you run out of lives (5 strikes). Can you beat your locally-archived High Score?

## 🛠️ Technical Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS v4
*   **Animations**: Motion (Framer Motion) for fluid UI transitions, engaging hover states, and dynamic elements.
*   **AI / Backend Integration**: `@google/genai` TypeScript SDK using `process.env.GEMINI_API_KEY`.
*   **Icons**: Lucide React


---
*Created as part of an interactive AI Studio knowledge experience.*
