# USYD Course Plan

A personal University of Sydney degree planning dashboard for a **Bachelor of Science (144cp)** with a **Computer Science major (48cp)** and **Software Development minor (36cp)**.

Live site: <https://yulinhenryou.github.io/usyd-course-plan/>

## What It Does

This is a single-page academic planning tool for checking degree structure, semester load, course choices and prerequisite risk. The current planning target is an accelerated path close to 2.5 years, so the page focuses on whether each semester is realistic rather than only listing courses.

Main features:

- Dashboard for degree credits, CS major, Software Development minor, OLE, WAM and workload estimates.
- Expandable major/minor structure with separate completed, locked and candidate credits for each requirement.
- Semester plan with locked, candidate and completed courses synced from the course library.
- Course library with search, prefix/type/workload/year filters and local course status marking.
- Prerequisite map for CS, software development, maths, data and other electives.
- Reading preparation and academic reference section.
- Light/dark theme and local browser storage for planning state.

## Degree Structure

The Software Development minor follows the [2026 Handbook table](https://www.sydney.edu.au/handbooks/science/table-a/subject-areas/software-development/unit-of-study-table.html):

- 12cp at 1000 level: INFO1110 and INFO1113 (official equivalents may apply).
- 18cp at 2000 level: COMP2123, SOFT2201 and SOFT2412.
- 6cp at 3000 level: **INFO3315 or SOFT3202**. No minor project requirement.

INFO1110, INFO1113 and COMP2123 are shared core units. Their 18cp can meet both components, but count only once toward the 144cp degree. Each structure slot is capped, prioritising completed, then locked, then candidate courses; excess electives count as other degree credits. The 72cp other-credit allowance includes BSc degree core and additional electives, not just unrestricted electives.

Semester recommendations contain required-path courses only. Software Development options use the verified 2026 offerings: SOFT2201, SOFT2412 and INFO3315 in S2; SOFT3202 in S1 after SOFT2201. Later years must be checked again. Existing maths courses remain available as electives.

## Notes

Course status, semester placement, marks, theme preference and course notes are stored in the browser through `localStorage`. Existing storage keys and records are retained when the degree configuration changes. Nothing is uploaded or synced between devices; local-file and GitHub Pages versions have separate browser storage.

This site is a personal planning aid, not a graduation or prerequisite eligibility checker. Component totals do not replace BSc degree-core requirements, enrolment restrictions or official credit assessment. SCPU3001 is a conditional CS project option with additional eligibility and corequisite restrictions, not a minor requirement. Final decisions should be checked against Sydney Student, the official USYD Handbook and current unit pages. An accelerated 2.5-year target is not a guaranteed completion date.

## Project Structure

- `index.html` - the full website, including HTML, CSS, JavaScript and course data.
- `publish.sh` - helper script for publishing updates.
- `tests/planner.test.cjs` - regression checks for course data, structure allocation and degree credit accounting.

## Local Use

Open `index.html` directly in a browser, or visit the GitHub Pages link above.

Run the regression checks with `node --test tests/planner.test.cjs`.
