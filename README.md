# NCUE Scholarship - AI-Powered Scholarship Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google/discover/gemini/)

---

## Introduction

**NCUE Scholarship** is an intelligent, comprehensive scholarship information platform tailored for students of National Changhua University of Education (NCUE).

By leveraging cutting-edge AI technology, this platform automates the aggregation, parsing, and summarization of scholarship information. It features a conversational AI assistant capable of answering student queries in real-time, significantly simplifying the search for financial aid.

**Target Audience:** NCUE Students, Administrators.
**Core Mission:** To streamline the scholarship application process through automation and intelligence.

## Tech Stack

This project is built upon a modern, high-performance technology stack:

| Category | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** | 16.1.1 | Full-stack React framework using App Router and Server Components for optimal performance and SEO. |
| **UI Library** | **React** | 19.1.0 | Component-based UI library. |
| **Styling** | **Tailwind CSS** | 4.0 | Utility-first CSS framework for rapid and responsive design. |
| **Backend / DB** | **Supabase** | 2.53.0 | Backend-as-a-Service providing PostgreSQL database, Authentication, and Storage. |
| **AI / LLM** | **Google Gemini** | - | Powers the intelligent assistant and RAG pipeline for summarizing and retrieving information. |
| **Email** | **Nodemailer** | ^6.10 | Handles transactional emails (password resets, notifications). |
| **PDF Generation** | **React-PDF** | ^4.3 | Generates downloadable PDF documents for announcements. |
| **Editor** | **TinyMCE** | ^6.3 | Rich text editor for creating announcement content. |
| **Scraping** | **Cheerio** | ^1.1 | Used for scraping external scholarship websites. |
| **Process Manager**| **PM2** | - | Production process manager for Node.js (for VPS deployments). |

## Key Features

### 1. Student Portal
- **Smart Search & Filter**: Easily find scholarships based on criteria.
- **AI Assistant (RAG)**:
    - **Contextual Answers**: Asks questions like "What scholarships are available for juniors?" and gets instant answers.
    - **Hybrid Search**: Combines internal database knowledge with real-time Google Search (via SerpApi).
    - **Summarization**: AI summarizes complex regulations into simple terms.
- **Announcement Details**: View comprehensive details, download attachments, or export as PDF.
- **User Dashboard**: Manage profile, view chat history, and saved bookmarks (future).

### 2. User Management & Security
- **Authentication**: Secure login/registration, Email verification, Password reset/forgot flows.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Students and Administrators.
- **Security**: Rate limiting, Input validation, Row Level Security (RLS) policies in Supabase.

### 3. Admin Dashboard
- **Content Management**:
    - **CRUD Operations**: Create, Read, Update, Delete scholarship announcements.
    - **Rich Text Editing**: Integrated TinyMCE editor for formatted content.
    - **Duplication**: Quickly duplicate existing announcements as templates.
- **Communication Hub**:
    - **Bulk Email**: Send notifications to multiple users.
    - **Line Broadcast**: Broadcast announcements to the official Line account.
    - **Custom Emails**: Send targeted emails to specific users.
- **Automated Scraping**: Trigger scrapers to fetch new scholarships from external sources.
- **Monitoring**:
    - **Usage Statistics**: View platform usage metrics.
    - **User Management**: View and manage registered users.
    - **System Settings**: Configure global platform settings.

## Project Structure

The project follows the **Next.js App Router** architecture:

```
ncue-scholarship/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication routes (login, register, password reset)
│   │   ├── (user)/             # User-specific routes (profile)
│   │   ├── ai-assistant/       # AI Chat interface
│   │   ├── api/                # Backend API routes (Chat, Email, Scrape, etc.)
│   │   ├── auth/               # Auth callbacks and error handling
│   │   ├── manage/             # Admin management interface
│   │   ├── resource/           # Resource pages
│   │   ├── layout.jsx          # Root layout
│   │   └── page.jsx            # Landing page
│   ├── components/             # Reusable UI Components
│   │   ├── admin/              # Admin-specific components
│   │   ├── ai-assistant/       # AI chat components
│   │   ├── ui/                 # Generic UI elements (Buttons, Modals)
│   │   └── ...
│   ├── lib/                    # Core logic (Supabase client, Auth helpers)
│   └── utils/                  # Utility functions (Formatting, Validation)
├── public/                     # Static assets
├── supabase/                   # Supabase configuration & Schema
├── middleware.js               # Route protection & CORS middleware
└── package.json                # Dependencies & Scripts
```

## Environment Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **yarn**

### 1. Installation
```bash
git clone https://github.com/NCUESA/NCUE-Scholarship.git
cd NCUE-Scholarship
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and configure the following variables (reference `.env.template`):

**Core & Database**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key (Public).
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Private - keep secure!).
- `NEXT_PUBLIC_APP_URL`: The base URL of your application (e.g., `http://localhost:3000`).

**AI Services**
- `NEXT_PUBLIC_GEMINI_API_KEY`: Google Gemini API Key.
- `SERP_API_KEY`: SerpApi Key (for external search).

**Email Services (Nodemailer)**
- `SENDER_EMAIL`: Email address used for sending notifications.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`: SMTP server configuration (e.g., Gmail or NCUE server).

**Other Services**
- `NEXT_PUBLIC_TINYMCE_API_KEY`: API Key for the TinyMCE editor.
- `LINE_CHANNEL_ACCESS_TOKEN`: Access token for Line Bot integration.

### 3. Database Setup
1.  Initialize your Supabase project.
2.  Run the SQL script located in `supabase/supabase_schema.sql` in your Supabase SQL Editor to set up tables and RLS policies.

### 4. Running Locally
```bash
npm run dev
```
Visit `http://localhost:3000` to start using the application.

## Deployment

### Vercel (Recommended)
1.  Connect your GitHub repository to Vercel.
2.  Configure the Environment Variables in Vercel project settings.
3.  Deploy. Vercel automatically detects Next.js.

### VPS / PM2
For hosting on a VPS (e.g., DigitalOcean, EC2):
1.  Build the application:
    ```bash
    npm run build
    ```
2.  Start with PM2:
    ```bash
    npm run pm2:start
    ```
    (This runs `next start` via PM2).

## Contributing

Contributions are welcome!
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit changes (`git commit -m 'Add NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

> [!IMPORTANT]
> This license permits personal and non-commercial use, especially for educational and public-interest purposes. **Commercial use is strictly prohibited.**

For the full license text and copyright information, please refer to the [LICENSE](LICENSE) file.

## Contact

- **Project Maintainers:**
  - [Tai Ming Chen](https://github.com/Ming874)
  - [Grason Yang](https://github.com/grasonyang)
- **Organization:** [GDGoC NCUE (Google Developer Group On Campus NCUE)](https://github.com/GDG-on-campus-NCUE)
- **Report an issue:** [GitHub Issues](https://github.com/GDG-on-campus-NCUE/NCUE-Scholarship/issues)
