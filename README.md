# Fancy Field Goal

A lightweight HTML/CSS/JavaScript field-goal kicking prototype for Winter FancyFaire*.

Players can set kick power and horizontal aim with the accessible sliders and kick button, or swipe up on the football. A centered kick aims straight at the uprights; power changes the kick's distance and height, while horizontal aim and wind influence its path.

## Project structure

- `index.html` – game start screen and playable game UI
- `admin.html` – demo-only admin dashboard for prototype analytics
- `css/styles.css` – game styling and responsive layout
- `css/admin.css` – dashboard styling
- `js/game.js` – gameplay logic, touch/mouse gestures, scores, and local state
- `js/demo-data.js` – demo analytics data for the admin page
- `js/analytics.js` – dashboard rendering
- `assets/reti.png` – supporting brand image

## Local development

Open the project in a static web server or use a simple local server from the project root:

```bash
python -m http.server 8000
```

Then visit:

- http://localhost:8000/
- http://localhost:8000/admin.html

## GitHub Pages deployment

This project is designed for static deployment through GitHub Pages. Keep the relative asset references and use the repository name `fancy-fieldgoal`.

Live routes:

- https://ira-sfa.github.io/fancy-fieldgoal/
- https://ira-sfa.github.io/fancy-fieldgoal/admin.html

GitHub Pages publishes the `main` branch from the repository root.

## Notes

- All gameplay is browser-based and requires no backend.
- The prototype uses localStorage only for lightweight local player state.
- The admin dashboard is demo-only and is not connected to production analytics.
