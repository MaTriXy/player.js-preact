import express, { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { h } from 'preact';
import parseUrl from 'parseurl';
import renderToString from 'preact-render-to-string';
import routes from './routes';

const app = express();
require('run-middleware')(app)

const DEFAULT_OPTIONS = {
	dirname: path.join(__dirname, '../../build'),
	bundle: path.join(__dirname, '../../build/ssr-build/ssr-bundle')
}

const subrequest = function (req) {
	return new Promise (
		(resolve) => app.runMiddleware(
			req.path,
			{
				original_req: req,
			},
			(rC, b, h) => resolve(JSON.parse(b)) // [responseCode, body, headers]
		)
	)
}

const shadowRequest = function (req) {
	let path = '/api' + req.path;
	let apiReq = Object.assign({}, req, { method: 'GET', path, url: path, originalUrl: path });

	parseUrl(apiReq);

	apiReq.res.headers = {};

	return subrequest(apiReq)
}

app.use(function(req, res, next) {
	res.ssr = function(options) {
		options = Object.assign(DEFAULT_OPTIONS, options)
		const bundle = require(options.bundle);

		let html = renderToString(h(bundle.default, { CLI_DATA: { preRenderData: options.props }}));

		html += '<script type="__PREACT_CLI_DATA__">' + JSON.stringify({
			preRenderData: options.props
		})

		let page = String(fs.readFileSync(path.join(options.dirname, 'index.html')))
		page = page.replace(/<div[^>]*>.*?(?=<\/script)/i, html)

		options.status && this.status(options.status)
		this.send(page)
	};
	res._headers = {};

	next();
});

app.use(routes);
app.use(express.static(DEFAULT_OPTIONS.dirname, { index: false }));

app.get('*', async (req, res) => {
	res.ssr({
		props: {
			url: req.url,
			data: await shadowRequest(req)
		}
	})
})

export default app;