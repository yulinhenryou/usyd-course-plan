# USYD Course Plan

A personal University of Sydney degree planning dashboard for a **Bachelor of Science (144cp)** with a **Computer Science major (48cp)** and **Statistics minor (36cp)**.

Live site: <https://yulinhenryou.github.io/usyd-course-plan/>

## What It Does

This is a single-page academic planning tool for checking degree structure, semester load, course choices and prerequisite risk. The current planning target is an accelerated path close to 2.5 years, so the page focuses on whether each semester is realistic rather than only listing courses.

Main features:

- Dashboard for degree credits, CS major, Statistics minor, OLE, WAM and workload estimates.
- Expandable major/minor structure with separate completed, locked and candidate credits for each requirement.
- Semester plan with locked, candidate and completed courses synced from the course library.
- Course library with search, prefix/type/workload/year filters and local course status marking.
- Prerequisite map for CS, statistics, maths, data and other electives.
- Reading preparation and academic reference section.
- Light/dark theme and local browser storage for planning state.

## Degree Structure

The Statistics minor follows the [2026 Handbook table](https://www.sydney.edu.au/handbooks/science/table-a/subject-areas/statistics/unit-of-study-table.html):

- 6cp 1000-level core: **MATH1061** (official advanced / SSP equivalents may apply).
- 6cp 1000-level Mathematics or Data Science: **MATH1062 or DATA1001** (official equivalents may apply).
- 12cp 2000-level core: **DATA2002 and STAT2011**.
- 12cp 3000-level selective: the current library models **STAT3021, STAT3022, STAT3023 and STAT3888** as the available choices; two 6cp units fill the slot. The official table also contains advanced alternatives that must be checked separately.

The CS major and Statistics minor have no shared component units in this model. MATH1061 and DATA1001 may also satisfy BSc degree-core rules, but each unit still counts only once toward the 144cp degree. Each structure slot is capped, prioritising completed, then locked, then candidate courses; excess units count as other degree credits. The 54cp other-credit target includes BSc degree core and additional electives, not just unrestricted electives.

Semester recommendations contain required-path courses only. The current third-year route recommends STAT3022 in S1 and STAT3888 in S2; STAT3021 and STAT3023 remain selectable alternatives. Because STAT3888 and the CS project are both project-heavy, the S2 workload warning remains visible and should be reviewed before locking the plan. MATH2069, QBUS3330 and the software-development units remain available as other electives rather than Statistics minor credit. Later-year offerings must be checked again.

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
