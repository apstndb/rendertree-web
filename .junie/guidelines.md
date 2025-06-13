# Project Guidelines

## Project Structure
This project is a web-based tool for visualizing Google Cloud Spanner execution plans.
The main components are:
* TypeScript + React frontend
* Go WebAssembly backend
* Vite build system

## Coding Conventions
* **Language**: All source code and comments should be written in English
* **Code Style**: 
  - TypeScript code should follow ESLint rules
  - Go code should follow go fmt rules

## Build Process
* `npm run dev` - Start the development server
* `./dev.sh` - Start the development server in the background
* `./stop-dev.sh` - Stop the background development server
* `npm run build` - Build for production
* `npm run preview` - Preview the built application

## Testing
* Run `npm run build` before submitting changes to ensure the build completes successfully
* Currently, no automated tests are implemented

## Notes
* WebAssembly file building is automated by the Vite plugin
* GitHub Actions is used for automatic deployment to GitHub Pages
