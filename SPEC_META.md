# Meta Specification for `SPEC.md` Files (LLM Agent Guidance)

**Attention LLM Agent:** This document is your primary guide for understanding and interacting with `SPEC.md` files within the LingoLog codebase. Read this carefully to understand your role and responsibilities regarding these files.

## 1. What are `SPEC.md` files?

`SPEC.md` files are **specification documents** written in Markdown. They are strategically placed within the directory structure, usually alongside the code or feature they describe. Think of them as localized documentation, requirement lists, and status reports for the specific code module they reside with.

## 2. Your Role Regarding `SPEC.md` Files

Your interaction with `SPEC.md` files is crucial for successful code generation and modification. Your primary responsibilities are:

*   **Contextual Understanding:** **ALWAYS** consult the `SPEC.md` file within a directory *before* analyzing or modifying any code in that directory or its subdirectories. It provides the necessary context, goals, and constraints for the code.
*   **Requirement Adherence:** Use the requirements listed (often with checkboxes) to guide your implementation or modification logic. Ensure your changes align with the specified goals.
*   **Status Awareness:** Check the implementation status (using checkboxes like `- [ ]` for incomplete and `- [x]` for complete) to understand what parts of the specification have already been addressed.
*   **File Structure Orientation:** Use the "Directory Structure" section to understand the layout and purpose of files within the current scope.
*   **Potential Updates (If Instructed):** You *may* be asked to update a `SPEC.md` file after making code changes. This typically involves:
    *   Marking requirements checkboxes (`- [ ]` -> `- [x]`) as complete.
    *   Updating the "Directory Structure" section if you add, remove, or rename files.
    *   Adding notes about significant design changes if they deviate from the original spec.
    **Do not update `SPEC.md` files unless specifically instructed to do so in the request.**

## 3. Why do `SPEC.md` files exist?

These files are essential for several reasons, particularly for AI collaboration:

*   **Source of Truth:** They centralize information, reducing ambiguity and your need to infer intent solely from code.
*   **Clear Goals:** They explicitly state the objectives for the code in the directory.
*   **Enable Effective AI Collaboration:** They provide you with structured information (requirements, status, file layout) needed to perform tasks accurately and efficiently.
*   **Track Progress:** They serve as a visible indicator of feature completeness.
*   **Support Maintenance & Onboarding:** They help any agent (human or AI) quickly grasp the purpose and state of a code module.

## 4. Expected Format (Pay Attention!)

Consistency in format is key for reliable parsing. Adhere to these formatting principles when reading and *especially* if asked to update a `SPEC.md` file:

*   **Markdown:** Use standard Markdown syntax.
*   **Clear Structure:** Utilize headings (`#`, `##`), lists, and code blocks.
*   **Checkboxes for Status:** **Crucially**, use `- [ ]` for incomplete items and `- [x]` for completed items in requirement lists or status sections. Parse these accurately.
*   **Directory Structure Section:** Look for and maintain a section describing the key files/folders in the current directory. This is vital for your navigation.
*   **Clarity:** Ensure language is clear and unambiguous.
*   **Links:** Use links to related specs or code files where appropriate.
*   **Maintain Existing Style:** When updating, follow the style and structure of the specific `SPEC.md` file you are editing.

## 5. Updating `SPEC.md` Files

As mentioned in Section 2, you generally **read** these files for context. However, if a request explicitly asks you to update the `SPEC.md` after modifying code:

*   **Update Checkboxes:** Change `- [ ]` to `- [x]` for requirements you have fulfilled.
*   **Update Directory Structure:** If you added `new_component.tsx` or removed `old_util.ts`, reflect this change in the directory structure description.
*   **Reflect Major Changes:** If your code implementation significantly deviates from the original design described, add a note explaining the change and the reason, if known.
*   **Use Exact File Listing Format:** If providing an updated `SPEC.md`, ensure you output the *entire file content* within the specified ```markdown ... ``` block format.

## 6. Key Information Sections for You to Find

When reading a `SPEC.md`, prioritize finding and understanding these sections:

*   **Overview/Purpose:** What is this module supposed to do?
*   **Functional Requirements / Features:** What are the specific tasks? (Look for checkboxes `- [ ]`/`- [x]`).
*   **Implementation Status:** What is already done? (May be checkboxes or a summary).
*   **Directory Structure:** What are the important files/folders here and what do they do?
*   **Technical Design/Architecture:** How is it supposed to be built?
*   **API/Interfaces (If applicable):** How does it interact with other parts?
*   **Data Structures/Schema (If applicable):** What data does it handle?

## 7. Special Commands

*   **`spec::update`**: Review recent code changes and update any relevant `SPEC.md` files (but **not** this `SPEC_META.md` file) to reflect the current implementation status, directory structure, or functional descriptions. (Agent Action: Analyze code changes since the last `spec::update`, identify affected `SPEC.md` files, and propose updates like checking/unchecking requirement boxes, modifying directory listings, or adjusting descriptions).
*   **`spec::diff`**: Identify and list all requirements marked as incomplete (`- [ ]`) across all detectable `SPEC.md` files within the project. (Agent Action: Scan all `SPEC.md` files, extract lines containing `- [ ]`, and present them grouped by file path).

By carefully following these guidelines, you will be able to effectively utilize `SPEC.md` files to understand the codebase and perform your tasks accurately.
