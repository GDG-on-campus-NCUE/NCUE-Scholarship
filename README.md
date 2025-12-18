# NCUE Scholarship - AI-Powered Scholarship Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google/discover/gemini/)

---

## Project Title & Introduction

**NCUE Scholarship** is an intelligent scholarship information platform designed for the students of National Changhua University of Education (NCUE).

This project leverages the power of AI to automate the discovery, parsing, and summarization of scholarship information from various sources. Its core feature is an AI-powered assistant that provides students with instant, accurate, and easy-to-understand answers to their scholarship-related questions. The platform aims to streamline the scholarship application process, saving students time and effort.

**Target Audience:** Students of NCUE.
**Application Scene:** Finding and understanding scholarship opportunities, managing application deadlines, and getting assistance with related queries.

## Core Tech Stack

This project is built with a modern, robust, and scalable technology stack.

| Technology | Version | Description |
| :--- | :--- | :--- |
| **Next.js** | 15.4.4 | A full-stack React framework. Chosen for its App Router, Server Components, API Routes, and overall performance, enabling a seamless developer experience and a fast user experience. |
| **React** | 19.1.0 | A JavaScript library for building user interfaces. The foundation of our dynamic and interactive components. |
| **JavaScript** | ES2020+ | The primary programming language for the project. |
| **Supabase** | 2.53.0 | The open-source Firebase alternative. Used as the Backend-as-a-Service (BaaS) for its comprehensive suite of tools: **Database**, **Authentication**, **Storage**. Supabase Edge Functions are not currently used but are considered for future background tasks. |
| **Tailwind CSS** | 4.0 | A utility-first CSS framework. Chosen for rapid UI development, consistent design, and high customizability without writing custom CSS. |
| **Custom UI** | - | The project uses a set of custom-built React components with Tailwind CSS, ensuring a unique and consistent look and feel. It is **not** using a pre-built library like Shadcn/UI. |
| **Vercel** | - | The deployment platform. Chosen for its seamless integration with Next.js, automatic CI/CD, global CDN, and serverless functions, providing an optimal hosting solution. |
| **Google Gemini** | `gemini-3-flash` | The AI service from Google. Used for its advanced reasoning, summarization, and Retrieval-Augmented Generation (RAG) capabilities. |
| **SerpApi** | - | An external API used for performing real-time Google searches to augment the AI's knowledge base with external information. |

## Key Features

### 1. User Management
- **Authentication:** Secure user registration and login with email/password.
- **Authorization:** Role-based access control (e.g., regular user vs. admin).
- **Password Reset:** A secure flow for users to reset their passwords via email.
- **Profile Management:** Users can view and manage their personal information.

### 2. AI-Powered Assistant (RAG)
- **Retrieval-Augmented Generation (RAG):** The AI assistant uses a sophisticated RAG pipeline to provide accurate answers.
    - **Internal Knowledge:** It first searches the internal scholarship database (Supabase) for relevant information.
    - **External Search:** If no internal information is found, it performs a live Google search (via SerpApi) to find external resources.
- **Natural Language Queries:** Ask questions in plain language (e.g., "有哪些給大三學生的獎學金？").
- **Summarization:** The AI summarizes long and complex scholarship documents into easy-to-read formats.
- **Source Citing:** The assistant provides source links for information retrieved from external websites and indicates when information is from an internal announcement.

### 3. Data Management
- **Scholarship Database:** A centralized database for all scholarship announcements.
- **Chat History:** All conversations with the AI assistant are saved for future reference.
- **File Storage:** Securely stores announcement-related files (e.g., PDFs, DOCX) using Supabase Storage.

### 4. Administrative Backend
- **Content Management:** A dedicated interface for administrators to create, update, and manage scholarship announcements.
- **User Monitoring:** View user activity and manage user roles.

## Project Structure

The project uses the Next.js App Router, which provides a clear and scalable structure.

```
ncue-scholarship/
├── src/
│   ├── app/                    # Next.js App Router (Core of the application)
│   │   ├── (auth)/             # Route group for authentication pages (login, register)
│   │   ├── (user)/             # Route group for authenticated user pages (profile)
│   │   ├── api/                # API routes for backend logic (e.g., AI chat, file uploads)
│   │   ├── ai-assistant/       # The main page for the AI chat interface
│   │   ├── manage/             # Admin dashboard pages
│   │   ├── layout.jsx          # Root layout for the entire application
│   │   └── page.jsx            # The application's home page
│   ├── components/             # Reusable React components
│   ├── lib/                    # Core libraries, helpers, and configurations
│   │   ├── supabase/           # Supabase client initialization (client, server)
│   │   └── apiMiddleware.js    # Middleware for API routes (auth, rate-limiting)
│   └── utils/                  # General utility functions
├── public/                     # Static assets (images, fonts, etc.)
├── supabase/                   # Supabase-related files
│   └── supabase_schema.sql     # The complete SQL schema for the database
├── middleware.js               # Next.js middleware for route protection and CORS
└── next.config.mjs             # Next.js configuration file
```

## Environment Setup

### Prerequisites
- **Node.js:** v18.0 or higher
- **npm** or **yarn**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/NCUESA/NCUE-Scholarship.git
cd NCUE-Scholarship
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup
1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Get API Keys:** Navigate to `Project Settings` > `API`. You will need the **Project URL** (`SUPABASE_URL`) and the **`anon` public key** (`SUPABASE_ANON_KEY`).
3.  **Database Schema:**
    - Go to the `SQL Editor` in your Supabase project.
    - Open the `supabase/supabase_schema.sql` file from this repository.
    - Copy its content and run it in the SQL Editor to create all the necessary tables (`profiles`, `announcements`, etc.), RLS policies, and database triggers.
4.  **Row Level Security (RLS):** The schema automatically enables RLS on the `profiles` table to ensure users can only update their own data.
5.  **Storage Buckets:** No manual setup is required if the file upload routes are used, as they will create buckets if they don't exist. However, you can pre-create a bucket named `attachments` for file uploads.

### 4. AI Service Setup
1.  **Google Gemini API Key:**
    - Go to [Google AI Studio](https://aistudio.google.com/).
    - Create an API key.
2.  **SerpApi API Key (Optional, for external search):**
    - Go to [serpapi.com](https://serpapi.com/).
    - Register and get an API key.

### 5. Detailed Environment Variables
Create a `.env.local` file. The following variables are required for the application to run correctly.

| Variable | Required | Description & Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | The unique URL for your Supabase project. Example: `https://your-project-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| **Yes** | The anonymous, public-facing API key for your Supabase project. It's safe to expose this in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | The secret service role key for your Supabase project. **Never expose this key in the browser.** It has full access to your database, bypassing RLS policies, and is used for admin-level backend operations. |
| `NEXT_PUBLIC_GEMINI_API_KEY` | **Yes** | Your API key for the Google Gemini service, used for all AI-related features. |
| `SERP_API_KEY` | No | API key for SerpApi, used for external web searches by the AI assistant. If omitted, the AI will only use its internal knowledge base. |
| `SMTP_HOST` | No | The hostname of your SMTP server for sending emails (e.g., password resets). Example: `smtp.example.com` |
| `SMTP_PORT` | No | The port for your SMTP server. Example: `587` |
| `SMTP_USERNAME` | No | The username for authenticating with your SMTP server. |
| `SMTP_PASSWORD` | No | The password for authenticating with your SMTP server. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | The canonical URL of your deployed site. Required for generating correct links in emails and other services. Example: `http://localhost:3000` for local development. |

## Development Workflow & Tools

### 1. Local Development
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`. The application supports Hot Module Replacement (HMR).

### 2. Linter and Formatter
- **ESLint**: The project uses `next lint` for static code analysis to find and fix problems in JavaScript code. To run it:
  ```bash
  npm run lint
  ```
- **Prettier**: While not configured with a dedicated script, it is recommended to use Prettier for code formatting to maintain a consistent style. You can run it manually or set it up with a VS Code extension.
  ```bash
  npx prettier --write .
  ```

### 3. IDE Recommendations
- **VS Code** is recommended.
- **Helpful Extensions**: ESLint, Prettier - Code formatter, Tailwind CSS IntelliSense.

## Deployment

Vercel is the recommended platform for deploying this Next.js application due to its seamless integration and CI/CD capabilities.

### Vercel Deployment Flow
1.  **Fork and Clone:** Fork this repository and clone it to your local machine.
2.  **Push to Your GitHub:** Push the project to your own GitHub repository.
3.  **Import Project on Vercel:**
    - Sign up or log in to [Vercel](https://vercel.com/).
    - Click "Add New..." > "Project".
    - Import the GitHub repository you just created.
4.  **Configure Environment Variables:**
    - During the import process, Vercel will prompt you to configure the project.
    - Go to the "Environment Variables" section.
    - Add all the variables from your `.env.local` file (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`, etc.). Ensure you use the production values for your services.
5.  **Deploy:**
    - Click the "Deploy" button. Vercel will automatically detect that it's a Next.js project, build it, and deploy it.
6.  **Custom Domain (Optional):**
    - Once deployed, you can go to your project's "Settings" > "Domains" tab on Vercel to add your own custom domain.

Vercel's CI/CD pipeline will automatically redeploy your application whenever you push new changes to the main branch of your connected GitHub repository.

## Technical Details & Considerations

### Performance Optimization Strategies
- **Database Layer**:
    - **Specific Selections**: Queries are optimized to select only the necessary columns (e.g., `select('id, title')`) instead of using `select('*')`, reducing data transfer size.
    - **Pagination**: Where applicable, data is fetched in paginated chunks to avoid loading large datasets at once.
- **Frontend Layer**:
    - **Image Optimization**: The project uses `<Image>` from `next/image` to automatically optimize images, including resizing, format conversion (e.g., to WebP), and lazy loading.
    - **Code Splitting**: The Next.js App Router automatically splits code by route, so users only download the JavaScript needed for the page they are visiting.
    - **Data Caching**: Next.js's data cache is utilized for server-side fetches, reducing redundant requests to the backend and APIs.

### Error Handling & Logging
- **Frontend Errors**: The project relies on the default error handling provided by the Next.js App Router via `error.js` files to show user-friendly error UIs. Custom component-level Error Boundaries are not currently implemented.
- **Backend API Errors**: A standardized error handling function, `handleApiError` in `src/lib/apiMiddleware.js`, is used across API routes to ensure consistent, formatted error responses (e.g., `{ error: '...' }` with appropriate status codes).
- **Logging**: A structured logging system is in place via the `logSecurityEvent` function. This allows for centralized logging of important events, such as unauthorized access attempts, rate limit exceedances, and other API errors, which can be integrated with services like Supabase Logs or external logging platforms.

### Security Best Practices
- **Row Level Security (RLS)**: This is the primary data security mechanism. RLS policies on Supabase tables ensure that users can only access or modify data they are permitted to, even if they attempt to bypass client-side logic.
- **Rate Limiting**: API routes are protected against brute-force and denial-of-service attacks using a rate-limiting function (`checkRateLimit`) that restricts the number of requests from a single IP address in a given time window.
- **Environment Variables**: All sensitive credentials (API keys, database secrets) are stored securely in environment variables and are never exposed on the client-side (unless prefixed with `NEXT_PUBLIC_`).
- **Input Validation & Sanitization**: The `validateRequestData` middleware validates the presence, type, and format of incoming API request data and sanitizes it to prevent injection attacks.
- **CSRF/XSS Protection**: Modern Next.js applications with the App Router have built-in protections. Form submissions and API routes using server actions are inherently protected against CSRF. React's JSX automatically escapes content, providing strong protection against XSS attacks.
- **Dependency Auditing**: It is recommended to periodically run `npm audit` to check for and fix known vulnerabilities in third-party dependencies.

## Troubleshooting

- **`npm install` fails**:
    - Ensure you have a compatible version of Node.js (v18.0+).
    - Try deleting `node_modules` and `package-lock.json`, then run `npm install` again.
- **Environment variables not loaded**:
    - Make sure your environment file is named exactly `.env.local`.
    - After creating or modifying `.env.local`, you must restart the development server.
- **Supabase connection issues**:
    - Double-check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` are correct.
    - Check the Supabase status page to ensure their services are operational.
- **AI assistant returns errors**:
    - Verify that your `NEXT_PUBLIC_GEMINI_API_KEY` is correct and has not exceeded its usage quota.
    - Check the server logs for any error messages from the Gemini API.

## Testing

The project contains a `src/app/__tests__` directory, which includes pages for manual functional testing of different parts of the application.

However, the `package.json` does not include formal testing frameworks like Jest or Playwright. To improve code quality, the following could be added:
- **Unit Tests:** Use Jest and React Testing Library to test individual components and utility functions.
- **E2E Tests:** Use Playwright or Cypress to simulate user flows from end-to-end.

To run existing test pages, navigate to their respective routes in the development environment.

## Contributing

We welcome contributions! Please follow these steps:

1.  **Fork the repository.**
2.  **Create a new feature branch:** `git checkout -b feature/your-amazing-feature`
3.  **Make your changes.**
4.  **Commit your changes with a conventional commit message:** `git commit -m 'feat: Add some amazing feature'`
5.  **Push to the branch:** `git push origin feature/your-amazing-feature`
6.  **Open a Pull Request.**

Please adhere to the existing code style, which is enforced by ESLint and Prettier.

## License

This project is licensed under the **MIT License**.

## Contact

- **Project Maintainer:** [Tai Ming Chen](https://github.com/Ming874), [Grason Yang](https://github.com/grasonyang)
- **Report an issue:** [GitHub Issues](https://github.com/NCUESA/NCUE-Scholarship/issues)

## Acknowledgements

- The **NCUE Student Assistance Division (生輔組)** for their guidance and support.
- All open-source projects and tools that made this platform possible.
