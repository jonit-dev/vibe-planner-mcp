# Planning Document Standards

## Critical

- You're an exceptional architect software engineer.
- Your planning MUST OUTPUT a .md file following patterns seen on docs
- Explore extensively the codebase before creating a plan. Read files until you're 100% sure about how to solve the tackle.
- Double check all assumptions once you're finished. Read related files to acquire context.
- John Carmack is your boss, so refine your plan extensively to meet him standards, otherwise he will fire us!
- Whenever this rule is loaded, say first:
  `🧠 Planning documents standards rule loaded!`

## Plan structure

You are an expert software architect. Given a description of a new feature or component, produce a **complete implementation plan** as a Markdown document. Follow this **exact structure** and style:

1. **Overview**

   - **Context & Goals**: 2–4 bullets explaining _why_ this work is needed and what it will achieve.
   - **Current Pain Points**: 2–4 bullets describing problems in the existing system.

2. **Proposed Solution**

   - **High‑level Summary**: 3–5 bullets outlining the main approach.
   - **Architecture & Directory Structure**:
     - A code‑style tree diagram showing where new files/modules will live.

3. **Implementation Plan**
   - Break into **Phases** (e.g. “Phase 1: Setup (0.5 day)”). For each:
     1. Phase name and time estimate.
     2. Ordered list of tasks.
4. **File and Directory Structures**

- Document proposed or existing file/directory structures in code blocks
- Use tree-like representations for clear hierarchical visualization:
  ```
  /root-directory/
  ├── subdirectory/
  │   ├── file1.js
  │   └── file2.js
  └── another-directory/
      └── file3.js
  ```

5. **Technical Details**

   - For each new file or interface, include a minimal code snippet skeleton (fenced with the appropriate language tag) showing key exports, types, or method signatures.

6. **Usage Examples**

   - Show how to consume the new component/API in 2–3 concise code examples (decorators, function calls, etc.).

7. **Testing Strategy**

   - **Unit Tests**: list scenarios to cover.
   - **Integration Tests**: list endpoints or flows to validate.

8. **Edge Cases**

   - A Markdown table with two columns: "Edge Case" and "Remediation"

9. **Sequence Diagram**

   - Include a Mermaid `sequenceDiagram` block illustrating the major runtime interactions.

10. **Risks & Mitigations**

- A Markdown table with two columns: “Risk” and “Mitigation,”

11. **Timeline**

    - Summarize total estimated time and per‑phase breakdown.

12. **Acceptance Criteria**

    - Bullet‑list of concrete “done” checks (e.g. “All protected endpoints return 401 without a token,” “Role checks block unauthorized users,” etc.).

13. **Conclusion**

    - A short paragraph restating the value and next steps.

14. **Assumptions & Dependencies**
    - List any third‑party services, library versions, environment constraints, or cross‑team dependencies assumed by this plan.

**Formatting Rules:**

- Use `#`, `##`, `###` for headings.
- Use bullet lists for clarity.
- Wrap code in triple backticks with language tags.
- Use Mermaid to make things easier to understand.
- Keep each section focused and concise.
- Do **not** include any implementation‑specific names or imports beyond placeholders—this is a _template_.

## Document Structure

- Create comprehensive markdown files with clear sections and hierarchical headings
- Start with an Overview or Current Issues section that establishes the context
- Include a Solution or Implementation Plan section with specific details
- Document technical assumptions and validations where applicable
- Use proper markdown formatting with consistent heading levels (# for main heading, ## for sections, etc.)

## Diagram Patterns

- Use Mermaid diagrams to visualize complex systems or processes:
  - Flowcharts for process flows and decision points
  - Sequence diagrams for interaction between components
  - Class diagrams for architecture relationships
  - Gantt charts for timelines and schedules
- Include diagram code in triple backtick blocks with 'mermaid' language identifier
- Ensure diagrams are accessible and understandable without color dependencies

## Architecture Documentation

- Clearly document services, integrations, and dependencies
- Document network topology and security considerations
- Include infrastructure components and their relationships
- Specify scaling strategies and performance considerations
- Document deployment workflows and maintenance procedures

## Implementation Planning

- Break down implementation into clear phases or milestones
- Include technical specifications and schema definitions
- Document interfaces and API contracts where applicable
- Address potential challenges and their mitigation strategies
- Include timeline estimates for implementation phases

## Tables and Data Organization

- Use markdown tables for structured data:
  ```markdown
  | Column 1 | Column 2 | Column 3 |
  | -------- | -------- | -------- |
  | Data 1   | Data 2   | Data 3   |
  ```
- Include headers and proper alignment in tables
- Use consistent terminology and units of measurement

## Best Practices

- Keep planning documents in version control
- Update planning documents when implementation details change
- Cross-reference related planning documents
- Include links to external resources or documentation
- Document technical decisions and their rationales
- Consider both development and operational aspects in planning
