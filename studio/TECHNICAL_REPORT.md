# Technical Report: Aquarius

## 1. Project Overview

**Aquarius** is a web-based application designed to streamline the creation, management, and tracking of proformas, invoices, and related shipping documents for international trade. It provides a comprehensive internal dashboard for administrators and a separate, secure portal for clients to view their documents. The system is built to support multiple distinct companies (e.g., "Trade Evolution" and "Successful Trade"), ensuring data and branding are handled correctly for each entity.

The primary goal is to digitize and simplify the complex paperwork involved in global logistics, from initial sales orders to final payment tracking, using a modern and robust web stack.

## 2. Technology Stack

The application is built on a modern, scalable, and type-safe technology stack:

-   **Framework**: [Next.js](https://nextjs.org/) (v15) with the App Router for server-centric routing and rendering.
-   **Language**: [TypeScript](https://www.typescriptlang.org/) for end-to-end type safety.
-   **UI Library**: [React](https://reactjs.org/) (v18) with extensive use of Hooks and Server Components.
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/) for a collection of accessible and reusable components.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling, with a custom theme defined in `src/app/globals.css`.
-   **Data Fetching & State**: [TanStack Query (React Query)](https://tanstack.com/query/latest) for managing server state, caching, and mutations.
-   **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for robust schema-based validation.
-   **Backend & Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) for real-time data storage.
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) for both admin and client user management.
-   **File Storage**: [Firebase Storage](https://firebase.google.com/docs/storage) for handling file uploads (e.g., Bill of Lading).
-   **Icons**: [Lucide React](https://lucide.dev/) for a consistent and lightweight icon set.

## 3. Project Structure

The codebase is organized logically within the `src` directory to promote maintainability and separation of concerns.

-   `src/app/`: Contains all application routes following the Next.js App Router convention.
    -   `/` (or `/dashboard`), `/proformas`, `/clients`, `/products`, `/stats`: Routes for the administrative dashboard.
    -   `/login`: The login page for administrative users.
    -   `/landing`: The login/landing page for external clients.
    -   `/client-portal`: The base route for the secure client-only area.
    -   `/company-site`: A simple, static company marketing page.
-   `src/components/`: Reusable React components.
    -   `ui/`: Base components from ShadCN UI (Button, Card, Table, etc.).
    -   `layout/`: Components responsible for the overall page structure, like `AppLayout` and `SidebarNav`.
    -   `proforma/`, `invoice/`, `packing-list/`: Document-specific components designed for both on-screen rendering and printing.
-   `src/lib/`: Core libraries, utilities, and configuration.
    -   `firebase.ts`: Initializes the Firebase app and exports the `db`, `auth`, and `storage` instances.
    -   `number-generation.ts`: Contains critical business logic for generating formatted, sequential document numbers based on company and date.
-   `src/hooks/`: Custom React hooks that form the **data access layer**.
    -   `use-proformas.ts`, `use-clients.ts`, `use-products.ts`: These hooks abstract all Firestore CRUD (Create, Read, Update, Delete) operations. They use TanStack Query to fetch, cache, and mutate data, providing a clean API to the UI components.
-   `src/config/`: Application-wide configuration files.
    -   `links.ts`: Defines the structure and icons for the admin sidebar navigation.
    -   `company-details.ts`: Holds all static company information (addresses, bank details, logos) used for branding documents.
-   `src/types/`: Contains all global TypeScript type and interface definitions (e.g., `Proforma`, `Client`, `Product`).
-   `src/scripts/`: Standalone scripts for development purposes.
    -   `seed-db.ts`: A script to populate the Firestore database with initial client and product data. It requires admin credentials to run.

## 4. Core Features & Architecture

### 4.1. Data Management and State

-   **Backend**: Cloud Firestore is the source of truth for all data, organized into collections like `proformas`, `clients`, and `products`.
-   **Data Access Layer**: The application uses custom hooks in `src/hooks/` as a dedicated data layer. Components do not interact with Firestore directly. Instead, they use hooks like `useProformas()` to get data and `useUpdateProforma()` to make changes. This pattern centralizes data logic and simplifies components.
-   **Server State**: TanStack Query is used to manage all asynchronous server state. It handles caching, background refetching, and provides a seamless user experience with optimistic updates for mutations.

### 4.2. Authentication and Authorization

-   **Dual Login System**: The app has two distinct entry points: `/login` for admins and `/landing` for clients, both managed by Firebase Authentication.
-   **Route Protection**:
    -   **Admin Routes**: `src/components/layout/app-layout.tsx` contains logic that checks for an authenticated admin user on every render. If no user is found, it redirects to `/login`.
    -   **Client Routes**: `src/app/client-portal/layout.tsx` protects the client portal, redirecting unauthenticated users to `/landing`.
    -   **Admin-as-Client View**: To allow admins to preview a client's portal, a `sessionStorage` item (`isAdmin`) is set. The client portal layout checks for this flag and allows access without requiring the admin to log out.

### 4.3. Multi-Company Document Generation

The system is architected to handle multiple business entities ("Trade Evolution" and "Successful Trade").

-   **Data Association**: Proformas and Clients are linked to a specific company via a `company` field.
-   **Dynamic UI**: The "New Proforma" form filters the client dropdown based on the selected company. The `number-generation.ts` script creates different document number formats (e.g., `TRE-` vs. `ST-`) accordingly.
-   **Dynamic Branding**: The document components (e.g., `proforma-document.tsx`) are structured to render different templates, logos, and company details by checking the `proforma.company` field and pulling data from `config/company-details.ts`.

### 4.4. Document Management and Editing

-   **Full CRUD**: The application supports full create, read, update, and delete functionality for Proformas.
-   **Complex Forms**: The Proforma creation/editing forms use `react-hook-form` for state management of a large number of fields and `zod` for validation. Line items are managed using the `useFieldArray` hook.
-   **Sub-Document Editing**: From a master Proforma, users can generate and edit details for related documents (Invoice, Packing List). These specific edits (e.g., a custom Invoice Number) are saved back into the parent Proforma object in Firestore within dedicated fields like `editableInvoiceSpecificFields`, ensuring data remains centralized.
-   **File Uploads**: The "Bill of Lading" page integrates with Firebase Storage, allowing users to upload a PDF or image file, which is then linked to the corresponding Proforma.

## 5. How to Replicate and Run

To set up and run this project, follow these steps:

1.  **Firebase Setup**:
    -   Create a Firebase project.
    -   Enable Firestore, Firebase Authentication (with Email/Password), and Firebase Storage.
    -   Copy your project's Firebase configuration object into `src/lib/firebase.ts`.
2.  **Install Dependencies**: Run `npm install`.
3.  **Create Users**:
    -   In the Firebase Authentication console, create an **admin user** (e.g., `admin@aquarius.com`).
    -   Create at least one **client user** with an email that matches one of the clients in `src/lib/seed-data.ts` (e.g., `contact@disenostransformacion.com`).
4.  **Seed the Database**:
    -   Open `src/scripts/seed-db.ts`.
    -   Update the `ADMIN_EMAIL` and `ADMIN_PASSWORD` constants with the credentials for the admin user you created.
    -   Run the script from your terminal: `npm run seed`. This will clear and populate the `clients` and `products` collections in Firestore.
5.  **Run the Application**:
    -   Execute `npm run dev`.
    -   Navigate to `http://localhost:9002/login` to access the admin dashboard.
    -   Navigate to `http://localhost:9002/landing` to sign in as a client.
