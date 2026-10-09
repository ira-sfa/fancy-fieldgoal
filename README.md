# Fancy Field Goal

A lightweight HTML/CSS/JavaScript field-goal kicking prototype for Winter FancyFaire*.

Players set target power and horizontal aim with the accessible sliders, press **START METER**, then tap **KICK** as the moving meter enters the highlighted zone. The timing window tightens and the wind strengthens with each kick; perfect-timed field goals earn bonus points. Players can also swipe up on the football once to set power and aim and start the meter, then swipe again to kick. A centered kick aims straight at the uprights, while power, horizontal aim, and wind influence its path.

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
