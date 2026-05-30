# USYD Course Plan

A personal University of Sydney degree planning dashboard for a Bachelor of Science student planning a Computer Science major and Discrete Mathematics and Algorithms minor.

Live site: <https://yulinhenryou.github.io/usyd-course-plan/>

## What It Does

This is a single-page academic planning tool for checking degree structure, semester load, course choices and prerequisite risk. The current planning target is an accelerated path close to 2.5 years, so the page focuses on whether each semester is realistic rather than only listing courses.

Main features:

- Dashboard for 144cp degree progress, CS major, DMA minor, OLE, WAM and workload risk.
- Semester plan with locked, candidate and completed courses synced from the course library.
- Course library with search, prefix/type/workload/year filters and local course status marking.
- Prerequisite map for key CS, maths, data and systems bottlenecks.
- Reading preparation and academic reference section.
- Light/dark theme and local browser storage for planning state.

## Notes

Course status, marks, checklist progress, theme preference and course notes are stored in the browser through `localStorage`. They are not uploaded or synced between devices.

This site is a personal planning aid. Final enrolment decisions should still be checked against Sydney Student, the official USYD Handbook and current unit pages.

## Project Structure

- `index.html` - the full website, including HTML, CSS, JavaScript and course data.
- `publish.sh` - helper script for publishing updates.

## Local Use

Open `index.html` directly in a browser, or visit the GitHub Pages link above.
