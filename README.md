# legs

Legs is a ready-to-go template app, based on Preact, with support for server side rendering and Fluent UI. 

With support for Preact's React compatibility layer baked in, Legs will help you build websites with smaller footprints. 

Clone the repository, edit package.json and start hacking! 

## Structure

`src/app` should contain the frontend code for your application. It's recommended to create a directory for each component, and use the filenames index.js and style.css.

`src/server` is the code for the built-in web server. 

`src/style` contains application-wide stylesheets. 

## Commands

`yarn dev` Runs a development server. 

`yarn build [--dest build] [--no-prerender]` Builds a production-ready bundle. Use `--no-prerender` to disable SSR. 

`yarn serve` Builds a bundle and serves it on port 8085 (or $PORT), using the built-in web server. 


## Notes

When developing SSR apps for the first time, remember that our client-side code will probably get invoked under a node environment, and won't have access to your standard browser namespace. A workaround is to gate code with `if (typeof window === 'undefined') return;`.
