import { Router } from 'express';

import { h } from 'preact';
import renderToString from 'preact-render-to-string';

const router = Router();

router.get('/', (req, res) => {
	// fetch any data here for whatever is at / :) 
	res.json({ title: 'Home', body: 'Hello world! :-)' })
});

router.get('/about', (req, res) => {
	// uncomment to make it cachable 
	// res.set('Cache-Control', 'public, max-age=3600');

	res.json({ title: 'About Us', body: 'Hello there :)' })
});

router.use((req, res) => {
	res.status(404)
	res.json(null)
})

export default router;