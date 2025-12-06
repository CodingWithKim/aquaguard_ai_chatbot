# AquaGuard - AI-Powered Water Quality Monitoring Dashboard

AquaGuard is an interactive web application built with Next.js that provides a real-time dashboard for monitoring water turbidity. It features an AI-powered chatbot, "Aqua," which can answer questions about water quality in text, audio, or even video format, leveraging the power of OpenAI's latest models.

## ✨ Features

*   **Real-time Turbidity Chart**: Visualize 24-hour water turbidity data with a clean and responsive line chart.
*   **AI Chat Assistant ("Aqua")**: Engage with an intelligent assistant to get answers to your water quality questions.
*   **Multi-Modal Outputs**: Choose to receive responses from Aqua in three different formats:
    *   📝 **Text**: Standard text-based answers powered by `gpt-4o-mini`.
    *   🔊 **Audio**: Get audible responses, generated using OpenAI's Text-to-Speech (`gpt-4o-mini-tts`) model.
    *   🎥 **Video**: Generate short, informative videos on demand, powered by `sora-2`.
*   **Modern & Responsive UI**: A sleek and user-friendly interface built with Tailwind CSS and Lucide icons.
*   **Chat Interface**: A familiar and intuitive chat panel that can be opened, minimized, and closed.

## 🛠️ Built With

*   [Next.js](https://nextjs.org/) - The React Framework for Production
*   [React](https://reactjs.org/) - A JavaScript library for building user interfaces
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale
*   [OpenAI API](https://openai.com/api/) - For AI text, audio, and video generation
*   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
*   [Recharts](https://recharts.org/) - A composable charting library built on React components
*   [Lucide React](https://lucide.dev/) - Beautiful & consistent icons

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm, yarn, pnpm, or bun
*   An OpenAI API Key
*   A **verified** OpenAI Organization account (required for video generation with Sora)

### ‼️ Important: API Configuration

Before you can run this project, you need to configure your OpenAI API key.

1.  **Create a `.env.local` file** in the root of your project directory.
2.  **Add your API key** to the `.env.local` file as follows:

    ```
    NEXT_PUBLIC_OPENAI_API_KEY="your-openai-api-key-here"
    ```

3.  **OpenAI Organization Verification**: The video generation feature uses OpenAI's Sora model. Access to this model requires your OpenAI account to be part of a verified organization. If your organization is not verified, the video output feature will fail.

### Installation & Running the App

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/aquaguard_ai_chatbot.git
    cd aquaguard_ai_chatbot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 🎥 Project Showcase

For a complete walkthrough of the application's features and a live demonstration of the AI chatbot in action, please watch the video below.

[![AquaGuard Project Showcase](https://img.youtube.com/vi/mQD-yhsbISQ/maxresdefault.jpg)](https://youtu.be/mQD-yhsbISQ)

*Click the thumbnail above to watch the video demonstration on YouTube.*
