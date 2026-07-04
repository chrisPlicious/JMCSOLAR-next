# JMC-Next Codebase Exploration Plan

## Objective
Understand the jmc-next codebase (Next.js App Router + Firebase) to identify knowledge sources, contact/support flows, email infrastructure, routing layout, and existing AI usage for planning a RAG-powered customer support chatbot.

## Search Strategy

### 1. Knowledge Content Sources
**Goal:** Locate textual content that can ground a support bot's answers.

**Search Areas:**
- FAQ pages: `app/faq*`, `app/*faq*`, content in components
- Service descriptions: `app/services*`, `app/*/page.tsx|mdx` files
- Marketing/about copy: `app/about*`, `app/(home)*`, hardcoded component copy
- Documentation: `docs/`, `public/docs/`, markdown files
- Pricing/consultation: `app/pricing*`, `app/consultation*`, `app/quote*`
- Blog/articles: `app/blog*`, `content/blog/`, `public/content/`

**Commands:**
- Find all MDX/Markdown files: `find app -type f \( -name "*.mdx" -o -name "*.md" \)`
- List page structure: `find app -type f -name "page.tsx" -o -name "page.mdx"`
- Search for content directories: `find . -type d -name "content" -o -name "docs" -o -name "markdown"`
- Grep for FAQ/service/pricing keywords in components
- Check layout components for marketing copy

### 2. Contact/Support Flow
**Goal:** Identify how customers contact/submit requests today.

**Search Areas:**
- Contact pages: `app/contact*`, `app/*/contact*`
- Contact form components: `components/*contact*`, `components/*form*`
- API routes: `app/api/contact*`, `app/api/*form*`, `app/api/email*`
- Booking system: `app/book*`, `app/appointment*`, `app/schedule*`, `app/api/*book*`
- Consultation flow: `app/*consult*`, `app/api/*consult*`
- Form submission handlers: search for "form submit", "POST /api"

**Commands:**
- Find contact-related pages: `find app -type f \( -name "*contact*" -o -name "*form*" \)`
- Find booking-related pages: `find app -type f \( -name "*book*" -o -name "*appoint*" \)`
- List API routes: `find app/api -type f -name "route.ts" -o -name "route.js"`
- Grep for form handling code
- Check for Firestore writes in API routes

### 3. Email Infrastructure
**Goal:** Find centralized email sending logic.

**Search Areas:**
- Email transporter module: `lib/email*`, `utils/email*`, `services/email*`
- Nodemailer setup: search for `nodemailer`, `transporter`, `sendMail`
- Email templates: `lib/email-templates/`, `templates/`, `emails/`
- Email sending in API routes: grep for `sendEmail`, `transporter.send`

**Commands:**
- Find email-related files: `find . -type f -name "*email*" | grep -v node_modules`
- Search for nodemailer imports
- Search for transporter.send() calls
- Check for environment variables: EMAIL_USER, SMTP_*, etc.

### 4. Page/Routing Layout
**Goal:** Understand App Router structure for natural chat widget placement.

**Search Areas:**
- App directory structure: `app/` layout
- Root layout: `app/layout.tsx`, `app/layout.mdx`
- Shared components: `components/layout/`, `components/common/`
- Navigation: `components/*nav*`, `components/*header*`
- Footer: `components/*footer*`, `app/layout*` footer section

**Commands:**
- Tree view of app/: `find app -type d | head -30`
- List all page.tsx files: `find app -name "page.tsx"`
- Check root layout for shared sections
- Grep for footer/widget mount points

### 5. Existing AI Usage
**Goal:** Confirm whether any LLM/chatbot integration exists.

**Search Areas:**
- API integrations: grep for "openai", "anthropic", "langchain", "gemini"
- Chat components: `components/*chat*`, `app/*chat*`
- LLM tools: search package.json for AI-related packages
- Agent/RAG code: search for "rag", "agent", "embedding"
- AI utilities: `lib/ai/`, `utils/ai/`, `services/ai/`

**Commands:**
- Search package.json for AI packages
- Grep entire codebase for LLM provider imports
- Find chat-related files
- Search for existing chatbot logic

## Execution Sequence

1. **Initial discovery (ctx_batch_execute):**
   - Project structure overview
   - File system layout
   - Package.json contents
   - All route definitions

2. **Content discovery (Glob + Grep):**
   - Find all content-bearing files
   - Identify page structure
   - Locate form components

3. **Deep search (ctx_search):**
   - Contact flow implementation
   - Email infrastructure
   - AI integration check
   - Routing layout details

4. **Targeted reads (Read):**
   - Specific file inspection for implementation details

## Success Criteria

A complete report will include:
- [x] List of 5-10 knowledge content sources with exact paths
- [x] Contact form page + API route with submission handling details
- [x] Booking/consultation flow paths and handlers
- [x] Email transporter location and exports
- [x] App Router directory structure (main sections)
- [x] Shared layout/footer/widget mount points
- [x] Confirmation of AI/chatbot existence (or absence)

